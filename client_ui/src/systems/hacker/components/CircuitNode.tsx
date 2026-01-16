// [UI] Circuit Node Component pentru Hacker Terminal
import React from 'react';
import { GridNode } from '../types';

interface CircuitNodeProps {
  node: GridNode;
  onClick: (node: GridNode) => void;
}

const CircuitNode: React.FC<CircuitNodeProps> = ({ node, onClick }) => {
  const { type, rotation, isPowered, isLocked, isFirewall } = node;

  // Render SVG Paths based on type
  // ViewBox 0 0 100 100
  // Center is 50,50
  // Thickness ~10-15
  
  const getPath = () => {
    switch (type) {
      case 'STRAIGHT':
        // Horizontal line
        return <path d="M0,50 L100,50" />;
      case 'CORNER':
        // Right to Bottom (L shape default)
        return <path d="M100,50 L50,50 L50,100" />;
      case 'T_SHAPE':
        // Right, Bottom, Left
        return <path d="M0,50 L100,50 M50,50 L50,100" />;
      case 'CROSS':
        return <path d="M0,50 L100,50 M50,0 L50,100" />;
      case 'START':
        // Box on left, line to right
        return (
          <>
            <rect x="10" y="10" width="80" height="80" rx="10" fill="currentColor" fillOpacity="0.2" />
            <text x="50" y="55" textAnchor="middle" fill="currentColor" fontSize="20" fontWeight="bold">SRC</text>
            <path d="M50,50 L100,50" />
          </>
        );
      case 'END':
        // Line from left, Box on right
        return (
          <>
            <rect x="10" y="10" width="80" height="80" rx="10" fill="currentColor" fillOpacity="0.2" />
            <text x="50" y="55" textAnchor="middle" fill="currentColor" fontSize="20" fontWeight="bold">DEST</text>
            <path d="M0,50 L50,50" />
          </>
        );
      case 'BLOCKER':
        // X or specific Firewall icon
        return (
          <>
            <path d="M20,20 L80,80 M80,20 L20,80" strokeWidth="8" />
            <rect x="0" y="0" width="100" height="100" fill="transparent" stroke="currentColor" strokeWidth="4" />
          </>
        );
      default:
        return null;
    }
  };

  const handleClick = () => {
    if (!isLocked && !isFirewall) {
      onClick(node);
    }
  };

  // Base styling classes
  const baseClasses = `
    relative w-full h-full 
    flex items-center justify-center 
    border border-white/5 
    transition-all duration-300
    cursor-pointer
    select-none
    overflow-hidden
  `;

  // Dynamic colors
  const strokeColor = isFirewall 
    ? '#ff3b3b' // Red
    : isPowered 
      ? '#009e48' // Neon Green
      : '#4a4a4a'; // Dim Gray

  const glowClass = isPowered ? 'drop-shadow-[0_0_8px_rgba(0,158,72,0.8)]' : '';
  const firewallClass = isFirewall ? 'animate-pulse bg-red-900/20' : '';
  const tileBg = isLocked ? 'bg-black/40' : 'bg-white/5 hover:bg-white/10';

  return (
    <div 
      className={`${baseClasses} ${tileBg} ${firewallClass}`}
      onClick={handleClick}
    >
      {/* Glass reflection gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none z-10" />

      {/* The SVG Circuit */}
      <svg 
          viewBox="0 0 100 100" 
          className={`w-4/5 h-4/5 transition-transform duration-300 ease-in-out ${glowClass}`}
          style={{ 
              transform: `rotate(${rotation * 90}deg)`,
          }}
      >
          <g
              stroke={strokeColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              className={isPowered ? 'wire-flow' : ''}
          >
              {getPath()}
          </g>
          
          {/* Inner "core" line for visual depth */}
          {!isFirewall && type !== 'START' && type !== 'END' && (
               <g
               stroke={isPowered ? '#88ff88' : '#222'}
               strokeWidth="2"
               strokeLinecap="round"
               strokeLinejoin="round"
               fill="none"
               className="opacity-50"
           >
               {getPath()}
           </g>
          )}
      </svg>

      {/* Locked Indicator */}
      {isLocked && !isFirewall && type !== 'START' && type !== 'END' && (
           <div className="absolute top-1 right-1 w-2 h-2 bg-gray-500 rounded-full opacity-50"></div>
      )}
    </div>
  );
};

export default CircuitNode;
