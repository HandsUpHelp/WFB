
import React, { useState, useEffect } from 'react';
import { ViewState, GameRole } from './types';
import { SHIFT_DURATION_MS, MAX_STRESS } from './constants';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { WorkCoachView } from './components/WorkCoachView';
import { DecisionMakerView } from './components/DecisionMakerView';
import { CaseManagerView } from './components/CaseManagerView';
import { ShiftTimer } from './components/ShiftTimer';
import { GlitchEffect } from './components/GlitchEffect';
import { motion } from 'framer-motion';
import { audioService } from './services/audioService';
import { Eye, Monitor } from 'lucide-react';

type POV = 'COMPUTER' | 'DESK';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOGIN);
  const [selectedRole, setSelectedRole] = useState<GameRole>(GameRole.NONE);
  const [stress, setStress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SHIFT_DURATION_MS);
  const [isPaused, setIsPaused] = useState(false);
  const [pov, setPov] = useState<POV>('COMPUTER');

  // Timer Logic
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (viewState === ViewState.GAMEPLAY && !isPaused) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            setViewState(ViewState.SHIFT_END);
            return 0;
          }
          return prev - 100; 
        });
        setStress(s => Math.min(MAX_STRESS, s + 0.02));
      }, 100);
    }
    return () => clearInterval(timer);
  }, [viewState, isPaused]);

  const handleLogin = () => {
    audioService.init();
    audioService.playClick();
    setViewState(ViewState.DASHBOARD);
  };

  const handleRoleSelect = (role: GameRole) => {
    audioService.playClick();
    setSelectedRole(role);
    setViewState(ViewState.GAMEPLAY);
    setTimeLeft(SHIFT_DURATION_MS);
    setStress(10);
    setIsPaused(false);
  };

  const handleExit = () => {
    setViewState(ViewState.DASHBOARD);
    setStress(0);
    setSelectedRole(GameRole.NONE);
    setPov('COMPUTER');
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleAction = (impact: number) => {
    setStress(prev => Math.min(MAX_STRESS, Math.max(0, prev + impact)));
    
    // Screen shake on monitor only
    const monitor = document.getElementById('monitor-screen');
    if (monitor && impact > 5) {
       monitor.animate([
         { transform: 'translate(0,0)' },
         { transform: `translate(${Math.random()*4 - 2}px, ${Math.random()*4 - 2}px)` },
         { transform: 'translate(0,0)' }
       ], { duration: 200 });
    }
  };

  const handleTakeBreak = () => {
    const timeCost = 20000; 
    setTimeLeft(prev => Math.max(0, prev - timeCost));
    setStress(prev => Math.max(0, prev - 15));
    
    // Break animation
    setPov('DESK');
    setTimeout(() => setPov('COMPUTER'), 2000);
  };

  const togglePOV = () => {
    audioService.playThud();
    setPov(prev => prev === 'COMPUTER' ? 'DESK' : 'COMPUTER');
  }

  // Keyboard Shortcut for POV
  useEffect(() => {
    if (viewState !== ViewState.GAMEPLAY) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); 
        audioService.playThud();
        setPov(prev => prev === 'COMPUTER' ? 'DESK' : 'COMPUTER');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState]);

  const renderAppContent = () => {
    switch (viewState) {
      case ViewState.LOGIN:
        return <LoginScreen onLogin={handleLogin} />;
      case ViewState.DASHBOARD:
        return <Dashboard onSelectRole={handleRoleSelect} />;
      case ViewState.GAMEPLAY:
        switch (selectedRole) {
          case GameRole.WORK_COACH:
            return <WorkCoachView onAction={handleAction} />;
          case GameRole.DECISION_MAKER:
            return <DecisionMakerView onAction={handleAction} />;
          case GameRole.CASE_MANAGER:
            return <CaseManagerView onAction={handleAction} />;
          default:
            return <div>Unknown Role</div>;
        }
      case ViewState.SHIFT_END:
        return (
          <div className="h-full flex flex-col items-center justify-center bg-black text-white p-8 text-center">
             <h1 className="text-6xl font-bold mb-4 text-[#ffdd00]">SHIFT ENDED</h1>
             <p className="text-2xl mb-8">Final Stress Level: {Math.round(stress)}%</p>
             <button 
               onClick={() => window.location.reload()} 
               className="mt-12 px-8 py-4 bg-white text-black font-bold uppercase hover:bg-gray-200"
             >
               Clock In Again
             </button>
          </div>
        );
    }
  };

  // --- 3D STYLES & TRANSFORMS ---
  const isDeskMode = pov === 'DESK';
  
  // Transform Logic:
  // Monitor is positioned at translateX(35%) (Right side of desk)
  // COMPUTER VIEW: Move World Left (-35%) so monitor is centered. Zoom in (translateZ).
  // DESK VIEW: Move World Center (0%). Pull back (translateZ -600). Rotate slightly to see claimant.
  const worldTransform = isDeskMode 
    ? 'translateX(0%) translateY(200px) translateZ(-600px) rotateX(5deg)' 
    : 'translateX(-35%) translateY(0px) translateZ(100px) rotateX(0deg)';

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1a1a1a] perspective-[1000px] font-sans select-none flex flex-col">
      
      {/* --- HUD HEADER LAYER (Fixed on top of screen, outside 3D world) --- */}
      <div id="hud-header" className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl z-[100] pointer-events-none flex justify-center">
        {/* Content injected via Portal from Views */}
      </div>

      {/* --- 3D VIEWPORT (Fills remaining space above footer) --- */}
      <div className="flex-1 relative overflow-hidden perspective-[1000px]">
        
        {/* --- THE WORLD CONTAINER --- */}
        <div 
          className="relative w-full h-full transition-transform duration-700 ease-in-out preserve-3d"
          style={{ transform: worldTransform }}
        >

          {/* --- 1. BACKGROUND ROOM (Walls) --- */}
          <div 
            className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gray-800 z-[-10]"
            style={{
              transform: 'translateZ(-800px)',
              backgroundImage: 'radial-gradient(circle at 50% 50%, #555 0%, #1a1a1a 80%)'
            }}
          >
            {/* Door/Window decorations */}
            <div className="absolute top-[30%] left-[20%] w-48 h-96 bg-[#2a2a2a] border-4 border-[#333] blur-[1px]" />
            <div className="absolute top-[35%] right-[20%] w-80 h-64 bg-[#2a2a2a] rounded blur-[1px] border border-[#333]" />
          </div>


          {/* --- 2. THE CLAIMANT'S CHAIR (Center of Desk) --- */}
          <div 
            id="claimant-seat"
            className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[500px] h-[600px] flex items-center justify-center z-0 transition-all duration-500"
            style={{
              transform: 'translateZ(-650px)',
              opacity: isDeskMode ? 1 : 0.1, 
              filter: isDeskMode ? 'blur(0px)' : 'blur(4px)'
            }}
          >
            {/* Portal Target for Claimant Visuals */}
          </div>


          {/* --- 3. THE DESK SURFACE --- */}
          <div 
            className="absolute bottom-[-400px] left-[-50%] w-[200%] h-[800px] bg-[#8b5e3c] z-10"
            style={{
              transform: 'rotateX(75deg) translateZ(-200px)',
              background: `
                linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.0)),
                repeating-linear-gradient(90deg, #9e7555 0px, #8b5e3c 2px, #a87b59 40px)
              `,
              boxShadow: 'inset 0 100px 100px rgba(0,0,0,0.5)'
            }}
          >
            {/* Desk Clutter: Center/Left (Since monitor is Right) */}
            <div className="absolute top-[20%] left-[35%] w-48 h-64 bg-white opacity-90 -rotate-3 shadow-sm flex items-center justify-center text-gray-300 text-xs">CONFIDENTIAL</div>
            <div className="absolute top-[25%] left-[48%] w-12 h-12 rounded-full bg-[#2a2a2a] opacity-30 blur-sm" /> {/* Mug stain */}
            
            {/* Coffee Mug (Left side now) */}
            <div className="absolute top-[40%] left-[30%] w-16 h-16 rounded-full bg-[#1d70b8] shadow-lg flex items-center justify-center transform -translate-y-8">
               <div className="w-14 h-14 rounded-full bg-[#3e3026] opacity-90" />
               <div className="absolute -left-4 w-6 h-8 border-4 border-[#1d70b8] rounded-l-lg" />
               <div className="absolute -top-10 opacity-40 animate-pulse w-8 h-16 bg-gradient-to-t from-white to-transparent blur-md" />
            </div>
          </div>


          {/* --- 4. THE MONITOR ASSEMBLY (OFFSET TO RIGHT) --- */}
          {/* We translate X by 35% to move it to the right side of the desk */}
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none translate-x-[35%]"> 
            
            {/* Wrapper to hold screen + stand together */}
            <div 
               className="relative pointer-events-auto transition-transform duration-700"
               style={{
                  // Slight rotation to face the user who sits center
                  transform: 'rotateY(-5deg)'
               }}
            >
              {/* MONITOR STAND */}
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-[#333] to-[#111] shadow-2xl z-0" />
              <div className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-80 h-10 bg-[#111] rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-0" />

              {/* MONITOR BEZEL */}
              <div className="w-[85vw] h-[80vh] max-w-[1300px] bg-[#111] rounded-xl p-4 shadow-[0_0_0_1px_#333,0_30px_60px_rgba(0,0,0,0.9)] relative">
                
                {/* Branding */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-gray-500 text-[10px] font-bold tracking-[0.4em] z-50">NECRO-SYNC</div>
                <div className="absolute bottom-2 right-8 w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#00ff00] animate-pulse z-50" />

                {/* Post-it Note */}
                <div className="absolute -left-6 bottom-20 w-24 h-24 bg-[#ffff88] shadow-lg -rotate-6 text-black p-2 text-xs leading-tight z-50 font-handwriting transform origin-top-right">
                   <span className="font-bold block border-b border-black/20 mb-1">Targets:</span>
                   Sanctions: 5<br/>
                   Approvals: 20<br/>
                   <span className="text-red-600 font-bold">NO MERCY</span>
                </div>

                {/* SCREEN INNER */}
                <div className="w-full h-full bg-black rounded overflow-hidden relative border border-[#333]">
                  
                  {/* ACTUAL APP CONTENT */}
                  <div 
                    id="monitor-screen"
                    className="w-full h-full bg-[#f3f2f1] relative overflow-hidden flex flex-col"
                    // REMOVED: filter styling that caused text blur
                  >
                    <GlitchEffect stress={stress} />

                    {viewState === ViewState.GAMEPLAY && (
                      <ShiftTimer 
                        timeLeft={timeLeft} 
                        stress={stress} 
                        isPaused={isPaused}
                        onTakeBreak={handleTakeBreak} 
                        onTogglePause={handleTogglePause}
                        onExit={handleExit} 
                      />
                    )}
                    
                    <motion.main 
                      key={viewState}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex-1 relative overflow-hidden"
                    >
                      {renderAppContent()}
                    </motion.main>

                    {isPaused && (
                      <div className="absolute top-20 right-4 z-50 pointer-events-none">
                        <span className="bg-[#ffdd00] text-black px-2 py-1 text-xs font-bold border border-black shadow-sm">SYSTEM HALTED</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Subtle Reflection (Reduced intensity) */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-40 mix-blend-overlay opacity-30" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- FIXED FOOTER CONTROLS --- */}
      <div className="h-20 bg-[#0b0c0c] border-t-4 border-[#1d70b8] z-[200] flex items-center justify-between px-8 shrink-0 relative">
          
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#00ff00]"></div>
            <span className="text-white/70 font-mono text-sm uppercase tracking-widest">Sim-Link Active</span>
          </div>

          {viewState === ViewState.GAMEPLAY && (
            <div className="flex items-center gap-4">
              <span className="text-white/50 text-xs text-center font-mono uppercase tracking-widest mr-4 hidden md:inline">
                [SPACEBAR] TO SWIVEL
              </span>
              <button
                onClick={togglePOV}
                className={`
                  flex items-center gap-3 px-6 py-2 rounded-full font-bold text-sm transition-all hover:scale-105 border-2 border-white/20
                  ${isDeskMode ? 'bg-[#1d70b8] text-white shadow-[0_0_20px_rgba(29,112,184,0.5)]' : 'bg-white text-[#1d70b8]'}
                `}
              >
                {isDeskMode ? <Monitor size={18} /> : <Eye size={18} />}
                {isDeskMode ? "COMPUTER VIEW" : "DESK VIEW"}
              </button>
            </div>
          )}

          <div className="text-white/30 text-xs font-mono">v0.9.2</div>
      </div>

    </div>
  );
};

export default App;
