import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateDecisionCase } from '../services/geminiService';
import { DecisionCase } from '../types';
import { RefreshCw, CheckCircle, XCircle, BookOpen, Calendar, ZoomIn } from 'lucide-react';
import { audioService } from '../services/audioService';
import { JuicyButton } from './UI/JuicyButton';
import { DocumentRenderer } from './DocumentRenderer';

interface DecisionMakerProps {
  onAction: (stressImpact: number) => void;
}

export const DecisionMakerView: React.FC<DecisionMakerProps> = ({ onAction }) => {
  const [activeCase, setActiveCase] = useState<DecisionCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EVIDENCE'>('OVERVIEW');
  
  // Construction State
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [determination, setDetermination] = useState<'UPHOLD' | 'OVERTURN' | null>(null);
  
  const [verificationMode, setVerificationMode] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'SUCCESS' | 'FAILURE' | null>(null);

  useEffect(() => {
    loadCase();
  }, []);

  const loadCase = async () => {
    setLoading(true);
    setResolution(null);
    setSelectedClauseId(null);
    setSelectedEvidenceId(null);
    setDetermination(null);
    setVerificationMode(null);
    setActiveTab('OVERVIEW');
    
    const data = await generateDecisionCase();
    setActiveCase(data);
    setLoading(false);
  };

  const handleEvidenceSelect = (id: string) => {
    if (resolution) return;
    audioService.playClick();
    setSelectedEvidenceId(id === selectedEvidenceId ? null : id);
  };

  const handleClauseSelect = (id: string) => {
    if (resolution) return;
    audioService.playClick();
    setSelectedClauseId(id === selectedClauseId ? null : id);
  };

  const toggleVerification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (verificationMode === id) {
      setVerificationMode(null);
      audioService.playClick(); // Toggle off sound
    } else {
      setVerificationMode(id);
      audioService.playStatic(); // Toggle on sound (matrix effect)
    }
  };

  const handleFlag = (isGoodSpot: boolean) => {
    if (isGoodSpot) {
      audioService.playClick(); 
      onAction(-2); // Stress relief for finding a clue
    } else {
      audioService.playError(); 
      onAction(2); // Penalty for false positive
    }
  };

  const submitDetermination = () => {
    if (!activeCase || !selectedClauseId || !selectedEvidenceId || !determination) return;

    audioService.playLock();

    // Logic: Check if the clause applies to the evidence.
    // In this simulation, we check if the AI generated "correctClauseId" matches.
    const isCorrectClause = selectedClauseId === activeCase.correctClauseId;
    const isCorrectEvidence = selectedEvidenceId === activeCase.correctEvidenceId;
    
    // We reward the player for correctly matching the clause and evidence.
    // The UPHOLD/OVERTURN decision is left to player interpretation of the text, but for scoring we focus on the pairing.
    const isCorrectCall = isCorrectClause && isCorrectEvidence;

    if (isCorrectCall) {
      setResolution('SUCCESS');
      onAction(-15); // Major stress relief
    } else {
      setResolution('FAILURE');
      onAction(30); // Major stress penalty
      audioService.playError();
    }

    // Screen shake effect
    const container = document.getElementById('app-container');
    if (container) {
       container.animate([
         { transform: 'translate(0,0)' },
         { transform: 'translate(-5px, 5px)' },
         { transform: 'translate(5px, -5px)' },
         { transform: 'translate(0,0)' }
       ], { duration: 400 });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-[#1d70b8]">
        <RefreshCw className="animate-spin mb-4 w-12 h-12" />
        <span className="font-mono text-xl animate-pulse">RETRIEVING DIGITAL BUNDLE...</span>
      </div>
    );
  }

  if (!activeCase) return null;

  const selectedClauseText = activeCase.clauses.find(c => c.id === selectedClauseId)?.code || "SELECT LEGISLATION";
  const selectedEvidenceType = activeCase.evidence.find(e => e.id === selectedEvidenceId)?.type || "SELECT EVIDENCE";

  return (
    <div className="h-full w-full flex flex-col bg-gray-900 overflow-hidden">
      
      {/* HEADER TABS */}
      <div className="h-14 bg-black flex items-end px-6 gap-2 border-b border-gray-700 shrink-0">
         <button 
           onClick={() => setActiveTab('OVERVIEW')}
           className={`px-8 py-3 text-sm font-bold uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'OVERVIEW' ? 'bg-[#f3f2f1] text-black border-t-4 border-[#1d70b8]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border-t-4 border-transparent'}`}
         >
           Case Overview
         </button>
         <button 
           onClick={() => setActiveTab('EVIDENCE')}
           className={`px-8 py-3 text-sm font-bold uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'EVIDENCE' ? 'bg-[#f3f2f1] text-black border-t-4 border-[#1d70b8]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border-t-4 border-transparent'}`}
         >
           Evidence Bundle
         </button>
      </div>

      {/* MAIN WORKBENCH - Flex grow to fill space above footer */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: CONTENT (Scrollable) */}
        <div className="w-3/5 overflow-y-auto border-r border-gray-700 bg-[#f3f2f1] relative custom-scrollbar">
          
          {activeTab === 'OVERVIEW' && (
            <div className="p-10 space-y-10 max-w-4xl mx-auto">
               {/* Summary Card */}
               <div className="bg-white p-8 border-l-8 border-[#1d70b8] shadow-lg">
                 <span className="text-xs font-bold text-[#1d70b8] uppercase tracking-widest mb-2 block">Case Abstract</span>
                 <h2 className="text-3xl font-bold mb-4 text-gray-900">{activeCase.title}</h2>
                 <p className="text-gray-700 text-lg leading-relaxed font-serif">{activeCase.summary}</p>
               </div>

               {/* Timeline */}
               <div className="relative pl-4">
                 <h3 className="text-sm font-bold uppercase text-gray-500 mb-6 flex items-center gap-2">
                   <Calendar size={16} /> Chronological Timeline
                 </h3>
                 <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-gray-300" />
                 
                 <div className="space-y-6">
                   {activeCase.timeline?.map((event, i) => (
                     <div key={i} className="relative pl-12 group">
                        {/* Timeline Dot */}
                        <div className="absolute left-[5px] top-1.5 w-3 h-3 rounded-full bg-white border-4 border-gray-400 group-hover:border-[#1d70b8] group-hover:scale-125 transition-all z-10" />
                        
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <span className="text-xs font-bold text-[#1d70b8] block mb-1 uppercase tracking-wide">{event.date}</span>
                          <p className="text-gray-800 font-medium">{event.description}</p>
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'EVIDENCE' && (
             <div className="p-8 space-y-12 pb-40 max-w-4xl mx-auto">
              {activeCase.evidence.map((item) => (
                <motion.div
                  key={item.id}
                  onClick={() => handleEvidenceSelect(item.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative transition-all rounded-lg overflow-hidden ${selectedEvidenceId === item.id ? 'ring-4 ring-[#1d70b8] shadow-2xl scale-[1.01] z-10' : 'hover:opacity-100 opacity-90 grayscale hover:grayscale-0'}`}
                >
                   {/* Header Bar */}
                   <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
                      <span className="font-mono text-xs uppercase font-bold tracking-wider text-gray-300">{item.type} <span className="text-gray-500">//</span> REF: {item.id}</span>
                      <button 
                       onClick={(e) => toggleVerification(item.id, e)}
                       className={`text-xs uppercase font-bold flex items-center gap-2 px-3 py-1.5 rounded transition-all ${verificationMode === item.id ? 'bg-[#00ff00] text-black shadow-[0_0_10px_#00ff00]' : 'bg-black hover:bg-gray-700 text-gray-300'}`}
                     >
                       <ZoomIn size={14} /> {verificationMode === item.id ? 'DISABLE SCAN' : 'FORENSIC SCAN'}
                     </button>
                   </div>
                   
                   {/* Document Content */}
                   <DocumentRenderer 
                     item={item} 
                     isForensicMode={verificationMode === item.id}
                     onFlag={handleFlag}
                   />
                </motion.div>
              ))}
             </div>
          )}
        </div>

        {/* RIGHT PANEL: LEGISLATION (Fixed width) */}
        <div className="w-2/5 p-6 bg-[#0b0c0c] text-white overflow-y-auto pb-40 border-l border-gray-800 custom-scrollbar">
          <div className="flex items-center mb-6 space-x-3 pb-4 border-b border-gray-800 sticky top-0 bg-[#0b0c0c] z-10">
            <div className="p-2 bg-[#1d70b8] rounded">
               <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-none">Legislation</h2>
              <p className="text-xs text-gray-500 uppercase">Advice for Decision Making</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activeCase.clauses.map((clause) => (
              <motion.button
                key={clause.id}
                onClick={() => handleClauseSelect(clause.id)}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left border-l-4 p-5 transition-all rounded-r ${selectedClauseId === clause.id ? 'bg-[#1d70b8] border-[#ffdd00] shadow-[0_0_30px_rgba(29,112,184,0.3)]' : 'bg-[#1a1a1a] border-gray-700 hover:bg-[#252525]'}`}
              >
                <div className="flex justify-between items-baseline mb-3">
                  <span className={`font-bold font-mono px-2 py-0.5 rounded text-sm ${selectedClauseId === clause.id ? 'bg-white text-[#1d70b8]' : 'bg-black text-[#ffdd00]'}`}>
                    {clause.code}
                  </span>
                  <span className="text-[10px] text-gray-500 tracking-widest uppercase">Regulation</span>
                </div>
                <h4 className="font-bold mb-2 text-sm leading-tight">{clause.text}</h4>
                <p className={`text-xs leading-relaxed ${selectedClauseId === clause.id ? 'text-blue-100' : 'text-gray-500'}`}>{clause.description}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM: DECISION COMPOSER (Fixed height) */}
      <div className="h-36 bg-white border-t-8 border-[#1d70b8] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-30 flex items-center px-8 justify-between shrink-0 relative">
         {resolution ? (
           <div className="w-full flex items-center justify-between animate-in fade-in zoom-in duration-300">
              <div className={`flex items-center gap-6 ${resolution === 'SUCCESS' ? 'text-green-700' : 'text-red-700'}`}>
                 {resolution === 'SUCCESS' ? <CheckCircle size={64} /> : <XCircle size={64} />}
                 <div>
                    <h2 className="text-4xl font-black tracking-tighter uppercase mb-1">
                      {resolution === 'SUCCESS' ? 'CASE RESOLVED' : 'MALADMINISTRATION'}
                    </h2>
                    <p className="font-mono text-sm font-bold uppercase tracking-wide">
                      {resolution === 'SUCCESS' ? 'Legislation correctly applied.' : 'Audit Flag: Incorrect Application of Law.'}
                    </p>
                 </div>
              </div>
              <JuicyButton label="NEXT CASE" onClick={loadCase} />
           </div>
         ) : (
           <>
             <div className="flex-1 mr-12">
               <div className="flex justify-between items-end mb-2">
                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Legal Determination Composer</div>
                 <div className="text-[10px] font-mono text-red-600 uppercase">{(!selectedClauseId || !selectedEvidenceId) ? 'Awaiting Inputs...' : 'Ready for Judgment'}</div>
               </div>
               
               <div className="flex items-center gap-3 font-mono text-sm md:text-base bg-gray-50 p-4 rounded border border-gray-300 shadow-inner">
                  <span className="text-gray-400 select-none">I determine to</span>
                  
                  <div className="flex rounded border border-gray-300 overflow-hidden shadow-sm scale-90 origin-left">
                    <button 
                      onClick={() => { audioService.playClick(); setDetermination('UPHOLD'); }}
                      className={`px-4 py-2 font-bold transition-colors ${determination === 'UPHOLD' ? 'bg-green-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-400'}`}
                    >
                      UPHOLD
                    </button>
                    <div className="w-px bg-gray-300"></div>
                    <button 
                      onClick={() => { audioService.playClick(); setDetermination('OVERTURN'); }}
                      className={`px-4 py-2 font-bold transition-colors ${determination === 'OVERTURN' ? 'bg-red-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-400'}`}
                    >
                      OVERTURN
                    </button>
                  </div>

                  <span className="text-gray-400 select-none">based on</span>
                  
                  <span className={`font-bold border-b-2 px-1 transition-colors ${selectedClauseId ? 'text-[#1d70b8] border-[#1d70b8]' : 'text-gray-300 border-gray-300 border-dashed'}`}>
                    {selectedClauseText}
                  </span>
                  
                  <span className="text-gray-400 select-none">using</span>
                  
                  <span className={`font-bold border-b-2 px-1 truncate max-w-[150px] transition-colors ${selectedEvidenceId ? 'text-[#1d70b8] border-[#1d70b8]' : 'text-gray-300 border-gray-300 border-dashed'}`}>
                    {selectedEvidenceType}
                  </span>
               </div>
             </div>
             
             <JuicyButton 
               label="SUBMIT DETERMINATION" 
               variant={determination === 'OVERTURN' ? 'danger' : 'primary'}
               disabled={!selectedClauseId || !selectedEvidenceId || !determination}
               onClick={submitDetermination}
               className="shrink-0 h-16 text-sm"
             />
           </>
         )}
      </div>
    </div>
  );
};