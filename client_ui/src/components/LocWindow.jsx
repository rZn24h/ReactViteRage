// [UI] Componentă React pentru Coords Manager Window
// Afișează coordonate live (X, Y, Z, Heading) cu butoane COPY și save la server
// Styling cu Tailwind CSS

import React, { useState, useEffect, useRef } from 'react';

/**
 * LocWindow - Fereastră pentru coords manager
 * @param {Object} props - Props componentă
 * @param {boolean} props.open - Starea fereastrei (true = deschis, false = închis)
 * @param {Object} props.coords - Coordonate {x, y, z, h}
 */
function LocWindow({ open, coords = { x: 0, y: 0, z: 0, h: 0 } }) {
  const [positionName, setPositionName] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const windowRef = useRef(null);

  // Helper pentru formatare număr
  const format = (n) => (Number.isFinite(n) ? n.toFixed(2) : '0.00');

  // Focus management: când fereastra se deschide, setează focus pentru ESC
  useEffect(() => {
    if (open && windowRef.current) {
      windowRef.current.focus();
      console.log('[LocUI] Window focused for ESC key detection');
    }
  }, [open]);

  // ESC key handler pentru închidere
  useEffect(() => {
    if (!open) {
      return; // Nu adăuga listener dacă fereastra e închisă
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        console.log('[LocUI] ESC pressed -> triggering loc:close');
        
        // Trimite event la client pentru închidere
        if (window.mp && window.mp.trigger) {
          window.mp.trigger('loc:close');
        } else {
          console.log('[LocUI] Mock Trigger (dev mode): loc:close');
        }
      }
    };

    // Adaugă listener pe window (funcționează chiar dacă input-ul e focusat)
    window.addEventListener('keydown', handleKeyDown);
    console.log('[LocUI] ESC key listener added');

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      console.log('[LocUI] ESC key listener removed');
    };
  }, [open]);

  // Nu afișa dacă fereastra este închisă
  if (!open) {
    return null;
  }

  console.log('[UI] LocWindow rendered:', { open, coords });

  /**
   * Copiază text în clipboard
   * Folosește navigator.clipboard.writeText cu fallback pentru browsere mai vechi
   * @param {string} value - Valoarea de copiat
   * @param {string} fieldName - Numele câmpului (pentru feedback)
   */
  const copyToClipboard = async (value, fieldName) => {
    try {
      // Încearcă clipboard API modern
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(String(value));
        console.log(`[UI] Copied ${fieldName} to clipboard:`, value);
      } else {
        // Fallback: create hidden textarea + select + execCommand
        const textarea = document.createElement('textarea');
        textarea.value = String(value);
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        console.log(`[UI] Copied ${fieldName} to clipboard (fallback):`, value);
      }

      // Afișează feedback temporar
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.log(`[UI] Error copying ${fieldName} to clipboard:`, e);
      alert(`Failed to copy ${fieldName}`);
    }
  };

  /**
   * Trimite cerere de salvare coordonate la server prin mp.trigger
   * IMPORTANT: window.mp.trigger este disponibil în CEF pentru comunicare UI -> Client
   */
  const saveToServer = () => {
    if (!positionName || positionName.trim().length === 0) {
      alert('Please enter a position name');
      return;
    }

    if (positionName.length > 64) {
      alert('Position name must be 64 characters or less');
      return;
    }

    console.log('[UI] Saving position to server:', {
      name: positionName,
      x: coords.x,
      y: coords.y,
      z: coords.z,
      h: coords.h
    });

    // Helper pentru mp.trigger cu mock pentru dev mode
    const trigger = (event, ...args) => {
      if (window.mp && window.mp.trigger) {
        window.mp.trigger(event, ...args);
      } else {
        console.log('[UI] Mock Trigger (dev mode):', event, args);
      }
    };

    // Trimite event la client
    trigger('ui:loc:save', positionName.trim(), coords.x, coords.y, coords.z, coords.h);

    // Feedback local
    setSaveStatus('Saving...');
    setTimeout(() => {
      setSaveStatus(null);
      setPositionName(''); // Reset input
    }, 2000);
  };

  /**
   * Copiază toate datele în format: "X: 123.45, Y: 67.89, Z: 10.00, H: 90.00"
   */
  const copyAllData = async () => {
    const all = `X: ${format(coords.x)}, Y: ${format(coords.y)}, Z: ${format(coords.z)}, H: ${format(coords.h)}`;
    console.log('[LocUI] Copy All clicked:', all);
    
    await copyToClipboard(all, 'All Data');
  };

  return (
    <div 
      ref={windowRef}
      tabIndex={0}
      className="fixed bottom-4 left-4 bg-black/90 text-white p-4 rounded-lg shadow-lg border border-blue-500 min-w-[320px] focus:outline-none"
    >
      <h2 className="text-lg font-bold mb-3 text-blue-400">Coords Manager</h2>

      {/* Coordonate live */}
      <div className="space-y-2 mb-4">
        {/* X */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 w-20">X:</span>
          <code className="flex-1 bg-gray-800 px-2 py-1 rounded">{coords.x.toFixed(4)}</code>
          <button
            onClick={() => copyToClipboard(coords.x.toFixed(4), 'X')}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            {copiedField === 'X' ? '✓' : 'COPY'}
          </button>
        </div>

        {/* Y */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 w-20">Y:</span>
          <code className="flex-1 bg-gray-800 px-2 py-1 rounded">{coords.y.toFixed(4)}</code>
          <button
            onClick={() => copyToClipboard(coords.y.toFixed(4), 'Y')}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            {copiedField === 'Y' ? '✓' : 'COPY'}
          </button>
        </div>

        {/* Z */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 w-20">Z:</span>
          <code className="flex-1 bg-gray-800 px-2 py-1 rounded">{coords.z.toFixed(4)}</code>
          <button
            onClick={() => copyToClipboard(coords.z.toFixed(4), 'Z')}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            {copiedField === 'Z' ? '✓' : 'COPY'}
          </button>
        </div>

        {/* Heading */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 w-20">H:</span>
          <code className="flex-1 bg-gray-800 px-2 py-1 rounded">{coords.h.toFixed(2)}</code>
          <button
            onClick={() => copyToClipboard(coords.h.toFixed(2), 'H')}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            {copiedField === 'H' ? '✓' : 'COPY'}
          </button>
        </div>
      </div>

      {/* Copy All Data Button */}
      <div className="mb-4">
        <button
          onClick={copyAllData}
          className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-medium"
        >
          {copiedField === 'All Data' ? '✓ Copied!' : 'Copy All Data'}
        </button>
      </div>

      {/* Save to Server */}
      <div className="border-t border-gray-700 pt-3">
        <label className="block text-sm text-gray-400 mb-2">Saved Position Name</label>
        <input
          type="text"
          value={positionName}
          onChange={(e) => setPositionName(e.target.value)}
          placeholder="Enter position name..."
          maxLength={64}
          className="w-full bg-gray-800 text-white px-3 py-2 rounded mb-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={saveToServer}
          disabled={saveStatus !== null}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded font-medium"
        >
          {saveStatus || 'Save to Server Log'}
        </button>
      </div>
    </div>
  );
}

export default LocWindow;
