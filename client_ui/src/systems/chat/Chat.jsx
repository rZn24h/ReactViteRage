// [UI] Componentă React pentru Chat Custom (GTA V style)
// Înlocuiește complet chat-ul default RAGE:MP
// Environment: Browser pur (React 18 + Vite)
// Constraint: NU are acces direct la mp.game; comunicarea se face prin window.mp.trigger()

import React, { useState, useEffect, useRef } from 'react';

/**
 * Chat - Componenta principală pentru chat custom
 * Afișează mesaje în stânga-sus și input când e activat
 */
function Chat() {
  // State pentru mesaje (listă de mesaje cu text și color opțional)
  const [messages, setMessages] = useState([]);
  const MAX_MESSAGES = 50; // Păstrează maxim 50 mesaje (șterge cele mai vechi)

  // State pentru input visibility
  const [inputVisible, setInputVisible] = useState(false);
  
  // State pentru input text
  const [inputText, setInputText] = useState('');

  // Ref pentru input element (pentru autoFocus)
  const inputRef = useRef(null);

  /**
   * Helper pentru mp.trigger cu mock pentru dev mode
   * IMPORTANT: window.mp.trigger este disponibil în CEF pentru comunicare UI -> Client
   */
  const trigger = (event, ...args) => {
    if (window.mp && window.mp.trigger) {
      window.mp.trigger(event, ...args);
    } else {
      console.log('[ChatUI] Mock Trigger (dev mode):', event, args);
    }
  };

  /**
   * Setup event listeners pentru evenimente din Client Logic
   * Clientul trimite evenimente prin browser.execute cu CustomEvent
   */
  useEffect(() => {
    console.log('[ChatUI] Setting up event listeners...');

    /**
     * Event handler pentru chat:push
     * Trimis de client_packages/systems/chat/index.js când primește mesaj de la server
     * Acceptă detail string SAU {text, color}
     */
    const handleChatPush = (event) => {
      const detail = event.detail;
      console.log('[ChatUI] push event received:', detail);

      let messageText = '';
      let messageColor = '#ffffff'; // Default alb

      // Procesează detail: poate fi string sau obiect {text, color}
      if (typeof detail === 'string') {
        messageText = detail;
      } else if (detail && typeof detail === 'object') {
        messageText = detail.text || detail.message || String(detail);
        messageColor = detail.color || '#ffffff';
      } else {
        messageText = String(detail || '');
      }

      if (!messageText || messageText.trim().length === 0) {
        console.log('[ChatUI] Empty message, ignoring');
        return;
      }

      // Adaugă mesaj nou
      setMessages((prev) => {
        const newMessages = [...prev, { text: messageText, color: messageColor, id: Date.now() }];
        // Păstrează doar ultimele MAX_MESSAGES mesaje
        if (newMessages.length > MAX_MESSAGES) {
          return newMessages.slice(-MAX_MESSAGES);
        }
        return newMessages;
      });

      console.log('[ChatUI] Message added:', messageText);
    };

    /**
     * Event handler pentru chat:toggle
     * Trimis de client_packages/systems/chat/index.js când se apasă T
     * detail.state (boolean) - true = deschide input, false = închide
     */
    const handleChatToggle = (event) => {
      const { state } = event.detail || {};
      console.log('[ChatUI] toggle event received, state:', state);
      
      setInputVisible(state === true);
      
      // Când se deschide inputul, golește valoarea
      if (state === true) {
        setInputText('');
      }
    };

    // Adaugă event listeners
    window.addEventListener('chat:push', handleChatPush);
    window.addEventListener('chat:toggle', handleChatToggle);

    console.log('[ChatUI] Event listeners registered');

    // Cleanup: șterge event listeners când componenta se unmount
    return () => {
      console.log('[ChatUI] Cleaning up event listeners...');
      window.removeEventListener('chat:push', handleChatPush);
      window.removeEventListener('chat:toggle', handleChatToggle);
    };
  }, []);

  /**
   * AutoFocus input când se deschide
   */
  useEffect(() => {
    if (inputVisible && inputRef.current) {
      inputRef.current.focus();
      console.log('[ChatUI] Input focused');
    }
  }, [inputVisible]);

  /**
   * Keydown handler pentru ENTER și ESC (pe window pentru siguranță în CEF)
   */
  useEffect(() => {
    if (!inputVisible) {
      return; // Nu adăuga listener dacă inputul e închis
    }

    const handleKeyDown = (e) => {
      // ENTER: trimite mesajul
      if (e.key === 'Enter' && inputVisible) {
        e.preventDefault();
        e.stopPropagation();
        
        const text = inputText.trim();
        if (text.length > 0) {
          console.log('[ChatUI] enter send:', text);
          trigger('chat:send', text);
          setInputText('');
          setInputVisible(false);
        } else {
          // Dacă e gol, doar închide inputul
          setInputVisible(false);
          trigger('chat:cancel');
        }
      }
      
      // ESC: închide inputul fără a trimite
      if (e.key === 'Escape' && inputVisible) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('[ChatUI] esc cancel');
        setInputVisible(false);
        setInputText('');
        trigger('chat:cancel');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    console.log('[ChatUI] Keydown listener added');

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      console.log('[ChatUI] Keydown listener removed');
    };
  }, [inputVisible, inputText]);

  /**
   * Handler pentru submit manual (buton sau Enter pe input)
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    
    if (text.length > 0) {
      console.log('[ChatUI] enter send:', text);
      trigger('chat:send', text);
      setInputText('');
      setInputVisible(false);
    } else {
      // Dacă e gol, doar închide
      setInputVisible(false);
      trigger('chat:cancel');
    }
  };

  return (
    <>
      {/* Lista de mesaje - stânga-sus, stil GTA V */}
      <div
        className="fixed top-4 left-4 pointer-events-none z-50"
        style={{
          maxWidth: '600px',
          maxHeight: '400px',
          overflow: 'hidden',
        }}
      >
        <div className="flex flex-col gap-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="text-white text-sm font-sans px-2 py-1 rounded"
              style={{
                textShadow: '2px 2px 0 #000',
                backgroundColor: 'transparent',
                wordBreak: 'break-word',
                color: msg.color || '#ffffff',
              }}
            >
              {msg.text}
            </div>
          ))}
        </div>
      </div>

      {/* Input text - apare doar când inputVisible === true */}
      {inputVisible && (
        <div className="fixed bottom-4 left-4 pointer-events-auto z-50">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Scrie mesaj..."
              className="bg-black/80 text-white px-4 py-2 rounded border border-blue-500 focus:border-blue-400 focus:outline-none min-w-[400px]"
              style={{
                textShadow: '1px 1px 0 #000',
              }}
              autoFocus
              maxLength={128} // Limitare lungime mesaj
            />
          </form>
        </div>
      )}
    </>
  );
}

export default Chat;
