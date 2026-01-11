// src_ui/src/systems/chat/Chat.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import rpc from "../../rpc";

const AVAILABLE_COMMANDS = [
  "/veh",
  "/fix",
  "/fly",
  "/tpwp",
  "/me",
  "/myweather",
  "/loc",
  "/stats",
  "/server",
];

const MAX_MESSAGES = 50;
const MAX_HISTORY = 10;
const MAX_SUGGESTIONS = 5;

// Escape HTML pentru siguranță (dangerouslySetInnerHTML)
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Parse `!{#RRGGBB}` -> <span style="color:#RRGGBB">
function formatColoredTextToHtml(text) {
  const safe = escapeHtml(text);
  const re = /!\{#([0-9a-fA-F]{6})\}/g;

  let out = "";
  let last = 0;
  let opened = false;

  for (const m of safe.matchAll(re)) {
    const idx = m.index ?? 0;
    const hex = m[1];

    out += safe.slice(last, idx);
    if (opened) out += "</span>";
    out += `<span style="color:#${hex}">`;
    opened = true;
    last = idx + m[0].length;
  }

  out += safe.slice(last);
  if (opened) out += "</span>";
  return out;
}

export default function Chat() {
  const [messages, setMessages] = useState([]); // {id, html}
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");

  // history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const draftRef = useRef("");

  // suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [suggestIndex, setSuggestIndex] = useState(0);

  const inputRef = useRef(null);
  const messagesRef = useRef(null);

  const textShadowStyle = useMemo(
    () => ({
      textShadow: "0px 0px 2px #000, 0px 0px 2px #000",
    }),
    []
  );

  function recalcSuggestions(nextValue) {
    const v = String(nextValue ?? "");
    const trimmed = v.trim();

    if (!trimmed.startsWith("/")) {
      setSuggestions([]);
      setSuggestIndex(0);
      return;
    }

    const first = trimmed.split(/\s+/)[0];
    const filtered = AVAILABLE_COMMANDS.filter((c) =>
      c.toLowerCase().startsWith(first.toLowerCase())
    ).slice(0, MAX_SUGGESTIONS);

    setSuggestions(filtered);
    setSuggestIndex(0);
  }

  // Helper: scroll la bottom doar dacă user e deja aproape de bottom (ca să nu deranjăm scroll manual)
  function maybeStickToBottom() {
    const el = messagesRef.current;
    if (!el) return;

    // Dacă chat e închis, menținem întotdeauna jos (overflow hidden oricum)
    if (!visible) {
      el.scrollTop = el.scrollHeight;
      return;
    }

    // Dacă chat e deschis și user e aproape jos, autoscroll
    const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    if (distanceToBottom < 40) {
      el.scrollTop = el.scrollHeight;
    }
  }

  // Events: push/toggle
  useEffect(() => {
    const onPush = (e) => {
      const detail = e?.detail;
      let rawText = "";
      let color = null;

      if (typeof detail === "string") rawText = detail;
      else if (detail && typeof detail === "object") {
        rawText = String(detail.text ?? "");
        color = detail.color ? String(detail.color) : null;
      } else return;

      const inner = formatColoredTextToHtml(rawText);

      const html =
        color && /^#?[0-9a-fA-F]{6}$/.test(color)
          ? `<span style="color:${color.startsWith("#") ? color : `#${color}`}">${inner}</span>`
          : inner;

      setMessages((prev) => {
        const next = [...prev, { id: `${Date.now()}_${Math.random()}`, html }];
        if (next.length > MAX_MESSAGES) next.splice(0, next.length - MAX_MESSAGES);
        return next;
      });
    };

    const onToggle = (e) => {
      const state = Boolean(e?.detail?.state);
      setVisible(state);

      if (state) {
        setValue("");
        setHistoryIndex(-1);
        draftRef.current = "";
        setSuggestions([]);
        setSuggestIndex(0);

        setTimeout(() => {
          inputRef.current?.focus();
          // când se deschide, lipim scroll-ul jos
          maybeStickToBottom();
        }, 0);
      } else {
        setHistoryIndex(-1);
        draftRef.current = "";
        setSuggestions([]);
        setSuggestIndex(0);

        setTimeout(() => {
          // când se închide, lipim scroll-ul jos ca să fie "default-like"
          maybeStickToBottom();
        }, 0);
      }
    };

    window.addEventListener("chat:push", onPush);
    window.addEventListener("chat:toggle", onToggle);
    return () => {
      window.removeEventListener("chat:push", onPush);
      window.removeEventListener("chat:toggle", onToggle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Autoscroll on new messages (smart)
  useEffect(() => {
    maybeStickToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Key handling (global) when visible
  useEffect(() => {
    const onKeyDown = async (e) => {
      if (!visible) return;

      // ESC cancel
      if (e.key === "Escape") {
        e.preventDefault();
        setVisible(false);
        setValue("");
        setSuggestions([]);
        setSuggestIndex(0);
        setHistoryIndex(-1);
        draftRef.current = "";

        try {
          await rpc.callClient("chat:cancel");
        } catch (err) {
          console.log("[ChatUI] rpc chat:cancel failed:", err);
        }
        return;
      }

      // ENTER send
      if (e.key === "Enter") {
        e.preventDefault();
        const text = value.trim();

        if (text) {
          setHistory((prev) => {
            const next = [text, ...prev.filter((x) => x !== text)];
            return next.slice(0, MAX_HISTORY);
          });
        }

        setHistoryIndex(-1);
        draftRef.current = "";

        // close input (fix layout)
        setVisible(false);
        setSuggestions([]);
        setSuggestIndex(0);
        setValue("");

        try {
          if (text) await rpc.callClient("chat:send", text);
          else await rpc.callClient("chat:cancel");
        } catch (err) {
          console.log("[ChatUI] rpc chat:send failed:", err);
        }
        return;
      }

      // history UP
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHistoryIndex((idx) => {
          if (history.length === 0) return -1;
          if (idx === -1) draftRef.current = value;

          const nextIdx = Math.min(idx + 1, history.length - 1);
          const cmd = history[nextIdx] ?? "";
          setValue(cmd);
          recalcSuggestions(cmd);
          return nextIdx;
        });
        return;
      }

      // history DOWN
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHistoryIndex((idx) => {
          if (history.length === 0) return -1;
          if (idx === -1) return -1;

          const nextIdx = idx - 1;
          if (nextIdx < 0) {
            const draft = draftRef.current ?? "";
            setValue(draft);
            recalcSuggestions(draft);
            draftRef.current = "";
            return -1;
          }

          const cmd = history[nextIdx] ?? "";
          setValue(cmd);
          recalcSuggestions(cmd);
          return nextIdx;
        });
        return;
      }

      // TAB completion
      if (e.key === "Tab") {
        if (suggestions.length > 0) {
          e.preventDefault();
          const pick = suggestions[Math.min(suggestIndex, suggestions.length - 1)];
          if (pick) {
            const parts = value.trim().split(/\s+/);
            const hasArgs = parts.length > 1;
            const completed = hasArgs ? `${pick} ${parts.slice(1).join(" ")}` : `${pick} `;
            setValue(completed);
            recalcSuggestions(completed);
          }
        }
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, value, history, suggestions, suggestIndex]);

  function onChange(e) {
    const next = e.target.value;
    setValue(next);

    // când scrii manual, ieși din history mode
    setHistoryIndex(-1);
    draftRef.current = "";

    recalcSuggestions(next);
  }

  function pickSuggestion(cmd) {
    const completed = `${cmd} `;
    setValue(completed);
    recalcSuggestions(completed);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  const messagesContainerClass = useMemo(() => {
    // scroll conditional + pointer events
    return [
      "flex-1",
      "flex",
      "flex-col",
      "justify-end",
      "min-h-0",
      visible ? "overflow-y-auto pointer-events-auto" : "overflow-hidden",
      "no-scrollbar",
      "pr-1",
      "space-y-[2px]",
    ].join(" ");
  }, [visible]);

  return (
    <div className="fixed top-4 left-4 w-[35vw] max-w-[600px] h-[35vh] flex flex-col justify-end font-sans pointer-events-none">
      {/* no-scrollbar style local (fără plugin) */}
      <style>{`
        .no-scrollbar { scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Lista Mesaje */}
      <div ref={messagesRef} className={messagesContainerClass}>
        {messages.map((m) => (
          <div
            key={m.id}
            className="text-white text-[16px] leading-tight select-none"
            style={textShadowStyle}
            dangerouslySetInnerHTML={{ __html: m.html }}
          />
        ))}
      </div>

      {/* Input (Apare Fix Jos) */}
      {visible && (
        <div className="relative mt-2 pointer-events-auto">
          <input
            ref={inputRef}
            autoFocus
            spellCheck={false}
            value={value}
            onChange={onChange}
            className="w-full bg-black/50 text-white px-2 py-1 border border-white/20 outline-none"
            placeholder=""
          />

          {/* Sugestii (deasupra inputului ca să nu iasă din container) */}
          {suggestions.length > 0 && (
            <div className="absolute bottom-full left-0 w-full mb-1 bg-black/90 border border-white/10">
              {suggestions.slice(0, MAX_SUGGESTIONS).map((s, i) => (
                <div
                  key={s}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    pickSuggestion(s);
                  }}
                  className={`px-2 py-1 text-sm cursor-pointer ${
                    i === suggestIndex ? "bg-white/20" : ""
                  }`}
                >
                  <span className="text-white">{s}</span>
                  <span className="text-gray-300"> {" "}command</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
