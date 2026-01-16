// [UI] Hacker Prompt Component - Confirmare înainte de hack
import React, { useEffect } from 'react';

interface HackerPromptProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const HackerPrompt: React.FC<HackerPromptProps> = ({ onConfirm, onCancel }) => {
  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onConfirm, onCancel]);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-panel p-8 rounded-xl border-2 border-emerald-500/50 shadow-[0_0_50px_rgba(0,158,72,0.3)] max-w-md w-full mx-4">
        {/* Title */}
        <h2 className="text-3xl font-bold mb-4 tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 text-center">
          SYSTEM DETECTED
        </h2>
        
        {/* Security Level */}
        <div className="text-center mb-8">
          <p className="text-red-400 font-mono text-lg font-bold tracking-wider">
            LEVEL: HIGH SECURITY
          </p>
          <div className="mt-4 h-2 bg-black/60 rounded-full overflow-hidden border border-white/20">
            <div className="h-full bg-red-600 animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Warning Message */}
        <p className="text-gray-300 text-center mb-8 font-mono text-sm leading-relaxed">
          Proceeding will trigger security protocols. <br />
          <span className="text-red-400">Police will be alerted.</span>
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={onConfirm}
            className="group relative px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-bold tracking-widest rounded transition-all duration-300 hover:shadow-[0_0_20px_#10b981] text-center"
          >
            <span className="flex items-center justify-center gap-2">
              [ENTER] Start Breach
            </span>
          </button>

          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold tracking-widest rounded transition-all duration-300 text-center"
          >
            [ESC] Cancel
          </button>
        </div>

        {/* Hint */}
        <p className="text-gray-500 text-center mt-6 text-xs font-mono">
          Press ENTER to proceed or ESC to abort
        </p>
      </div>
    </div>
  );
};

export default HackerPrompt;
