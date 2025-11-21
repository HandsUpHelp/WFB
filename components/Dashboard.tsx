import React from 'react';
import { motion } from 'framer-motion';
import { GameRole } from '../types';
import { Users, Scale, FileStack } from 'lucide-react';

interface DashboardProps {
  onSelectRole: (role: GameRole) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectRole }) => {
  const roles = [
    {
      id: GameRole.WORK_COACH,
      title: 'Work Coach',
      description: 'Front-line social simulation. Judge sincerity. Manage conflict.',
      icon: Users,
      color: 'bg-blue-600'
    },
    {
      id: GameRole.DECISION_MAKER,
      title: 'Decision Maker',
      description: 'Forensic legislation application. Interpret complex evidence.',
      icon: Scale,
      color: 'bg-emerald-700'
    },
    {
      id: GameRole.CASE_MANAGER,
      title: 'Case Manager',
      description: 'High-volume administration. Batch processing. Payment release.',
      icon: FileStack,
      color: 'bg-gray-800'
    }
  ];

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 bg-[#f3f2f1]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl w-full"
      >
        <h1 className="text-5xl font-bold mb-2">Departmental Assignment</h1>
        <p className="text-xl text-gray-600 mb-12">Select your active duty role for this shift.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((role, index) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectRole(role.id)}
              className="group relative bg-white border-b-8 border-gray-400 hover:border-[#1d70b8] shadow-xl flex flex-col text-left h-80 overflow-hidden"
            >
              <div className={`h-2 ${role.color} w-full`} />
              <div className="p-8 flex flex-col h-full">
                <div className="mb-6 p-4 bg-gray-100 rounded-full w-min group-hover:bg-yellow-100 transition-colors">
                  <role.icon size={40} className="text-gray-800" />
                </div>
                <h3 className="text-2xl font-bold mb-2 group-hover:underline decoration-[#1d70b8] decoration-4 underline-offset-4">{role.title}</h3>
                <p className="text-gray-600 text-lg leading-snug">{role.description}</p>
                <div className="mt-auto flex items-center text-[#1d70b8] font-bold">
                  <span>Initiate Protocol</span>
                  <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-12 border-t-2 border-gray-300 pt-6 text-sm text-gray-500 flex justify-between">
          <span>System Version: 0.9.2 (BETA)</span>
          <span>Authorized Personnel Only</span>
        </div>
      </motion.div>
    </div>
  );
};
