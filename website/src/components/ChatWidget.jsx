import { useState, useRef, useEffect } from "react";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);

  // Works even if you haven't set the env on Vercel yet
  const backend = import.meta.env.VITE_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
  const sessionId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : "demo-session";

  useEffect(() => {
    // Confirm it mounted in Production
    console.log("ChatWidget mounted. Backend =", backend);
  }, []);

  async function send(e) {
    e.preventDefault();
    const text = inputRef.current.value.trim();
    if (!text) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    inputRef.current.value = "";

    try {
      const res = await fetch(`${backend}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, text }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "Thanks! (No reply body)" }]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { role: "assistant", content: "I couldn’t reach the server yet. Try again soon!" }]);
    }
  }

  // Inline styles to avoid any site CSS conflicts
  const btnStyle = {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    width: "64px",
    height: "64px",
    borderRadius: "9999px",
    background: "#111",
    color: "#fff",
    border: "none",
    boxShadow: "0 8px 24px rgba(0,0,0,.25)",
    cursor: "pointer",
    zIndex: 2147483647, // max
  };

  const panelStyle = {
    position: "fixed",
    right: "16px",
    bottom: "96px",
    width: "360px",
    height: "520px",
    background: "#fff",
    border: "1px solid rgba(0,0,0,.1)",
    borderRadius: "16px",
    boxShadow: "0 16px 48px rgba(0,0,0,.2)",
    display: "flex",
    flexDirection: "column",
    zIndex: 2147483647,
    overflow: "hidden",
  };

  return (
    <>
      <button aria-label="Open chat" onClick={() => setOpen((v) => !v)} style={btnStyle}>
        Chat
      </button>

      {open && (
        <div style={panelStyle}>
          <div style={{ padding: 12, borderBottom: "1px solid #eee", fontWeight: 600 }}>
            Aadee Assistant
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {messages.length === 0 && (
              <div style={{ opacity: 0.6, fontSize: 14 }}>
                Hi! Ask me about services or book a consult.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ textAlign: m.role === "user" ? "right" : "left", margin: "8px 0" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "8px 12px",
                    borderRadius: 16,
                    maxWidth: "80%",
                    background: m.role === "user" ? "#111" : "#f2f2f2",
                    color: m.role === "user" ? "#fff" : "#111",
                    wordBreak: "break-word",
                  }}
                >
                  {m.content}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={send} style={{ padding: 8, borderTop: "1px solid #eee", display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              placeholder="Type a message…"
              style={{ flex: 1, border: "1px solid #ddd", borderRadius: 999, padding: "10px 14px" }}
            />
            <button
              style={{
                background: "#111",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "10px 14px",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
