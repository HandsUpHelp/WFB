
import React from 'react';
import { SHIFT_DURATION_MS } from '../constants';
import { motion } from 'framer-motion';
import { Coffee, LayoutGrid, PauseCircle, PlayCircle } from 'lucide-react';
import { audioService } from '../services/audioService';

interface ShiftTimerProps {
  timeLeft: number;
  stress: number;
  isPaused: boolean;
  onTakeBreak: () => void;
  onTogglePause: () => void;
  onExit: () => void;
}

export const ShiftTimer: React.FC<ShiftTimerProps> = ({ timeLeft, stress, isPaused, onTakeBreak, onTogglePause, onExit }) => {
  const progress = (timeLeft / SHIFT_DURATION_MS) * 100;
  
  // Time Calculation
  const elapsedRealMs = SHIFT_DURATION_MS - timeLeft;
  const elapsedGameSeconds = (elapsedRealMs / 1000) * 12; 
  
  const startHour = 8;
  const startMinute = 0;
  
  const totalGameMinutes = startMinute + (elapsedGameSeconds / 60);
  const currentHour = Math.floor(startHour + totalGameMinutes / 60);
  const currentMinute = Math.floor(totalGameMinutes % 60);
  
  const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

  const handleBreak = () => {
    if (isPaused) return;
    audioService.playClick();
    onTakeBreak();
  };

  const handleHomeClick = () => {
    audioService.playClick();
    onExit();
  };

  const handlePause = () => {
    audioService.playClick();
    onTogglePause();
  };

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-[#0b0c0c] text-white border-b-4 border-[#1d70b8] shadow-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleHomeClick}
            className="flex items-center gap-2 text-xl font-bold tracking-tighter hover:text-[#ffdd00] transition-colors focus:outline-none"
            title="Return to Dashboard"
          >
             <LayoutGrid size={20} />
             <span className="hidden sm:inline">DASHBOARD</span>
          </button>
          <span className="border-l border-gray-600 pl-4 text-sm font-light hidden sm:inline">Department of Social Affairs</span>
        </div>
        
        <div className="flex items-center space-x-6">
          
          {/* CONTROLS */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePause}
              className={`p-2 rounded transition-colors ${isPaused ? 'bg-[#ffdd00] text-black' : 'bg-[#282828] hover:bg-gray-700'}`}
              title={isPaused ? "Resume Shift" : "Pause Shift"}
            >
              {isPaused ? <PlayCircle size={20} /> : <PauseCircle size={20} />}
            </button>

            <button 
              onClick={handleBreak}
              disabled={isPaused}
              className="flex items-center space-x-2 bg-[#282828] hover:bg-[#333] px-3 py-1.5 rounded border border-gray-600 active:translate-y-1 transition-all disabled:opacity-50"
              title="Take a Break (-15% Stress)"
            >
              <Coffee size={16} className="text-white" />
              <span className="text-xs uppercase font-bold hidden sm:inline">Break</span>
            </button>
          </div>

          {/* CLOCK */}
          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase tracking-widest">Current Time</div>
            <div className={`font-mono text-xl font-bold ${isPaused ? 'animate-pulse text-gray-500' : 'text-[#ffdd00]'}`}>
              {timeString} {isPaused && "(PAUSED)"}
            </div>
          </div>

          {/* STATUS BARS */}
          <div className="w-32 sm:w-48">
             <div className="flex justify-between text-xs uppercase mb-1">
               <span>Shift</span>
               <span className={stress > 70 ? "text-red-500 animate-pulse font-bold" : "text-gray-400"}>
                 Stress: {Math.round(stress)}%
               </span>
             </div>
             <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700 relative">
               {/* Stress Indicator Overlay */}
               <motion.div 
                  className="absolute top-0 left-0 h-full bg-red-600 mix-blend-overlay z-10"
                  initial={{ width: '0%' }}
                  animate={{ width: `${stress}%` }}
               />
               <motion.div 
                 className="h-full bg-[#1d70b8]"
                 initial={{ width: '100%' }}
                 animate={{ width: `${progress}%` }}
                 transition={{ ease: "linear", duration: isPaused ? 0 : 1 }}
               />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
