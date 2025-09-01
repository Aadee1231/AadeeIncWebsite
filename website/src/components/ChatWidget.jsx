import { useEffect, useMemo, useRef, useState } from "react";
import Lottie from "lottie-react";
import botAnim from "../assets/bot.json";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [email, setEmail] = useState("");
  const inputRef = useRef(null);

  const backend = import.meta.env.VITE_PUBLIC_BACKEND_URL;
  const sessionId = useMemo(() => {
    const existing = localStorage.getItem("aadee_session_id");
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem("aadee_session_id", id);
    return id;
  }, []);

  async function send(e) {
    e.preventDefault();
    const text = inputRef.current.value.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    inputRef.current.value = "";

    const res = await fetch(`${backend}/api/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, text, email: email || null }),
    });
    const data = await res.json();
    setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
  }

  async function book(startIso) {
    if (!email) {
      setMessages((m) => [...m, { role: "assistant", content: "Please provide your email first so I can send the invite." }]);
      return;
    }
    const res = await fetch(`${backend}/api/chat/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, start_iso: startIso, email }),
    });
    const data = await res.json();
    setMessages((m) => [...m, { role: "assistant", content: `Booked! Calendar link: ${data.htmlLink}` }]);
  }

  // styles
  const fab = {
    position: "fixed", right: 16, bottom: 16, width: 68, height: 68,
    borderRadius: "9999px", background: "#111", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 12px 32px rgba(0,0,0,.3)", cursor: "pointer", zIndex: 2147483647
  };
  const slide = {
    position: "fixed", right: 0, top: 0, height: "100vh", width: "min(420px,100vw)",
    background: "#fff", borderLeft: "1px solid #eee", boxShadow: "-12px 0 32px rgba(0,0,0,.15)",
    display: "flex", flexDirection: "column", zIndex: 2147483647
  };

  // detect booking command "book 2025-09-01T15:00:00Z"
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "user") return;
    const m = last.content.trim();
    if (m.toLowerCase().startsWith("book ")) {
      const when = m.slice(5).trim();
      book(when);
    }
  }, [messages]);

  return (
    <>
      <button style={fab} onClick={() => setOpen(v => !v)} aria-label="Open chat">
        <Lottie animationData={botAnim} loop autoPlay style={{ width: 44, height: 44 }} />
      </button>

      {open && (
        <div style={slide}>
          <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", gap: 8, alignItems: "center" }}>
            <Lottie animationData={botAnim} loop autoPlay style={{ width: 28, height: 28 }} />
            <div style={{ fontWeight: 700 }}>Aadee Assistant</div>
            <div style={{ marginLeft: "auto", opacity: .6, fontSize: 12 }}>{import.meta.env.VITE_PUBLIC_COMPANY_NAME}</div>
          </div>

          <div style={{ padding: 12, borderBottom: "1px solid #f2f2f2", display: "flex", gap: 8 }}>
            <input
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="Your email for confirmations"
              style={{ flex: 1, border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px" }}
            />
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {messages.length === 0 && (
              <div style={{ opacity: .65, fontSize: 14 }}>
                Ask about services, pricing, or type <code>book 2025-09-01T15:00:00Z</code> to schedule (UTC).
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ textAlign: m.role === "user" ? "right" : "left", margin: "8px 0" }}>
                <span style={{
                  display: "inline-block", padding: "8px 12px", borderRadius: 16,
                  maxWidth: "80%", background: m.role === "user" ? "#111" : "#f2f2f2",
                  color: m.role === "user" ? "#fff" : "#111", wordBreak: "break-word"
                }}>
                  {m.content}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={send} style={{ padding: 10, borderTop: "1px solid #eee", display: "flex", gap: 8 }}>
            <input ref={inputRef} placeholder="Type a message…" style={{ flex: 1, border: "1px solid #ddd", borderRadius: 999, padding: "10px 14px" }} />
            <button style={{ background: "#111", color: "#fff", border: "none", borderRadius: 999, padding: "10px 16px", cursor: "pointer" }}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
