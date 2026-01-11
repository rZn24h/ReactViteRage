// src_ui/src/systems/dashboard/ServerStats.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Formatează uptime-ul din secunde în format HH:MM
 * @param {number} sec - Secunde (float)
 * @returns {string} Format HH:MM
 */
function formatUptime(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Server Stats Dashboard Component
 * Afișează statistici server, status bridge, ping, și lista de comenzi
 */
export default function ServerStats() {
  const [open, setOpen] = useState(false);

  const [serverName, setServerName] = useState("RAGE Server");
  const [players, setPlayers] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [commands, setCommands] = useState([]);

  const [connected, setConnected] = useState(false);
  const [ping, setPing] = useState(null);
  const lastOkAtRef = useRef(0);

  const statusText = useMemo(() => {
    return connected ? "UI Bridge: CONNECTED" : "UI Bridge: DISCONNECTED";
  }, [connected]);

  // Watchdog local: dacă nu primim pong 10s -> disconnected
  useEffect(() => {
    const id = setInterval(() => {
      const ok = Date.now() - lastOkAtRef.current < 10000;
      setConnected(ok);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Events from client
  useEffect(() => {
    const onToggle = (e) => {
      const state = Boolean(e?.detail?.state);
      console.log("[ServerStats] ui:dashboard:toggle ->", state);
      setOpen(state);
    };

    const onUpdate = (e) => {
      const d = e?.detail || {};
      console.log("[ServerStats] ui:dashboard:update ->", d);
      
      setServerName(String(d.serverName ?? "RAGE Server"));
      setPlayers(Number(d.players ?? 0));
      setUptime(Number(d.uptime ?? 0));
      setCommands(Array.isArray(d.commands) ? d.commands : []);
      
      // Dacă primim update, considerăm bridge alive
      lastOkAtRef.current = Date.now();
      setConnected(true);
    };

    const onPing = (e) => {
      const t = Number(e?.detail?.t ?? 0);
      console.log("[ServerStats] ui:dashboard:ping ->", t);
      
      // Răspundem imediat către client
      if (window.mp && typeof window.mp.trigger === "function") {
        window.mp.trigger("dashboard:pong", t);
        console.log("[ServerStats] Sent dashboard:pong to client, t:", t);
      } else {
        console.log("[ServerStats] window.mp.trigger not available (dev mode?)");
      }
    };

    const onPong = (e) => {
      const d = e?.detail || {};
      const ok = !!d.ok;
      setPing(d.ping === null || d.ping === undefined ? null : Number(d.ping));
      
      console.log("[ServerStats] ui:dashboard:pong ->", { ping: d.ping, ok });
      
      if (ok) {
        lastOkAtRef.current = Date.now();
        setConnected(true);
      } else {
        setConnected(false);
      }
    };

    window.addEventListener("ui:dashboard:toggle", onToggle);
    window.addEventListener("ui:dashboard:update", onUpdate);
    window.addEventListener("ui:dashboard:ping", onPing);
    window.addEventListener("ui:dashboard:pong", onPong);

    return () => {
      window.removeEventListener("ui:dashboard:toggle", onToggle);
      window.removeEventListener("ui:dashboard:update", onUpdate);
      window.removeEventListener("ui:dashboard:ping", onPing);
      window.removeEventListener("ui:dashboard:pong", onPong);
    };
  }, []);

  // ESC close
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  /**
   * Handler pentru închiderea dashboard-ului
   * Trimite event către client pentru a ascunde cursorul
   */
  function handleClose() {
    console.log("[ServerStats] handleClose called");
    setOpen(false);
    
    if (window.mp && typeof window.mp.trigger === "function") {
      window.mp.trigger("dashboard:close");
      console.log("[ServerStats] Sent dashboard:close to client");
    } else {
      console.log("[ServerStats] window.mp.trigger not available (dev mode?)");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onMouseDown={handleClose}
      />

      {/* Modal */}
      <div className="relative w-[900px] max-w-[90vw] rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white text-xl font-semibold">
              Server Status Monitor
            </div>
            <div className="text-white/60 text-sm">
              {serverName}
            </div>
          </div>

          <button
            onClick={handleClose}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm border border-white/10"
          >
            Close
          </button>
        </div>

        {/* Connection status */}
        <div className="mt-5 flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <div className="text-white text-sm">{statusText}</div>
        </div>

        {/* Stats grid */}
        <div className="mt-5 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-white/60 text-xs">Players Online</div>
            <div className="text-white text-2xl font-semibold">{players}</div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-white/60 text-xs">Server Uptime</div>
            <div className="text-white text-2xl font-semibold">
              {formatUptime(uptime)}
            </div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-white/60 text-xs">My Ping</div>
            <div className="text-white text-2xl font-semibold">
              {ping === null ? "--" : `${ping} ms`}
            </div>
          </div>
        </div>

        {/* Commands list */}
        <div className="mt-6">
          <div className="text-white/80 text-sm mb-2">Available Commands</div>
          <div className="max-h-[220px] overflow-y-auto rounded-xl bg-white/5 border border-white/10 p-3">
            <ul className="space-y-1">
              {commands.map((c) => (
                <li key={c} className="text-white/90 text-sm font-mono">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 text-white/40 text-xs">
          Tip: Press ESC to close.
        </div>
      </div>
    </div>
  );
}
