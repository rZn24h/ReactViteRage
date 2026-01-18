import React from 'react';
import { INPUT_SHADOW_CLASS, INPUT_FOCUS_SHADOW_CLASS } from './constants';

interface LiquidInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const LiquidInput: React.FC<LiquidInputProps> = ({ className = '', icon, ...props }) => {
  return (
    <div className="relative group w-full mb-5">
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none transition-colors duration-300 group-focus-within:text-bhood-light">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`
            w-full bg-black/30 text-[#e6f2eb] rounded-[20px] 
            py-4 ${icon ? 'pl-12' : 'pl-5'} pr-5
            border-none outline-none
            transition-all duration-300 cubic-bezier(0.25, 0.8, 0.25, 1)
            placeholder:text-gray-500 placeholder:font-light
            focus:bg-[#009e48]/10
            ${INPUT_SHADOW_CLASS}
            focus:${INPUT_FOCUS_SHADOW_CLASS}
            ${className}
          `}
        />
      </div>
    </div>
  );
};
