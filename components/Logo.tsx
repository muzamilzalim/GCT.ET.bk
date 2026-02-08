
import React from 'react';
import { PrimaryColor, COLOR_THEMES } from '../types';

interface LogoProps {
  color?: PrimaryColor;
}

const Logo: React.FC<LogoProps> = ({ color = 'blue' }) => {
  const theme = COLOR_THEMES[color];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative group animate-float">
        {/* Dynamic Glow effect */}
        <div 
          className="absolute inset-0 blur-3xl opacity-20 group-hover:opacity-40 transition-all duration-700"
          style={{ backgroundColor: theme.hex }}
        ></div>
        
        <div className="relative flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg transition-all" style={{ filter: `drop-shadow(0 0 8px ${theme.shadow})` }}>
            <path d="M20 2L4 11V29L20 38L36 29V11L20 2Z" stroke={theme.hex} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 10L14 20H21L18 30L26 20H19L22 10Z" fill={theme.hex} className="animate-pulse" />
          </svg>
          
          <h1 className="font-futuristic text-lg font-bold tracking-[0.1em] flex items-baseline">
            <span style={{ color: theme.hex }}>GCT</span>
            <span className="text-white opacity-40 mx-0.5">.</span>
            <span className="text-white/90">ET</span>
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Logo;
