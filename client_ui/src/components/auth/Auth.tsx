// [UI] Componenta de autentificare (Login/Register)
// Folosește designul Liquid Glass cu componentele custom
// Environment: Browser pur (React 18 + Vite)
// Comunicare: window.mp.trigger() pentru a trimite date către Client Logic

import React, { useState, useEffect } from 'react';
import { LiquidCard } from './LiquidCard';
import { LiquidSwitch } from './LiquidSwitch';
import { LiquidInput } from './LiquidInput';
import { LiquidButton } from './LiquidButton';
import rpc from '../../rpc';

// Icons as simple SVG components
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
  </svg>
);

interface AuthProps {
  onAuthSuccess?: () => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  console.log('[UI] [Auth] Component rendered');

  // State pentru toggle Login/Register
  const [isLogin, setIsLogin] = useState(true);

  // State pentru input-uri
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State pentru erori și loading
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Setup event listeners și notifică clientul că Auth UI este activ
   * Clientul va activa camera și cursorul
   */
  useEffect(() => {
    console.log('[UI] [Auth] Component mounted, notifying client to enable auth mode');
    
    // Notifică clientul că Auth UI este activ (pentru a activa camera și cursorul)
    if (window.mp && window.mp.trigger) {
      window.mp.trigger('auth:ui:opened');
    }
    
    console.log('[UI] [Auth] Setting up event listeners...');

    /**
     * Event handler pentru auth:success
     * Trimis de client_packages/systems/auth/index.js când autentificarea reușește
     */
    const handleAuthSuccess = (event: Event) => {
      console.log('[UI] [Auth] auth:success event received');
      setError(null);
      setIsLoading(false);
      
      // Notifică clientul că autentificarea a reușit (pentru a dezactiva camera și cursorul)
      if (window.mp && window.mp.trigger) {
        window.mp.trigger('auth:success:client');
      }
      
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    };

    /**
     * Event handler pentru auth:error
     * Trimis de client_packages/systems/auth/index.js când apare o eroare
     */
    const handleAuthError = (event: CustomEvent) => {
      const errorMessage = event.detail?.message || 'Eroare necunoscută';
      console.log('[UI] [Auth] auth:error event received:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    };

    // Adaugă event listeners
    window.addEventListener('auth:success', handleAuthSuccess);
    window.addEventListener('auth:error', handleAuthError as EventListener);

    console.log('[UI] [Auth] Event listeners registered');

    // Cleanup: șterge event listeners când componenta se unmount
    return () => {
      console.log('[UI] [Auth] Component unmounting, notifying client to disable auth mode');
      
      // Notifică clientul că Auth UI este închis (pentru a dezactiva camera și cursorul)
      if (window.mp && window.mp.trigger) {
        window.mp.trigger('auth:ui:closed');
      }
      
      console.log('[UI] [Auth] Cleaning up event listeners...');
      window.removeEventListener('auth:success', handleAuthSuccess);
      window.removeEventListener('auth:error', handleAuthError as EventListener);
    };
  }, [onAuthSuccess]);

  /**
   * Funcție pentru validare și trimitere date către Client Logic
   * Verifică input-urile și trimite datele prin RPC bridge
   */
  const handleAuth = async () => {
    console.log('[UI] [Auth] handleAuth called', { isLogin, username, email });

    // Resetare erori
    setError(null);

    // Validare pentru Login
    if (isLogin) {
      if (!username.trim()) {
        setError('Te rog introdu username-ul');
        return;
      }
      if (!password.trim()) {
        setError('Te rog introdu parola');
        return;
      }
    } else {
      // Validare pentru Register
      if (!username.trim()) {
        setError('Te rog introdu un username');
        return;
      }
      if (username.length < 3) {
        setError('Username-ul trebuie să aibă minim 3 caractere');
        return;
      }
      if (!email.trim()) {
        setError('Te rog introdu email-ul');
        return;
      }
      // Validare simplă pentru email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Te rog introdu un email valid');
        return;
      }
      if (!password.trim()) {
        setError('Te rog introdu o parolă');
        return;
      }
      if (password.length < 4) {
        setError('Parola trebuie să aibă minim 4 caractere');
        return;
      }
      if (password !== confirmPassword) {
        setError('Parolele nu coincid');
        return;
      }
    }

    // Setare loading state
    setIsLoading(true);

    try {
      // Pregătește payload-ul
      const payload = JSON.stringify({
        username: username.trim(),
        password: password,
        email: isLogin ? undefined : email.trim(),
        type: isLogin ? 'login' : 'register',
      });

      console.log('[UI] [Auth] Sending auth request:', { type: isLogin ? 'login' : 'register', username });

      // Trimite către Client Logic prin RPC bridge
      await rpc.callClient('auth:submit', payload);
    } catch (error) {
      console.error('[UI] [Auth] Error sending auth request:', error);
      setError('Eroare la comunicarea cu serverul');
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="relative w-full h-screen overflow-hidden flex items-center justify-center font-sans"
      style={{
        background: 'transparent',
        backgroundColor: 'transparent',
      }}
    >
      {/* Main UI Container */}
      <div 
        className="z-10 w-full flex justify-center px-4"
        style={{
          background: 'transparent',
          backgroundColor: 'transparent',
        }}
      >
        <LiquidCard>
          
          {/* Header / Logo Area */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-white tracking-wider mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              B-HOOD
            </h1>
            <p className="text-bhood-light text-xs font-semibold tracking-[0.2em] uppercase opacity-80">
              Liquid Generation
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {/* Login/Register Toggle */}
          <LiquidSwitch isLogin={isLogin} onToggle={setIsLogin} />

          {/* Form Container with Animation */}
          <div className="w-full transition-all duration-300">
            {isLogin ? (
              // LOGIN FORM
              <div className="animate-fade-in-up">
                <LiquidInput 
                  type="text" 
                  placeholder="Username" 
                  icon={<UserIcon />}
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
                <LiquidInput 
                  type="password" 
                  placeholder="Password" 
                  icon={<LockIcon />}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      handleAuth();
                    }
                  }}
                />
                
                <div className="flex justify-between items-center mb-6 px-2 text-xs text-gray-400">
                  <label className="flex items-center cursor-pointer hover:text-white transition-colors">
                    <input type="checkbox" className="mr-2 accent-bhood-green" />
                    Remember me
                  </label>
                  <a href="#" className="hover:text-bhood-light transition-colors">Forgot Password?</a>
                </div>

                <LiquidButton onClick={handleAuth} disabled={isLoading}>
                  {isLoading ? 'CONNECTING...' : 'CONNECT TO SERVER'}
                </LiquidButton>
              </div>
            ) : (
              // REGISTER FORM
              <div className="animate-fade-in-up">
                <LiquidInput 
                  type="text" 
                  placeholder="Choose Username" 
                  icon={<UserIcon />}
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
                <LiquidInput 
                  type="email" 
                  placeholder="Email Address" 
                  icon={<EmailIcon />}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
                <LiquidInput 
                  type="password" 
                  placeholder="Create Password" 
                  icon={<LockIcon />}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <LiquidInput 
                  type="password" 
                  placeholder="Confirm Password" 
                  icon={<LockIcon />}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      handleAuth();
                    }
                  }}
                />

                <div className="mt-4">
                  <LiquidButton onClick={handleAuth} disabled={isLoading}>
                    {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                  </LiquidButton>
                </div>
              </div>
            )}
          </div>

          {/* Footer Text */}
          <div className="mt-8 text-center text-white/20 text-[10px] uppercase tracking-widest">
            B-Hood Roleplay &copy; 2024
          </div>
        </LiquidCard>
      </div>

      {/* Simple fade-in animation style injection for the form switching */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
