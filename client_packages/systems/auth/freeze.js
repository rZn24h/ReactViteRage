// [Client] Handler pentru freeze/unfreeze player
// Primește event-uri de la server pentru a controla freeze-ul jucătorului
// Wiki: Entity::freezePosition - îngheță/dezîngheță poziția jucătorului

console.log('[Client] [Auth] [Freeze] Module loading...');

/**
 * Event handler pentru freeze de la server
 * Primește: (freezeState) - true pentru freeze, false pentru unfreeze
 * Wiki: Events::add - ascultă event-uri trimise de server prin player.call
 */
mp.events.add('freeze', (freezeState) => {
  console.log('[Client] [Auth] [Freeze] Received freeze event:', freezeState);
  
  try {
    const player = mp.players.local;
    
    if (!player) {
      console.log('[Client] [Auth] [Freeze] Player not found');
      return;
    }
    
    // Wiki: Entity::freezePosition - îngheță/dezîngheță poziția jucătorului
    // Parametrul: true = freeze, false = unfreeze
    player.freezePosition(!!freezeState);
    
    console.log('[Client] [Auth] [Freeze] Player freeze state set to:', !!freezeState);
  } catch (error) {
    console.error('[Client] [Auth] [Freeze] Error setting freeze state:', error);
  }
});

console.log('[Client] [Auth] [Freeze] Module loaded successfully');
