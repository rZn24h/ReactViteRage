// [UI] Hacker Terminal Component - Minigame Circuit Puzzle (V2 Design)
// Environment: Browser (React)
// Funcționalitate: UI pentru hacking ATM cu timer și puzzle de circuite - integrat cu RAGE:MP

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GridState, GridNode, GameStatus } from './types';
import { GRID_SIZE, TIME_LIMIT_SECONDS } from './constants';
import { generateLevel, traceCircuit, checkWinCondition } from './utils/gameLogic';
import CircuitNode from './components/CircuitNode';
import Header from './components/Header';

const HackerTerminal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [grid, setGrid] = useState<GridState>([]);
  const [status, setStatus] = useState<GameStatus>('IDLE');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const [attempts, setAttempts] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize Game
  const initGame = useCallback(() => {
    console.log("[UI] [HackerTerminal] Initializing game...");
    const newGrid = generateLevel();
    // Initial trace to light up the start
    const tracedGrid = traceCircuit(newGrid);
    setGrid(tracedGrid);
    setStatus('PLAYING');
    setTimeLeft(TIME_LIMIT_SECONDS);
    setAttempts(prev => prev + 1);
  }, []);

  // Stop game - cleanup și închide UI
  const stopGame = useCallback(() => {
    console.log("[UI] [HackerTerminal] Stopping game...");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setOpen(false);
    setStatus('IDLE');
    setGrid([]);
    setTimeLeft(TIME_LIMIT_SECONDS);
  }, []);

  // Finish game - trimite rezultat către client
  const finishGame = useCallback((success: boolean) => {
    console.log(`[UI] [HackerTerminal] Game finished: ${success ? "WON" : "LOST"}`);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStatus(success ? 'WON' : 'LOST');

    setTimeout(() => {
      try {
        if (window.mp && typeof window.mp.trigger === "function") {
          window.mp.trigger("hacker:finish", JSON.stringify({ success }));
          console.log("[UI] [HackerTerminal] Sent hacker:finish to client");
        } else {
          console.log("[UI] [HackerTerminal] window.mp.trigger not available (dev mode)");
        }
      } catch (e) {
        console.log("[UI] [HackerTerminal] Error sending finish:", e);
      }
      stopGame();
    }, 2000);
  }, [stopGame]);

  // Start/Hide events from client (CustomEvent)
  useEffect(() => {
    console.log("[UI] [HackerTerminal] Setting up event listeners...");
    
    const onStart = (event: Event) => {
      console.log("[UI] [HackerTerminal] hacker:start event received", event);
      setOpen(true);
      // Delay mic pentru a se asigura că state-ul e actualizat
      setTimeout(() => {
        initGame();
      }, 50);
    };
    
    const onHide = (event: Event) => {
      console.log("[UI] [HackerTerminal] hacker:hide event received", event);
      stopGame();
    };

    window.addEventListener("hacker:start", onStart);
    window.addEventListener("hacker:hide", onHide);
    
    console.log("[UI] [HackerTerminal] Event listeners registered");
    
    return () => {
      console.log("[UI] [HackerTerminal] Cleaning up event listeners...");
      window.removeEventListener("hacker:start", onStart);
      window.removeEventListener("hacker:hide", onHide);
    };
  }, [initGame, stopGame]);

  // Timer Effect
  useEffect(() => {
    if (status !== 'PLAYING') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finishGame(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, finishGame]);

  // Handle Rotation Click
  const handleNodeClick = (node: GridNode) => {
    if (status !== 'PLAYING') return;
    
    setGrid((prevGrid) => {
      // 1. Create shallow copy of grid matrix
      const newGrid = prevGrid.map(row => [...row]);
      
      // 2. Rotate the clicked node
      const targetNode = { ...newGrid[node.row][node.col] };
      targetNode.rotation = (targetNode.rotation + 1) % 4;
      newGrid[node.row][node.col] = targetNode;
      
      // 3. Re-calculate Power Flow
      const tracedGrid = traceCircuit(newGrid);
      
      // 4. Check Win
      if (checkWinCondition(tracedGrid)) {
        finishGame(true);
      }
      
      return tracedGrid;
    });
  };

  if (!open || status === 'IDLE') {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[250] flex flex-col items-center justify-center p-4 relative text-white"
      style={{ pointerEvents: "auto" }}
    >
      {/* Background Decor */}
      <div className="fixed inset-0 bg-black -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 via-black to-black opacity-80"></div>
      </div>

      {/* Scanlines overlay */}
      <div className="scanlines pointer-events-none" />

      <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">
        NET_BREACH
      </h1>

      {status !== 'IDLE' && (
        <>
          <Header timeLeft={timeLeft} score={attempts} status={status} />
          
          {/* The Grid Container - Responsive Tablet Look */}
          <div className="relative p-2 md:p-6 rounded-xl glass-panel border border-white/20 shadow-2xl max-w-[95vw] max-h-[70vh] aspect-square flex items-center justify-center">
              
              {/* Decorative Tablet Corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-500/50 rounded-tl-lg -m-1"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-500/50 rounded-tr-lg -m-1"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-500/50 rounded-bl-lg -m-1"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-500/50 rounded-br-lg -m-1"></div>

              <div 
                  className="grid gap-1 w-full h-full"
                  style={{ 
                      gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
                  }}
              >
                  {grid.map((row) => 
                      row.map((node) => (
                          <CircuitNode 
                              key={node.id} 
                              node={node} 
                              onClick={handleNodeClick} 
                          />
                      ))
                  )}
              </div>

              {/* Overlays for Win/Loss */}
              {(status === 'WON' || status === 'LOST') && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl">
                  <div className="text-center p-8 border border-white/10 bg-black/90 rounded shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                    {status === 'WON' ? (
                      <>
                         <h2 className="text-4xl text-emerald-400 font-bold mb-2 glitch-text">ACCESS GRANTED</h2>
                         <p className="text-gray-400 mb-6 font-mono">Mainframe security bypassed.</p>
                         <div className="text-emerald-500 text-6xl mb-4 animate-bounce">🔓</div>
                      </>
                    ) : (
                      <>
                         <h2 className="text-4xl text-red-500 font-bold mb-2 glitch-text">ACCESS DENIED</h2>
                         <p className="text-gray-400 mb-6 font-mono">Trace complete. Connection failed.</p>
                         <div className="text-red-500 text-6xl mb-4 animate-pulse">⚠️</div>
                      </>
                    )}
                  </div>
                </div>
              )}
          </div>
        </>
      )}
    </div>
  );
};

export default HackerTerminal;
