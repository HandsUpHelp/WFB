
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generateClaimantProfile, generateDialogueState } from '../services/geminiService';
import { ClaimantProfile, DialogueOption, DialogueTurn } from '../types';
import { JuicyButton } from './UI/JuicyButton';
import { AlertTriangle, Eye, Phone, Mic, MessageSquare, FileText, User, Clipboard, Calendar, MapPin, Hash, History } from 'lucide-react';
import { audioService } from '../services/audioService';

interface WorkCoachProps {
  onAction: (stressImpact: number) => void;
}

const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayed(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 35); 
    return () => clearInterval(intervalId);
  }, [text]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && <span className="animate-pulse inline-block ml-1 w-2 h-4 bg-[#1d70b8] align-middle"></span>}
    </span>
  );
};

export const WorkCoachView: React.FC<WorkCoachProps> = ({ onAction }) => {
  const [claimant, setClaimant] = useState<ClaimantProfile | null>(null);
  const [appointmentMode, setAppointmentMode] = useState<'FACE' | 'PHONE'>('FACE');
  const [history, setHistory] = useState<DialogueTurn[]>([]);
  const [options, setOptions] = useState<DialogueOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [fileTab, setFileTab] = useState<'DETAILS' | 'JOURNAL'>('DETAILS');
  
  const [observing, setObserving] = useState(false);
  const [observationText, setObservationText] = useState<string>("");
  const [referralProgress, setReferralProgress] = useState(0);
  const [isReferralActive, setIsReferralActive] = useState(false);
  const [journalHighlight, setJournalHighlight] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Portal Targets
  const seatElement = document.getElementById('claimant-seat');
  const hudElement = document.getElementById('hud-header');

  useEffect(() => {
    loadNewClaimant();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isReferralActive) {
      interval = setInterval(() => {
        setReferralProgress(prev => {
          if (prev >= 100) {
            handleFinalDecision('Referral');
            return 100;
          }
          return prev + 2;
        });
      }, 20);
    } else {
      setReferralProgress(0);
    }
    return () => clearInterval(interval);
  }, [isReferralActive]);

  const loadNewClaimant = async () => {
    setClaimant(null);
    setHistory([]);
    setShowDecision(false);
    setFileTab('DETAILS');
    setAppointmentMode(Math.random() > 0.5 ? 'FACE' : 'PHONE');
    
    const newClaimant = await generateClaimantProfile();
    setClaimant(newClaimant);
    
    setOptions([
      { id: 'intro1', text: "Can you confirm your full name and date of birth?", tone: 'Procedural' },
      { id: 'intro2', text: "I see you've reported an issue. Tell me about it.", tone: 'Empathetic' },
      { id: 'intro3', text: "Why haven't you updated your journal?", tone: 'Direct' }
    ]);
  };

  const handleOptionSelect = async (option: DialogueOption) => {
    if (!claimant) return;
    audioService.playClick();
    
    const newHistory = [...history, { speaker: 'Player' as const, text: option.text }];
    setHistory(newHistory);
    setLoading(true);
    setOptions([]);

    const result = await generateDialogueState(newHistory, claimant, option.text);
    
    setLoading(false);
    setHistory(prev => [...prev, { speaker: 'Claimant', text: result.reply }]);
    setOptions(result.options);
  };

  const handleObserve = () => {
    if (!claimant) return;
    setObserving(true);
    audioService.playStatic();
    
    const visualSafe = ["Looking around room", "Sipping water", "Checking watch", "Reading poster"];
    const visualSus = ["Avoids gaze", "Sweating", "Tapping foot", "Fidgeting"];
    const audioSafe = ["Voice steady", "Background quiet", "Clear tone", "Polite"];
    const audioSus = ["Voice trembling", "Shuffling papers", "Hesitant", "Defensive tone"];

    const cueSet = appointmentMode === 'FACE'
      ? (claimant.sincerityScore > 50 ? visualSafe : visualSus)
      : (claimant.sincerityScore > 50 ? audioSafe : audioSus);
    
    const randomCue = cueSet[Math.floor(Math.random() * cueSet.length)];
    setObservationText(randomCue);
    onAction(1);
  };

  const handleCheckJournal = () => {
    audioService.playClick();
    setFileTab('JOURNAL');
    setJournalHighlight(true);
    setTimeout(() => setJournalHighlight(false), 1500);
    onAction(-1); 
  };

  const handleFinalDecision = (type: 'Sign' | 'Referral') => {
    if (!claimant) return;
    const isHonest = claimant.sincerityScore > 50;
    let stressImpact = 0;

    if (type === 'Sign') {
      audioService.playThud();
      stressImpact = isHonest ? -5 : 5; 
    } else {
      setIsReferralActive(false);
      audioService.playAlarm();
      stressImpact = isHonest ? 10 : 5;
    }

    onAction(stressImpact);
    loadNewClaimant();
  };

  const switchTab = (tab: 'DETAILS' | 'JOURNAL') => {
    audioService.playClick();
    setFileTab(tab);
  }

  if (!claimant) {
    return <div className="h-full flex items-center justify-center font-mono text-xl animate-pulse text-gray-500">ESTABLISHING CONNECTION...</div>;
  }

  // RENDER THE CLAIMANT (In the 3D world via Portal)
  const ClaimantVisual = (
    <div className="w-[500px] h-[500px] flex flex-col items-center justify-center relative">
        {appointmentMode === 'PHONE' ? (
          <div className="relative flex flex-col items-center animate-in fade-in duration-1000">
              {/* Floating Phone Visualization */}
              <div className="w-32 h-64 bg-black rounded-3xl border-4 border-gray-700 shadow-[0_0_50px_rgba(0,255,0,0.2)] flex flex-col items-center justify-center p-4 mb-8 relative">
                 <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center animate-pulse mb-4">
                    <Phone size={32} className="text-green-500" />
                 </div>
                 <div className="w-full h-1 bg-gray-800 rounded overflow-hidden">
                    <motion.div 
                      className="h-full bg-green-500"
                      animate={{ width: loading ? '10%' : '100%' }}
                      transition={{ repeat: Infinity, duration: 0.5, repeatType: 'reverse' }}
                    />
                 </div>
                 <p className="text-green-500 font-mono text-xs mt-2">CONNECTED</p>
              </div>
              
              {/* Audio Waveform in 3D space */}
              <div className="flex gap-1 h-16 items-center">
                 {[...Array(10)].map((_, i) => (
                   <motion.div 
                      key={i}
                      className="w-4 bg-green-500/50"
                      animate={{ height: Math.random() * 64 + 10 }}
                      transition={{ duration: 0.2, repeat: Infinity }}
                   />
                 ))}
              </div>
          </div>
        ) : (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
             {/* The Person */}
             <div className="w-64 h-64 bg-[#d1d5db] rounded-full border-8 border-[#9ca3af] shadow-2xl flex items-center justify-center relative group">
                <User size={160} className="text-white drop-shadow-lg" />
                
                {/* Observation Overlay (Only visible when observing) */}
                {observing && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 font-bold uppercase tracking-widest rounded shadow-xl z-50 whitespace-nowrap animate-bounce">
                    ! {observationText}
                  </div>
                )}
             </div>
             
             {/* Speech Bubble in World Space */}
             {history.length > 0 && history[history.length - 1].speaker === 'Claimant' && (
                <div className="absolute -right-48 top-0 bg-white p-6 rounded-3xl rounded-bl-none shadow-2xl max-w-xs border-4 border-gray-200 z-20">
                   <p className="font-serif text-xl leading-snug text-black">
                     "<TypewriterText text={history[history.length - 1].text} />"
                   </p>
                </div>
             )}
          </motion.div>
        )}
    </div>
  );

  return (
    <>
      {/* PORTAL: Render Claimant in the Seat */}
      {seatElement && createPortal(ClaimantVisual, seatElement)}

      {/* PORTAL: Render Header HUD in the Sky */}
      {hudElement && createPortal(
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="w-full bg-[#1d70b8] text-white p-4 flex justify-between items-center shadow-2xl rounded-xl pointer-events-auto border-4 border-black/20 backdrop-blur-md"
        >
           <div>
              <h2 className="font-bold text-xl flex items-center gap-2">
                <User size={24} /> {claimant.name} 
                <span className="text-sm font-normal opacity-75 font-mono">({claimant.nino})</span>
              </h2>
              <p className="text-xs uppercase tracking-widest mt-1 opacity-80">
                 {appointmentMode === 'FACE' ? 'In-Person Interview' : 'Telephone Assessment'}
              </p>
           </div>
           <div className="text-right">
              <div className={`px-3 py-1 rounded text-xs font-bold uppercase ${loading ? 'bg-yellow-400 text-black animate-pulse' : 'bg-green-500 text-white'}`}>
                 {loading ? 'Claimant Speaking...' : 'Awaiting Input'}
              </div>
           </div>
        </motion.div>,
        hudElement
      )}

      {/* SCREEN: The Work Coach Interface */}
      <div className="h-full w-full flex flex-col bg-[#f3f2f1] overflow-hidden relative">
         
         {/* CASE STATUS WAS HERE - REMOVED */}

         <div className="flex-1 flex overflow-hidden">
            
            {/* Left: Case File */}
            <div className="w-1/2 border-r border-gray-300 flex flex-col bg-white">
               <div className="flex border-b border-gray-300 bg-gray-100">
                  <button 
                    onClick={() => switchTab('DETAILS')}
                    className={`flex-1 py-3 text-sm font-bold uppercase hover:bg-gray-200 ${fileTab === 'DETAILS' ? 'bg-white border-b-2 border-[#1d70b8] text-[#1d70b8]' : 'text-gray-500'}`}
                  >
                    Details
                  </button>
                  <button 
                    onClick={() => switchTab('JOURNAL')}
                    className={`flex-1 py-3 text-sm font-bold uppercase hover:bg-gray-200 ${fileTab === 'JOURNAL' ? 'bg-white border-b-2 border-[#1d70b8] text-[#1d70b8]' : 'text-gray-500'}`}
                  >
                    Journal
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                 {fileTab === 'DETAILS' ? (
                    <div className="space-y-6 font-mono text-sm text-gray-900">
                       <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                          <span className="block text-xs font-bold text-gray-500 uppercase mb-1">Issue Reported</span>
                          <p className="text-lg font-bold text-gray-900">"{claimant.details}"</p>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <span className="block text-xs font-bold text-gray-500 uppercase">DOB</span>
                             <p className="font-medium">{claimant.dateOfBirth}</p>
                          </div>
                          <div>
                             <span className="block text-xs font-bold text-gray-500 uppercase">Mood</span>
                             <p className="font-medium">{claimant.mood}</p>
                          </div>
                          <div className="col-span-2">
                             <span className="block text-xs font-bold text-gray-500 uppercase">Address</span>
                             <p className="font-medium">{claimant.address}</p>
                          </div>
                       </div>
                       <div className="pt-4 border-t border-gray-200">
                         <p className="text-xs text-gray-500 font-bold">Risk Score: {100 - claimant.sincerityScore}/100</p>
                       </div>
                    </div>
                 ) : (
                    <div className={`space-y-3 ${journalHighlight ? 'animate-pulse' : ''}`}>
                       {claimant.journal.map((msg, i) => (
                         <div key={i} className="p-3 bg-gray-50 border border-gray-200 rounded text-sm font-medium text-gray-800">
                            <p>{msg}</p>
                         </div>
                       ))}
                    </div>
                 )}
               </div>
            </div>

            {/* Right: Actions */}
            <div className="w-1/2 bg-[#e5e6e7] flex flex-col p-6 overflow-hidden">
               
               {/* Transcript Box (Since we can't always see the person) */}
               <div className="bg-white border border-gray-300 p-4 rounded mb-4 shadow-inner h-32 overflow-y-auto shrink-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Transcript</span>
                  {history.length > 0 ? (
                    <p className="text-gray-900 font-medium italic">
                      "{history[history.length - 1].text}"
                    </p>
                  ) : (
                    <p className="text-gray-400 italic text-sm">Session started...</p>
                  )}
               </div>

               {/* Interaction Area */}
               <div className="flex-1 overflow-y-auto mb-4">
                 {!showDecision ? (
                   <div className="space-y-2">
                      {options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => handleOptionSelect(opt)}
                          disabled={loading}
                          className="w-full text-left bg-white border border-gray-300 p-3 rounded hover:border-[#1d70b8] hover:shadow-md transition-all active:scale-[0.99]"
                        >
                           <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              opt.tone === 'Empathetic' ? 'bg-green-500' : 
                              opt.tone === 'Direct' ? 'bg-red-500' : 'bg-gray-500'
                           }`} />
                           <span className="font-bold text-gray-900 text-sm">{opt.text}</span>
                        </button>
                      ))}
                      {options.length === 0 && !loading && (
                         <div className="text-center text-gray-500 py-4">Interview Concluded</div>
                      )}
                   </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-400 rounded p-4">
                      <p className="font-bold text-gray-600 mb-4 uppercase tracking-widest">Select Outcome</p>
                      <div className="w-full space-y-3">
                        <JuicyButton label="APPROVE CLAIM" onClick={() => handleFinalDecision('Sign')} className="w-full" />
                        <div 
                           className="relative h-12 w-full select-none"
                           onMouseDown={() => setIsReferralActive(true)}
                           onMouseUp={() => setIsReferralActive(false)}
                           onMouseLeave={() => setIsReferralActive(false)}
                        >
                          <motion.div 
                            className="absolute inset-0 bg-red-600 flex items-center justify-center text-white font-bold cursor-pointer rounded shadow-md"
                            style={{ opacity: isReferralActive ? 1 : 0.8 }}
                          >
                             HOLD TO REFER FRAUD
                          </motion.div>
                          <motion.div 
                            className="absolute top-0 left-0 h-full bg-black/20 pointer-events-none"
                            style={{ width: `${referralProgress}%` }}
                          />
                        </div>
                      </div>
                   </div>
                 )}
               </div>

               {/* Tool Bar */}
               <div className="grid grid-cols-2 gap-2 shrink-0">
                  <button onClick={handleCheckJournal} className="bg-white border border-gray-400 p-2 rounded text-xs font-bold hover:bg-gray-50 text-gray-900">
                     CHECK HISTORY
                  </button>
                  <button 
                    onMouseDown={handleObserve}
                    onMouseUp={() => setObserving(false)}
                    onMouseLeave={() => setObserving(false)}
                    className="bg-[#0b0c0c] text-white border border-black p-2 rounded text-xs font-bold hover:bg-gray-800"
                  >
                    OBSERVE CLIENT
                  </button>
                  {!showDecision && (
                    <button onClick={() => setShowDecision(true)} className="col-span-2 bg-[#1d70b8] text-white p-3 rounded font-bold shadow-sm hover:bg-[#003078]">
                      MAKE DECISION
                    </button>
                  )}
                  {showDecision && (
                    <button onClick={() => setShowDecision(false)} className="col-span-2 text-gray-500 text-xs hover:underline">
                      Cancel
                    </button>
                  )}
               </div>

            </div>
         </div>
      </div>
    </>
  );
};
