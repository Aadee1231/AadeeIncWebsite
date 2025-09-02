// website/src/components/ChatWidget.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import Lottie from "lottie-react";
import botAnim from "../assets/bot.json";

const fmtLocal = (iso) =>
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
  const [slotsByDay, setSlotsByDay] = useState({});
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [askingEmailFor, setAskingEmailFor] = useState(null); // iso we're booking for
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

  useEffect(() => {
    if (open) {
      setMessages([{ role: "assistant", content: "Hi! How can I help you?" }]);
    }
  }, [open]);

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
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "Thanks!" }]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { role: "assistant", content: "Hmm, I couldn’t reach the server. Try again." }]);
    }
  }

  async function loadAvailability() {
    setLoadingAvail(true);
    setSlotsByDay({});
    try {
      const res = await fetch(`${backend}/api/chat/availability?days=14`);
      const data = await res.json();
      const grouped = data.grouped || {};
      setSlotsByDay(grouped);
      if (Object.keys(grouped).length === 0) {
        setMessages((m) => [...m, { role: "assistant", content: "I didn’t find open times—try again shortly." }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: "Select a time that works for you:" }]);
      }
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "assistant", content: "Couldn’t load availability right now." }]);
    } finally {
      setLoadingAvail(false);
    }
  }

  function askEmail(iso) {
    setAskingEmailFor(iso);
    setMessages((m) => [
      ...m,
      { role: "assistant", content: `Great—I'll book ${fmtLocal(iso)}. What email should I send the invite to?` },
    ]);
  }

  async function confirmBooking(e) {
    e.preventDefault();
    if (!isEmail(email)) {
      setMessages((m) => [...m, { role: "assistant", content: "Please enter a valid email." }]);
      return;
    }
    try {
      const res = await fetch(`${backend}/api/chat/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, start_iso: askingEmailFor, email }),
      });
      const data = await res.json();
      if (data?.htmlLink) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `✅ Booked ${fmtLocal(askingEmailFor)}. Invite sent to ${email}.\nEvent: ${data.htmlLink}` },
        ]);
        setSlotsByDay({});
        setAskingEmailFor(null);
        setEmail("");
      } else {
        setMessages((m) => [...m, { role: "assistant", content: "Booking failed. Please try again." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { role: "assistant", content: "Booking request failed. Please try again." }]);
    }
  }

  /* Styles */
  const fabWrap = { position: "fixed", right: 20, bottom: 20, width: 84, height: 84, zIndex: 2147483647 };
  const ring = {
    position: "absolute", inset: -8, borderRadius: 9999,
    background: "radial-gradient(closest-side, rgba(14,165,233,.35), transparent 70%)",
    animation: "pulse 2s infinite", pointerEvents: "none",
  };
  const fab = {
    position: "absolute", inset: 0, borderRadius: 9999,
    background: "linear-gradient(135deg,#0ea5e9,#6366f1)", border: "none",
    boxShadow: "0 18px 46px rgba(0,0,0,.35)",
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
  };
  const slide = {
    position: "fixed", right: 0, top: 0, height: "100vh", width: "min(440px, 100vw)",
    background: "#fff", borderLeft: "1px solid #eaeaea",
    boxShadow: "-18px 0 40px rgba(0,0,0,.15)", display: "flex", flexDirection: "column", zIndex: 2147483647,
  };
  const chip = {
    display: "inline-block", padding: "8px 12px", borderRadius: 999,
    border: "1px solid #ddd", background: "#f9fafb", cursor: "pointer", margin: "6px",
  };

  return (
    <>
      {/* Floating button */}
      <div style={fabWrap}>
        <div style={ring} />
        <button aria-label="Open chat" onClick={() => setOpen(true)} style={fab} title="Chat with us">
          <Lottie animationData={botAnim} loop autoPlay style={{ width: 52, height: 52 }} />
        </button>
      </div>

      {/* Slide-over */}
      {open && (
        <div style={slide}>
          {/* Header */}
          <div style={{ padding: 14, borderBottom: "1px solid #eee", display: "flex", gap: 10, alignItems: "center" }}>
            <Lottie animationData={botAnim} loop autoPlay style={{ width: 28, height: 28 }} />
            <div style={{ fontWeight: 800, fontSize: 16 }}>Aadee Assistant</div>
            <div style={{ marginLeft: "auto" }}>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
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

            {/* Grouped slots */}
            {Object.keys(slotsByDay).length > 0 && (
              <div style={{ marginTop: 12 }}>
                {Object.entries(slotsByDay).map(([day, list]) => (
                  <div key={day} style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, margin: "8px 0" }}>
                      {new Date(day + "T00:00:00Z").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                    </div>
                    {list.map((iso) => (
                      <button key={iso} style={chip} onClick={() => askEmail(iso)}>{fmtLocal(iso)}</button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Composer + actions */}
          <div style={{ padding: 12, borderTop: "1px solid #eee" }}>
            {/* If we’re asking for email, show a one-time inline prompt */}
            {askingEmailFor && (
              <form onSubmit={confirmBooking} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`Your email to confirm ${fmtLocal(askingEmailFor)}`}
                  style={{ flex: 1, border: "1px solid #ddd", borderRadius: 8, padding: "10px 12px" }}
                />
                <button
                  style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer" }}
                >
                  Confirm
                </button>
              </form>
            )}

            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button
                onClick={loadAvailability}
                disabled={loadingAvail}
                style={{ border: "1px solid #ddd", background: "#fff", borderRadius: 999, padding: "10px 14px", cursor: "pointer" }}
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

      {/* keyframes for the ring */}
      <style>{`
        @keyframes pulse { 0% { transform: scale(.96); opacity: .7; } 50% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(.96); opacity: .7; } }
      `}</style>
    </>
  );
}
