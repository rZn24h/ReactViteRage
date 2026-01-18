import React from 'react';
import { CARD_SHADOW_CLASS } from './constants';

interface LiquidCardProps {
  children: React.ReactNode;
}

export const LiquidCard: React.FC<LiquidCardProps> = ({ children }) => {
  return (
    <div 
      className={`
        relative overflow-hidden w-full max-w-md mx-4
        bg-glass-bg/40 
        backdrop-blur-[40px] backdrop-saturate-150
        rounded-[45px]
        border border-white/10
        ${CARD_SHADOW_CLASS}
        p-8 md:p-10
        flex flex-col items-center
        transition-all duration-500 ease-out
      `}
      style={{
        background: 'rgba(10, 20, 15, 0.4)',
        backgroundColor: 'rgba(10, 20, 15, 0.4)',
      }}
    >
      {children}
    </div>
  );
};
