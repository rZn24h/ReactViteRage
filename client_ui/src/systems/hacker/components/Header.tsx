// [UI] Header Component pentru Hacker Terminal
import React from 'react';
import { TIME_LIMIT_SECONDS } from '../constants';

interface HeaderProps {
  timeLeft: number;
  score: number;
  status: string;
}

const Header: React.FC<HeaderProps> = ({ timeLeft, score, status }) => {
  const progressPercent = (timeLeft / TIME_LIMIT_SECONDS) * 100;
  
  // Format MM:SS (though strictly likely just seconds needed)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-full max-w-2xl mb-6 p-4 glass-panel rounded-lg border-t-2 border-emerald-500/50">
      <div className="flex justify-between items-end mb-2 text-emerald-400 font-bold tracking-widest text-sm md:text-base">
        <span>SYSTEM STATUS: {status}</span>
        <span>BRUTE_FORCE_V.2.0</span>
      </div>

      {/* Timer Bar */}
      <div className="relative w-full h-6 bg-black/60 rounded border border-white/20 overflow-hidden mb-2">
        <div 
          className="h-full bg-emerald-600 transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(16,185,129,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Striped overlay on bar */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,transparent_50%,rgba(0,0,0,0.5)_50%,rgba(0,0,0,0.5)_100%)] bg-[length:10px_100%] opacity-20" />
        
        <div className="absolute inset-0 flex items-center justify-center text-white text-xs tracking-wider font-mono mix-blend-overlay">
           TIMEOUT_SEQUENCE: {formatTime(timeLeft)}
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-400 font-mono">
        <span>ATTEMPTS: {score}</span>
        <span>SECURITY_LEVEL: HIGH</span>
      </div>
    </div>
  );
};

export default Header;
