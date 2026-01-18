import React from 'react';

interface LiquidSwitchProps {
  isLogin: boolean;
  onToggle: (isLogin: boolean) => void;
}

export const LiquidSwitch: React.FC<LiquidSwitchProps> = ({ isLogin, onToggle }) => {
  return (
    <div className="relative w-full h-[50px] bg-black/40 rounded-full p-1 mb-8 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] flex items-center">
      {/* The Liquid Bubble (Animated Background) */}
      <div
        className={`
          absolute top-1 bottom-1 w-[calc(50%-4px)]
          bg-bhood-green rounded-full
          shadow-[0_2px_10px_rgba(0,158,72,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]
          transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
          z-0
        `}
        style={{
          left: isLogin ? '4px' : 'calc(50%)',
        }}
      />

      {/* Login Label */}
      <button
        onClick={() => onToggle(true)}
        className={`
          flex-1 z-10 text-sm font-bold uppercase tracking-wider text-center
          transition-colors duration-300
          ${isLogin ? 'text-white text-shadow-sm' : 'text-gray-400 hover:text-gray-200'}
        `}
      >
        Login
      </button>

      {/* Register Label */}
      <button
        onClick={() => onToggle(false)}
        className={`
          flex-1 z-10 text-sm font-bold uppercase tracking-wider text-center
          transition-colors duration-300
          ${!isLogin ? 'text-white text-shadow-sm' : 'text-gray-400 hover:text-gray-200'}
        `}
      >
        Register
      </button>
    </div>
  );
};
