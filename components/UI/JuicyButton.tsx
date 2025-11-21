
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { audioService } from '../../services/audioService';

interface JuicyButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning';
  label: string;
  isLoading?: boolean;
}

export const JuicyButton: React.FC<JuicyButtonProps> = ({ 
  variant = 'primary', 
  label, 
  className, 
  onClick,
  disabled,
  isLoading,
  ...props 
}) => {
  const baseStyles = "group relative inline-flex items-center justify-center px-8 py-3 text-lg font-bold transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[#ffdd00] focus:ring-offset-2 focus:ring-offset-black";
  
  const variants = {
    primary: "bg-[#00703c] text-white shadow-[0_4px_0_#002d18] active:shadow-none active:translate-y-[4px] hover:bg-[#005a30]",
    secondary: "bg-[#f3f2f1] text-[#0b0c0c] shadow-[0_4px_0_#b1b4b6] active:shadow-none active:translate-y-[4px] hover:bg-[#e5e6e7]",
    danger: "bg-[#d4351c] text-white shadow-[0_4px_0_#5c1209] active:shadow-none active:translate-y-[4px] hover:bg-[#b02c17]",
    warning: "bg-[#ffdd00] text-[#0b0c0c] shadow-[0_4px_0_#b29a00] active:shadow-none active:translate-y-[4px] hover:bg-[#eec600]"
  };

  const handleInteraction = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    
    if (variant === 'primary' || variant === 'danger') {
      audioService.playThud();
    } else {
      audioService.playClick();
    }
    
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={handleInteraction}
      disabled={disabled || isLoading}
      className={clsx(baseStyles, variants[variant], className)}
      {...props}
    >
      {isLoading ? (
        <span className="animate-pulse">PROCESSING...</span>
      ) : (
        <>
          <span className="relative z-10 uppercase tracking-wider">{label}</span>
          {/* Glitch effect on hover for style */}
          <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 mix-blend-overlay" />
        </>
      )}
    </motion.button>
  );
};
