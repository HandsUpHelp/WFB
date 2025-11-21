
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskEmail } from '../types';
import { generateInbox } from '../services/geminiService';
import { MOCK_EMAILS } from '../constants';
import { JuicyButton } from './UI/JuicyButton';
import { Mail, AlertCircle, CheckSquare, Siren } from 'lucide-react';
import { audioService } from '../services/audioService';

interface CaseManagerProps {
  onAction: (stressImpact: number) => void;
}

export const CaseManagerView: React.FC<CaseManagerProps> = ({ onAction }) => {
  const [inbox, setInbox] = useState<TaskEmail[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [authSliderValue, setAuthSliderValue] = useState(0);
  const [interruption, setInterruption] = useState(false);

  useEffect(() => {
    const load = async () => {
      const mails = await generateInbox(5);
      setInbox(mails.length ? mails : MOCK_EMAILS);
    };
    load();
  }, []);

  // Random Interruption Logic
  useEffect(() => {
    const randomTime = Math.random() * 10000 + 10000; // 10-20s
    const timer = setTimeout(() => {
      triggerInterruption();
    }, randomTime);
    return () => clearTimeout(timer);
  }, [inbox]); // Reset on inbox change to keep it dynamic

  const triggerInterruption = () => {
    setInterruption(true);
    audioService.playAlarm();
    onAction(10); // Sudden stress spike
  };

  const resolveInterruption = () => {
    setInterruption(false);
    audioService.playClick();
    onAction(-5); // Relief
  };

  const toggleTask = (id: string) => {
    audioService.playClick();
    setSelectedTasks(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleBatchProcess = () => {
    if (selectedTasks.length === 0) return;
    audioService.playThud();
    onAction(selectedTasks.length * 2);
    setInbox(prev => prev.filter(m => !selectedTasks.includes(m.id)));
    setSelectedTasks([]);
    if (Math.random() > 0.5) {
       generateInbox(2).then(newMails => setInbox(prev => [...prev, ...newMails]));
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthSliderValue(Number(e.target.value));
  };
  
  const handleSliderRelease = () => {
    if (authSliderValue > 90) {
      audioService.playThud();
      onAction(10);
      setAuthSliderValue(0);
      if (inbox.length > 0) setInbox(prev => prev.slice(1));
    } else {
      setAuthSliderValue(0);
    }
  };

  return (
    <div className="relative h-full w-full bg-[#f3f2f1] p-6 flex flex-col">
      
      {/* Interruption Modal */}
      <AnimatePresence>
        {interruption && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 z-50 bg-red-900/90 flex items-center justify-center"
          >
             <div className="bg-white p-8 border-4 border-red-600 shadow-2xl max-w-lg w-full text-center animate-pulse">
               <Siren size={64} className="mx-auto text-red-600 mb-4 animate-bounce" />
               <h2 className="text-3xl font-bold text-red-700 mb-2">PAYMENT SERVER ERROR</h2>
               <p className="text-lg font-bold mb-6">Critical fault in payment batch #992. Immediate manual reset required.</p>
               <JuicyButton variant="danger" label="RESET SYSTEM" onClick={resolveInterruption} />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-end mb-6">
        <div>
           <h2 className="text-4xl font-bold tracking-tight mb-1">WORK MANAGEMENT</h2>
           <p className="text-gray-600">Caseload: 642 | Pending: {inbox.length}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
             <div className="text-xs uppercase font-bold text-gray-500">Batch Action</div>
             <div className="text-2xl font-bold">{selectedTasks.length} Selected</div>
          </div>
          <JuicyButton 
            label="EXECUTE BATCH" 
            onClick={handleBatchProcess}
            disabled={selectedTasks.length === 0}
            variant="primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex gap-6">
        
        {/* Inbox List */}
        <div className="flex-1 bg-white shadow border border-gray-300 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 border-b border-gray-300 w-12"><input type="checkbox" disabled /></th>
                <th className="p-4 border-b border-gray-300 font-bold">Status</th>
                <th className="p-4 border-b border-gray-300 font-bold">Subject</th>
                <th className="p-4 border-b border-gray-300 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {inbox.map((mail) => (
                  <motion.tr 
                    key={mail.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`border-b border-gray-200 hover:bg-blue-50 cursor-pointer ${selectedTasks.includes(mail.id) ? 'bg-yellow-50' : ''}`}
                    onClick={() => toggleTask(mail.id)}
                  >
                    <td className="p-4 text-center">
                       <div className={`w-5 h-5 border-2 ${selectedTasks.includes(mail.id) ? 'bg-[#0b0c0c] border-[#0b0c0c]' : 'border-gray-400'} flex items-center justify-center`}>
                          {selectedTasks.includes(mail.id) && <CheckSquare size={14} className="text-white" />}
                       </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold uppercase ${mail.urgency === 'Escalation' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {mail.urgency}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold">{mail.subject}</div>
                      <div className="text-sm text-gray-500 truncate max-w-md">{mail.body}</div>
                    </td>
                    <td className="p-4 font-mono text-sm text-[#1d70b8] uppercase font-bold">
                      {mail.actionRequired}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {inbox.length === 0 && (
            <div className="p-10 text-center text-gray-400">Inbox Cleared. Stand by for new tasks.</div>
          )}
        </div>

        {/* Manual Payment Control */}
        <div className="w-80 bg-[#dee0e2] border-l border-gray-300 p-6 flex flex-col justify-end shadow-[inset_5px_0_10px_-5px_rgba(0,0,0,0.1)]">
           <div className="bg-white p-4 shadow border-t-4 border-[#ffdd00] mb-4">
             <h3 className="font-bold text-lg mb-2">Manual Override</h3>
             <div className="flex items-center gap-2 mb-4">
               <AlertCircle size={20} className="text-[#ffdd00]" />
               <span className="text-xs text-gray-600">Requires Authorization</span>
             </div>
             <div className="font-mono text-3xl font-bold text-right mb-6">£1,240.55</div>
             
             {/* Slide to Authorize */}
             <div className="relative h-14 bg-gray-200 rounded-full overflow-hidden shadow-inner border border-gray-300 select-none">
               <div 
                 className="absolute inset-y-0 left-0 bg-[#00703c] transition-all duration-75 ease-out"
                 style={{ width: `${authSliderValue}%` }}
               />
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className={`font-bold uppercase tracking-widest text-sm transition-colors ${authSliderValue > 50 ? 'text-white' : 'text-gray-500'}`}>
                   {authSliderValue > 90 ? 'AUTHORIZED' : 'Slide to Pay'}
                 </span>
               </div>
               <input 
                 type="range" 
                 min="0" 
                 max="100" 
                 value={authSliderValue}
                 onChange={handleSliderChange}
                 onMouseUp={handleSliderRelease}
                 onTouchEnd={handleSliderRelease}
                 className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
               />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
