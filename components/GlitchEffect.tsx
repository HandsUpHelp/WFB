import React from 'react';
import { motion } from 'framer-motion';

export const GlitchEffect: React.FC<{ stress: number }> = ({ stress }) => {
  if (stress < 20) return null;

  const intensity = (stress - 20) / 80; // 0 to 1

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {/* Vignette darkening */}
      <div 
        className="absolute inset-0 bg-radial-gradient from-transparent to-black opacity-0 transition-opacity duration-500"
        style={{ opacity: intensity * 0.6 }}
      />
      
      {/* Color separation / Chromatic aberration simulation via mix-blend-mode */}
      <motion.div 
        className="absolute inset-0 bg-red-500 mix-blend-screen opacity-0"
        animate={{ 
          x: [0, 2, -2, 0],
          opacity: [0, intensity * 0.1, 0] 
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 0.2 / (intensity + 0.1),
          repeatDelay: Math.random() * 3
        }}
      />
       <motion.div 
        className="absolute inset-0 bg-blue-500 mix-blend-screen opacity-0"
        animate={{ 
          x: [0, -2, 2, 0],
          opacity: [0, intensity * 0.1, 0] 
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 0.25 / (intensity + 0.1),
          repeatDelay: Math.random() * 3
        }}
      />
      
      {/* Scanlines */}
      <div 
        className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-0 transition-opacity"
        style={{ opacity: intensity * 0.3 }}
      />
    </div>
  );
};
