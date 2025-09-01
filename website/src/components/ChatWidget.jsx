import { useEffect, useMemo, useRef, useState } from "react";
import Lottie from "lottie-react";
import botAnim from "../assets/bot.json";

/** Helpers */
const fmt = (iso) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [email, setEmail] = useState("");
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [slots, setSlots] = useState([]); // ISO strings
  const inputRef = useRef(null);

  const backend = import.meta.env.VITE_PUBLIC_BACKEND_URL;
  const sessionId = useMemo(() => {
    const existing = localStorage.getItem("aadee_session_id");
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem("aadee_session_id", id);
    return id;
  }, []);

  useEffect(() => {
    console.log("ChatWidget mounted – backend:", backend);
  }, [backend]);

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
        body: JSON.stringify({ session_id: sessionId, text, email: email || null }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "Thanks!" }]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { role: "assistant", content: "Hmm, I couldn’t reach the server. Try again." }]);
    }
  }

  async function loadAvailability() {
    setLoadingAvail(true);
    setSlots([]);
    try {
      const res = await fetch(`${backend}/api/chat/availability?days=14`);
      const data = await res.json();
      setSlots(data.slots || []);
      if (!data.slots?.length) {
        setMessages((m) => [...m, { role: "assistant", content: "No open times in the next two weeks." }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: "Pick a time from the list below." }]);
      }
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "assistant", content: "Couldn’t load availability right now." }]);
    } finally {
      setLoadingAvail(false);
    }
  }

  async function bookSlot(iso) {
    if (!isEmail(email)) {
      setMessages((m) => [...m, { role: "assistant", content: "Add a valid email first so I can send the invite." }]);
      return;
    }
    try {
      const res = await fetch(`${backend}/api/chat/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, start_iso: iso, email }),
      });
      const data = await res.json();
      if (data?.htmlLink) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `✅ Booked ${fmt(iso)}. Invite sent to ${email}. ` + (data.htmlLink ? `\nEvent: ${data.htmlLink}` : "") },
        ]);
        setSlots([]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: "Booking failed. Please try another time." }]);
      }
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "assistant", content: "Booking request failed. Please try again." }]);
    }
  }

  /* Styles */
  const fabWrap = {
    position: "fixed",
    right: 18,
    bottom: 18,
    width: 84,
    height: 84,
    zIndex: 2147483647,
  };
  const ring = {
    position: "absolute",
    inset: -6,
    borderRadius: 9999,
    background: "radial-gradient(closest-side, rgba(0, 190, 255, .35), transparent 70%)",
    animation: "pulse 2s infinite",
    pointerEvents: "none",
  };
  const fab = {
    position: "absolute",
    inset: 0,
    borderRadius: 9999,
    background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
    border: "none",
    boxShadow: "0 16px 40px rgba(0,0,0,.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
  const slide = {
    position: "fixed",
    right: 0,
    top: 0,
    height: "100vh",
    width: "min(420px, 100vw)",
    background: "#fff",
    borderLeft: "1px solid #eaeaea",
    boxShadow: "-16px 0 32px rgba(0,0,0,.15)",
    display: "flex",
    flexDirection: "column",
    zIndex: 2147483647,
  };
  const chip = {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid #ddd",
    background: "#f9fafb",
    cursor: "pointer",
    margin: "6px",
  };

  return (
    <>
      {/* Floating button */}
      <div style={fabWrap}>
        <div style={ring} />
        <button
          aria-label="Open chat"
          onClick={() => setOpen(true)}
          style={fab}
          title="Chat with us"
        >
          <Lottie animationData={botAnim} loop autoPlay style={{ width: 44, height: 44 }} />
        </button>
      </div>

      {/* Slide-over panel */}
      {open && (
        <div style={slide}>
          {/* Header */}
          <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", gap: 10, alignItems: "center" }}>
            <Lottie animationData={botAnim} loop autoPlay style={{ width: 26, height: 26 }} />
            <div style={{ fontWeight: 700 }}>Aadee Assistant</div>
            <div style={{ marginLeft: "auto" }}>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                style={{
                  width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb",
                  background: "#fff", cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Email capture */}
          <div style={{ padding: 12, borderBottom: "1px solid #f2f2f2", display: "flex", gap: 8 }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email for confirmations"
              style={{ flex: 1, border: "1px solid #ddd", borderRadius: 8, padding: "10px 12px" }}
            />
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {messages.length === 0 && (
              <div style={{ opacity: 0.65, fontSize: 14 }}>
                Hi! Ask about our services, or click <b>Schedule a meeting</b> below to see available times.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ textAlign: m.role === "user" ? "right" : "left", margin: "8px 0" }}>
                <span style={{
                  display: "inline-block", padding: "10px 12px", borderRadius: 16, maxWidth: "80%",
                  background: m.role === "user" ? "linear-gradient(135deg,#0ea5e9,#6366f1)" : "#f3f4f6",
                  color: m.role === "user" ? "#fff" : "#111", whiteSpace: "pre-wrap", wordBreak: "break-word"
                }}>
                  {m.content}
                </span>
              </div>
            ))}

            {/* Slot chips */}
            {Boolean(slots?.length) && (
              <div style={{ marginTop: 12 }}>
                {slots.slice(0, 24).map((iso) => (
                  <button key={iso} style={chip} onClick={() => bookSlot(iso)}>{fmt(iso)}</button>
                ))}
                {slots.length > 24 && <div style={{ opacity: .6, marginTop: 6 }}>Showing first 24 options.</div>}
              </div>
            )}
          </div>

          {/* Composer */}
          <div style={{ padding: 10, borderTop: "1px solid #eee" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button
                onClick={loadAvailability}
                disabled={loadingAvail}
                style={{
                  border: "1px solid #ddd", background: "#fff", borderRadius: 999,
                  padding: "10px 14px", cursor: "pointer"
                }}
              >
                {loadingAvail ? "Loading…" : "📅 Schedule a meeting"}
              </button>
            </div>
            <form onSubmit={send} style={{ display: "flex", gap: 8 }}>
              <input
                ref={inputRef}
                placeholder="Type a message…"
                style={{ flex: 1, border: "1px solid #ddd", borderRadius: 999, padding: "10px 14px" }}
              />
              <button
                style={{ background: "#111", color: "#fff", border: "none", borderRadius: 999, padding: "10px 16px", cursor: "pointer" }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* tiny keyframes */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(.95); opacity: .7; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(.95); opacity: .7; }
        }
      `}</style>
    </>
  );
}
