import React, { useState, useEffect } from 'react';
import { EvidenceItem } from '../types';
import { FileText, Activity, MessageCircle, ShieldAlert, Search } from 'lucide-react';

interface DocumentRendererProps {
  item: EvidenceItem;
  isForensicMode: boolean;
  onFlag: (isSuspicious: boolean) => void;
}

export const DocumentRenderer: React.FC<DocumentRendererProps> = ({ item, isForensicMode, onFlag }) => {
  const [flaggedWords, setFlaggedWords] = useState<Record<number, 'good' | 'bad'>>({});

  // Reset flags when forensic mode is toggled or item changes
  useEffect(() => {
    setFlaggedWords({});
  }, [isForensicMode, item.id]);

  const handleWordClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!isForensicMode || flaggedWords[index]) return;
    
    // In a full game, we would check against specific index ranges provided by the backend.
    // For this simulation, we use a deterministic random check based on the word length and index 
    // to simulate finding "hidden" clues.
    const isSuspicious = (index % 17 === 0) || (index % 23 === 0); 
    
    setFlaggedWords(prev => ({
      ...prev,
      [index]: isSuspicious ? 'good' : 'bad'
    }));
    
    onFlag(isSuspicious);
  };

  // --- FORENSIC VIEW (THE "MATRIX" MODE) ---
  if (isForensicMode) {
    // Split content into words, preserving newlines as special tokens if needed, 
    // but for simplicity we just split by space/pipes/newlines to create a clickable grid.
    const words = item.content.replace(/\|/g, ' ').replace(/\n/g, ' ').split(/\s+/);

    return (
      <div className="relative font-mono text-lg leading-relaxed bg-[#001100] text-[#00ff00] p-8 rounded shadow-inner border-4 border-[#003300] min-h-[500px] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 bg-[#003300] text-[#00ff00] px-4 py-2 flex justify-between items-center select-none z-10">
           <span className="text-xs font-bold tracking-widest animate-pulse">FORENSIC ANALYSIS PROTOCOL</span>
           <span className="text-xs"><Search size={14} className="inline mr-1"/> CLICK ANOMALIES</span>
        </div>
        
        <div className="mt-8 flex flex-wrap gap-x-2 gap-y-1 opacity-90">
          {words.map((word, i) => (
            <span 
              key={i}
              onClick={(e) => handleWordClick(e, i)}
              className={`
                cursor-crosshair px-1 rounded transition-all select-none duration-100
                ${flaggedWords[i] === 'good' ? 'bg-[#00ff00] text-black font-bold shadow-[0_0_10px_#00ff00]' : ''}
                ${flaggedWords[i] === 'bad' ? 'bg-red-600 text-white line-through opacity-50' : ''}
                ${!flaggedWords[i] ? 'hover:bg-[#004400] hover:text-white' : ''}
              `}
            >
              {word}
            </span>
          ))}
        </div>
        
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20"></div>
      </div>
    );
  }

  // --- VISUAL VIEW (REALISTIC DOCUMENTS) ---
  switch (item.type) {
    case 'Bank Statement':
      const rows = item.content.split('\n').filter(r => r.includes('|')).map(row => row.split('|'));
      // Fallback if text isn't pipe delimited
      if (rows.length === 0) {
         return (
            <div className="bg-white p-8 font-mono text-sm border border-gray-200 whitespace-pre-wrap">
                {item.content}
            </div>
         );
      }

      return (
        <div className="bg-white text-black p-8 font-mono text-sm border border-gray-200 shadow-sm min-h-[500px]">
          <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-end">
             <div>
               <h1 className="text-3xl font-bold uppercase tracking-tighter">Gringotts & Co.</h1>
               <p className="text-gray-500 font-sans">Financial Statement</p>
             </div>
             <div className="text-right font-sans text-xs text-gray-600">
               <p>Sort Code: 99-00-12</p>
               <p>Account: 12345678</p>
               <p>Sheet: 1 of 1</p>
             </div>
          </div>
          <table className="w-full text-left">
             <thead className="border-b-2 border-black text-black uppercase text-xs font-bold">
               <tr>
                 <th className="pb-2 pl-2">Date</th>
                 <th className="pb-2">Transaction Description</th>
                 <th className="pb-2 text-right pr-2">Amount (£)</th>
               </tr>
             </thead>
             <tbody className="font-medium">
               {rows.map((row, i) => (
                 <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                   <td className="py-3 pl-2 w-32">{row[0]}</td>
                   <td className="py-3">{row[1] || '---'}</td>
                   <td className={`py-3 text-right pr-2 w-32 font-bold ${row[2]?.includes('-') ? 'text-red-800' : 'text-green-800'}`}>
                     {row[2] || '0.00'}
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
          <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-400 uppercase">
             End of Statement
          </div>
        </div>
      );

    case 'GP Letter':
      return (
        <div className="bg-[#fffbf0] text-gray-900 p-12 font-serif shadow-md border border-gray-200 min-h-[500px] relative max-w-3xl mx-auto">
          <div className="flex justify-between items-start border-b-2 border-[#005eb8] pb-6 mb-8">
             <div>
                <div className="flex items-center gap-2 text-[#005eb8] font-bold text-xl mb-2">
                   <Activity size={24} /> 
                   <span className="italic">NHS Trust</span>
                </div>
                <p className="text-xs text-gray-500">St. Jude's Hospital<br/>London, SW1A 2AA</p>
             </div>
             <div className="text-right text-sm">
                <p className="font-bold">PRIVATE & CONFIDENTIAL</p>
                <p>{new Date().toLocaleDateString()}</p>
             </div>
          </div>
          
          <div className="text-lg leading-loose text-justify">
            {item.content.split('\n').map((para, i) => (
              <p key={i} className="mb-6">{para}</p>
            ))}
          </div>
          
          <div className="mt-12 flex justify-end">
             <div className="text-center">
                 <div className="h-16 w-40 mb-2 bg-contain bg-no-repeat bg-center opacity-70" style={{ backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgNTAiPjxwYXRoIGQ9Ik0xMCwzMCBDMzAsMTA 1MCw1MCA3MCwzMCBTOTAsMTAgOTAsMzAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PC9zdmc+")' }}></div>
                 <p className="border-t border-black pt-2 font-bold text-sm">Dr. S. House, MD</p>
                 <p className="text-xs text-gray-500">Chief Consultant</p>
             </div>
          </div>
          
          <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-gray-400 uppercase">
             Generated by NHS Digital Services • Do not reproduce
          </div>
        </div>
      );

    case 'Universal Credit Journal':
      const msgs = item.content.split('\n').filter(l => l.trim().length > 0);
      return (
        <div className="bg-gray-50 border border-gray-300 min-h-[500px] flex flex-col shadow-inner">
           <div className="bg-[#1d70b8] text-white p-4 flex items-center gap-3 shadow-md z-10">
             <MessageCircle size={24} />
             <div>
                <h2 className="font-bold text-sm">Claimant Journal</h2>
                <p className="text-xs opacity-80">Official Communication Record</p>
             </div>
           </div>
           
           <div className="p-6 flex flex-col gap-6 overflow-y-auto flex-1 bg-white">
             {msgs.map((msg, i) => {
               // Heuristic to determine sender if not explicit
               const isAgent = msg.toLowerCase().includes('agent') || msg.toLowerCase().includes('work coach');
               const isSystem = msg.toLowerCase().includes('system');
               
               // Parse "Sender: Message" format if present
               let author = isAgent ? 'DWP Agent' : 'Claimant';
               let text = msg;
               
               if (msg.includes(':')) {
                  const parts = msg.split(':');
                  author = parts[0].trim();
                  text = parts.slice(1).join(':').trim();
               }

               if (isSystem) {
                   return (
                       <div key={i} className="flex justify-center my-2">
                           <span className="bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                               {text}
                           </span>
                       </div>
                   )
               }

               return (
                 <div key={i} className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                    <span className="text-xs text-gray-400 mb-1 ml-1">{author} • {10 + i}:00 AM</span>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm leading-relaxed relative ${
                        isAgent 
                        ? 'bg-[#f3f2f1] text-[#0b0c0c] rounded-tl-none border border-gray-200' 
                        : 'bg-[#1d70b8] text-white rounded-tr-none'
                    }`}>
                       {text}
                    </div>
                 </div>
               )
             })}
           </div>
           
           <div className="p-4 bg-gray-100 border-t border-gray-300 text-center text-xs text-gray-500 italic">
              This journal is monitored for quality and training purposes.
           </div>
        </div>
      );

    default:
      return (
        <div className="bg-white p-10 border border-gray-200 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-gray-400">
          <FileText size={48} className="mb-4 opacity-20" />
          <p className="font-mono text-sm text-black mb-4 uppercase font-bold tracking-widest">Document Preview</p>
          <div className="max-w-md text-center text-gray-600 whitespace-pre-wrap leading-relaxed">
            {item.content}
          </div>
        </div>
      );
  }
};