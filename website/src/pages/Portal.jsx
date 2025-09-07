// src/pages/Portal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import PortalKingAI from "./PortalKingAI";
import PortalSocial from "./PortalSocial";
import PortalTools from "./PortalTools";


const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const tokenHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("aa_token")}` });

export default function Portal() {
  const [mode, setMode] = useState("king"); // 'king' | 'social' | 'tools'
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Welcome to AadeeChat! Pick a mode to get started." },
  ]);
  const [input, setInput] = useState("");
  const scroller = useRef(null);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("aa_user")) || {}; } catch { return {}; }
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input, mode };
    setMessages((m) => [...m, userMsg]);

    // Simple dispatcher to the stub APIs so you can see end-to-end behavior
    let reply = { role: "assistant", text: "" };
    try {
      if (mode === "king") {
        reply.text = "Got it! I’ll prepare a change-hours plan. (Try the form on the left for structured input.)";
      } else if (mode === "social") {
        // hit stub ideas endpoint
        const res = await fetch(`${API_BASE}/actions/social/instagram/ideas`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...tokenHeader() },
          body: JSON.stringify({ topic: input, count: 3 }),
        });
        const data = await res.json();
        reply.text = "Here are 3 post ideas:\n" + data.ideas.map(i => `• ${i.headline}\n${i.caption}`).join("\n\n");
      } else if (mode === "tools") {
        // demo brand suggestions
        const res = await fetch(`${API_BASE}/actions/brand/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...tokenHeader() },
          body: JSON.stringify({ keywords: input.split(/\s+/).slice(0,5), tone: "modern" }),
        });
        const data = await res.json();
        reply.text = "Name ideas:\n- " + data.names.join("\n- ");
      }
    } catch (e) {
      reply.text = "Hmm, something went wrong reaching the server.";
    }
    setMessages((m) => [...m, reply]);
    setInput("");
  };

  const logout = () => {
    localStorage.removeItem("aa_token");
    localStorage.removeItem("aa_user");
    window.location.href = "/portal/login";
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: "calc(100vh - 64px)" }}>
      {/* Left column: mode & forms */}
      <div style={{ borderRight: "1px solid #eee", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>Aadee Portal</h3>
          <button onClick={logout} style={{ padding: "6px 10px", borderRadius: 8 }}>Logout</button>
        </div>
        <div style={{ marginTop: 12, color: "#666" }}>Signed in as <b>{user?.username || "user"}</b></div>

        <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
          <button onClick={() => setMode("king")} style={tabBtn(mode === "king")}>🏁 King AI</button>
          <button onClick={() => setMode("social")} style={tabBtn(mode === "social")}>📣 Social Manager</button>
          <button onClick={() => setMode("tools")} style={tabBtn(mode === "tools")}>🎨 Brand Tools</button>
        </div>

        <div style={{ marginTop: 18 }}>
          {mode === "king" && <PortalKingAI />}
          {mode === "social" && <PortalSocial />}
          {mode === "tools" && <PortalTools />}
        </div>
      </div>

      {/* Right column: Chat */}
      <div style={{ display: "grid", gridTemplateRows: "1fr auto", height: "calc(100vh - 64px)" }}>
        <div ref={scroller} style={{ padding: 16, overflowY: "auto" }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ marginBottom: 12, display: "flex" }}>
              <div style={{
                marginLeft: m.role === "assistant" ? 0 : "auto",
                background: m.role === "assistant" ? "#f3f4f6" : "#111827",
                color: m.role === "assistant" ? "#111827" : "white",
                padding: "10px 14px",
                borderRadius: 12,
                maxWidth: "70%",
                whiteSpace: "pre-wrap"
              }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: 16, borderTop: "1px solid #eee", display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "king"
                ? 'e.g., "Change my business time to closed on Sunday"'
                : mode === "social"
                ? 'e.g., "Grand opening for our bakery"'
                : 'e.g., "cozy cafe sustainable beans"'
            }
            onKeyDown={(e) => e.key === "Enter" && send()}
            style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
          />
          <button onClick={send} style={{ padding: "10px 14px", borderRadius: 10 }}>Send</button>
        </div>
      </div>
    </div>
  );
}

function tabBtn(active) {
  return {
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #eee",
    background: active ? "#111827" : "white",
    color: active ? "white" : "#111827",
    cursor: "pointer"
  };
}
