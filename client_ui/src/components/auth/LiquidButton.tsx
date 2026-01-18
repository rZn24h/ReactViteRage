import React from 'react';
import { BUTTON_SHADOW_CLASS } from './constants';

interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      {...props}
      className={`
        w-full py-4 px-6
        rounded-[25px] border-none
        text-white font-bold text-lg tracking-wide
        bg-gradient-to-b from-[#00c458] to-[#007a38]
        transition-transform duration-200 cubic-bezier(0.34, 1.56, 0.64, 1)
        active:scale-95
        hover:brightness-110
        ${BUTTON_SHADOW_CLASS}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
