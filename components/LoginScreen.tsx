import React from 'react';
import { motion } from 'framer-motion';
import { JuicyButton } from './UI/JuicyButton';

export const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-[#f3f2f1] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-12 shadow-2xl border border-gray-200 max-w-md w-full"
      >
        <div className="mb-8 border-b-4 border-black pb-4">
          <h1 className="text-4xl font-bold tracking-tight">Sign in</h1>
          <p className="text-lg text-gray-600 mt-2">Staff Identity Portal</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-lg font-bold mb-2 text-[#0b0c0c]">Staff Number</label>
            <input 
              type="text" 
              className="w-full border-2 border-[#0b0c0c] p-3 text-lg focus:outline-none focus:ring-4 focus:ring-[#ffdd00]"
              defaultValue="DWP-8821-X"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-lg font-bold mb-2 text-[#0b0c0c]">Memorable Date</label>
            <input 
              type="password" 
              className="w-full border-2 border-[#0b0c0c] p-3 text-lg focus:outline-none focus:ring-4 focus:ring-[#ffdd00]"
              defaultValue="password"
              readOnly
            />
          </div>

          <div className="pt-4">
            <JuicyButton label="Continue" className="w-full" onClick={onLogin} />
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>By proceeding, you agree to the Departmental Secrecy Act (1911).</p>
          <p className="mt-2 text-red-600 font-bold">WARNING: Shift targets are active.</p>
        </div>
      </motion.div>
    </div>
  );
};
