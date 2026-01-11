// [UI] Componenta principală a aplicației React
// Această componentă este afișată în CEF (Chromium Embedded Framework) al RAGE:MP
// Environment: Browser pur (React 18 + Vite)
// Constraint: NU are acces direct la mp.game; comunicarea se face prin window.mp.trigger()

import React, { useState, useEffect } from "react";
import FlyIndicator from "./components/FlyIndicator";
import LocWindow from "./components/LocWindow";
import Chat from "./systems/chat/Chat";

// Componenta principală a aplicației
function App() {
  // Log pentru debugging în Browser DevTools (F11 în RAGE:MP)
  console.log("[UI] App component rendered.");

  // State pentru Fly Mode
  const [flyActive, setFlyActive] = useState(false);
  const [flySpeed, setFlySpeed] = useState(1.0);

  // State pentru Loc Window
  const [locOpen, setLocOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 0, h: 0 });

  /**
   * Setup event listeners pentru evenimente din Client Logic
   * Clientul trimite evenimente prin browser.execute cu CustomEvent
   */
  useEffect(() => {
    console.log("[UI] Setting up event listeners...");

    /**
     * Event handler pentru fly:update
     * Trimis de client_packages/admin/fly.js când se schimbă starea fly mode
     */
    const handleFlyUpdate = (event) => {
      const { active, speed } = event.detail || {};
      console.log("[UI] fly:update event received:", { active, speed });
      setFlyActive(active === true);
      if (typeof speed === "number") {
        setFlySpeed(speed);
      }
    };

    /**
     * Event handler pentru loc:toggle
     * Trimis de client_packages/dev/loc.js când se toggle fereastra loc
     */
    const handleLocToggle = (event) => {
      const { open } = event.detail || {};
      console.log("[UI] loc:toggle event received:", { open });
      setLocOpen(open === true);
    };

    /**
     * Event handler pentru loc:update
     * Trimis de client_packages/dev/loc.js la fiecare update coordonate (throttled)
     */
    const handleLocUpdate = (event) => {
      const { x, y, z, h } = event.detail || {};
      console.log("[UI] loc:update event received:", { x, y, z, h });
      if (
        typeof x === "number" &&
        typeof y === "number" &&
        typeof z === "number" &&
        typeof h === "number"
      ) {
        setCoords({ x, y, z, h });
      }
    };

    // Adaugă event listeners
    window.addEventListener("fly:update", handleFlyUpdate);
    window.addEventListener("loc:toggle", handleLocToggle);
    window.addEventListener("loc:update", handleLocUpdate);

    console.log("[UI] Event listeners registered");

    // Cleanup: șterge event listeners când componenta se unmount
    return () => {
      console.log("[UI] Cleaning up event listeners...");
      window.removeEventListener("fly:update", handleFlyUpdate);
      window.removeEventListener("loc:toggle", handleLocToggle);
      window.removeEventListener("loc:update", handleLocUpdate);
    };
  }, []); // Empty dependency array = rulează doar o dată la mount

  return (
    // Wrapper transparent pentru overlay în joc
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none", // Permite click prin fundal, dar pe componente e activ
      }}
    >
      {/* Chat Custom - mereu activ, gestionă vizibilitatea intern */}
      <Chat />

      {/* Fly Indicator - overlay în colțul dreapta-sus */}
      <div style={{ pointerEvents: "auto" }}>
        <FlyIndicator active={flyActive} speed={flySpeed} />
      </div>

      {/* Loc Window - overlay în colțul stânga-jos */}
      <div style={{ pointerEvents: "auto" }}>
        <LocWindow open={locOpen} coords={coords} />
      </div>
    </div>
  );
}

// Exportă componenta App
export default App;
