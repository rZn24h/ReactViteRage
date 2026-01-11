// [UI] RPC Helper pentru comunicare UI -> Client
// Wrapper peste window.mp.trigger pentru a oferi API consistent
// Environment: Browser pur (CEF)

/**
 * RPC helper pentru apeluri către Client Logic
 * Folosește window.mp.trigger() pentru comunicare UI -> Client
 */
const rpc = {
  /**
   * Trimite event către Client Logic
   * @param {string} eventName - Numele event-ului
   * @param {...any} args - Argumente pentru event
   * @returns {Promise<void>}
   */
  async callClient(eventName, ...args) {
    console.log(`[RPC] callClient: ${eventName}`, args);
    
    try {
      if (window.mp && window.mp.trigger) {
        window.mp.trigger(eventName, ...args);
        return Promise.resolve();
      } else {
        // Mock pentru dev mode (când window.mp nu există)
        console.log(`[RPC] Mock callClient (dev mode): ${eventName}`, args);
        return Promise.resolve();
      }
    } catch (error) {
      console.error(`[RPC] Error calling ${eventName}:`, error);
      return Promise.reject(error);
    }
  }
};

export default rpc;
