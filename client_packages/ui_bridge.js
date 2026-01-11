// [Client] Bridge între UI React și Client Logic
// Primește event-uri din UI prin mp.trigger și le forwardează către server
// Rulează în context RAGE:MP Client (NU Node.js, FĂRĂ require/fs)

/**
 * Event handler pentru salvare coordonate din UI
 * Primește event prin mp.trigger din CEF
 * Validare și trimite la server prin callRemote
 * 
 * IMPORTANT: mp.trigger este disponibil în CEF pentru comunicare UI -> Client
 * În UI React, se folosește: window.mp.trigger('eventName', ...args)
 */
mp.events.add('ui:loc:save', (name, x, y, z, h) => {
  console.log('[UI Bridge] Received ui:loc:save event from UI:', { name, x, y, z, h });
  
  // Validare date
  if (!name || typeof name !== 'string') {
    console.log('[UI Bridge] Invalid name:', name);
    return;
  }
  
  if (name.length < 1 || name.length > 64) {
    console.log('[UI Bridge] Name length invalid:', name.length);
    return;
  }
  
  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number' || typeof h !== 'number') {
    console.log('[UI Bridge] Invalid coordinate types');
    return;
  }
  
  if (!isFinite(x) || !isFinite(y) || !isFinite(z) || !isFinite(h)) {
    console.log('[UI Bridge] Non-finite coordinates');
    return;
  }
  
  // Trimite la server
  // Wiki: Events::callRemote - trimite event către server
  mp.events.callRemote('dev:loc:save', name, x, y, z, h);
  console.log('[UI Bridge] Forwarded loc:save to server:', { name, x, y, z, h });
  
  mp.gui.chat.push('[Loc] Saving position to server...');
});

// Notă: Handler-ul pentru 'loc:close' (ESC) este în client_packages/dev/loc.js
// pentru a gestiona direct închiderea și cursorul

console.log('[UI Bridge] UI Bridge module loaded');
