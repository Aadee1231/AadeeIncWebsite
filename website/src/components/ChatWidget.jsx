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

// Simple state machine for scheduling
const FLOW = {
  IDLE: "IDLE",
  ASK_PURPOSE: "ASK_PURPOSE",
  CHOOSING_TIME: "CHOOSING_TIME",
  ASK_EMAIL: "ASK_EMAIL",
  ASK_NAME: "ASK_NAME",
  ASK_PHONE: "ASK_PHONE",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [flow, setFlow] = useState(FLOW.IDLE);
  const [slotsByDay, setSlotsByDay] = useState({});
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [pendingISO, setPendingISO] = useState(null);
  const [details, setDetails] = useState({ purpose: "", email: "", name: "", phone: "" });
  const inputRef = useRef(null);

  const backend = import.meta.env.VITE_PUBLIC_BACKEND_URL;
  const sessionId = useMemo(() => {
    const existing = localStorage.getItem("aadee_session_id");
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem("aadee_session_id", id);
    return id;
  }, []);

  // Visible header color fix
  const brandTitleColor = "#111";       // black
  const dateHeaderColor = "#ef4444";    // red-500

  useEffect(() => {
    if (open) {
      setMessages([{ role: "assistant", content: "Hi! How can I help you?" }]);
      setFlow(FLOW.IDLE);
      setSlotsByDay({});
      setPendingISO(null);
      setDetails({ purpose: "", email: "", name: "", phone: "" });
    }
  }, [open]);

  async function fetchAvailability() {
    setLoadingAvail(true);
    setSlotsByDay({});
    try {
      const res = await fetch(`${backend}/api/chat/availability?days=14`);
      const data = await res.json();
      const grouped = data.grouped || {};
      // grouped only contains days with slots; no “yesterday” noise
      setSlotsByDay(grouped);
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "assistant", content: "Couldn’t load availability right now." }]);
    } finally {
      setLoadingAvail(false);
    }
  }

  function startScheduling() {
    setFlow(FLOW.ASK_PURPOSE);
    setMessages((m) => [...m, { role: "assistant", content: "Great—what is the meeting about?" }]);
  }

  function chooseTime(iso) {
    setPendingISO(iso);
    setFlow(FLOW.ASK_EMAIL);
    setMessages((m) => [
      ...m,
      { role: "assistant", content: `Nice. I’ll hold ${fmtLocal(iso)}. What email should I send the invite to?` },
    ]);
  }

  async function finalizeBooking() {
    // call /book with purpose, name, phone, email
    const payload = {
      session_id: sessionId,
      start_iso: pendingISO,
      email: details.email,
      name: details.name || null,
      phone: details.phone || null,
      purpose: details.purpose || null,
    };
    try {
      const res = await fetch(`${backend}/api/chat/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data?.htmlLink) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `✅ Booked ${fmtLocal(pendingISO)}. Invite sent to ${details.email}.\nEvent: ${data.htmlLink}` },
        ]);
        // refresh availability so that slot disappears
        await fetchAvailability();
        // reset flow
        setFlow(FLOW.IDLE);
        setPendingISO(null);
        setDetails({ purpose: "", email: "", name: "", phone: "" });
      } else {
        setMessages((m) => [...m, { role: "assistant", content: "Booking failed. Please try another time." }]);
        setFlow(FLOW.CHOOSING_TIME);
      }
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "assistant", content: "Booking error. Please try again." }]);
      setFlow(FLOW.CHOOSING_TIME);
    }
  }

  async function onSend(e) {
    e.preventDefault();
    const text = (inputRef.current?.value || "").trim();
    if (!text) return;

    // Always echo the user message
    setMessages((m) => [...m, { role: "user", content: text }]);
    inputRef.current.value = "";

    // Route based on flow
    if (flow === FLOW.ASK_PURPOSE) {
      setDetails((d) => ({ ...d, purpose: text }));
      setFlow(FLOW.CHOOSING_TIME);
      await fetchAvailability();
      setMessages((m) => [...m, { role: "assistant", content: "Select a time that works for you:" }]);
      return;
    }

    if (flow === FLOW.ASK_EMAIL) {
      if (!isEmail(text)) {
        setMessages((m) => [...m, { role: "assistant", content: "Please enter a valid email address." }]);
        return;
      }
      setDetails((d) => ({ ...d, email: text }));
      setFlow(FLOW.ASK_NAME);
      setMessages((m) => [...m, { role: "assistant", content: "Got it. What name should I put on the invite?" }]);
      return;
    }

    if (flow === FLOW.ASK_NAME) {
      setDetails((d) => ({ ...d, name: text }));
      setFlow(FLOW.ASK_PHONE);
      setMessages((m) => [...m, { role: "assistant", content: "And what phone number should I include? (optional)" }]);
      return;
    }

    if (flow === FLOW.ASK_PHONE) {
      setDetails((d) => ({ ...d, phone: text }));
      await finalizeBooking();
      return;
    }

    // Default: normal Q&A
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

  /* —— UI —— */

  // FAB styles (bigger + visible)
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
          {/* Header (explicit, visible color) */}
          <div style={{ padding: 14, borderBottom: "1px solid #eee", display: "flex", gap: 10, alignItems: "center" }}>
            <Lottie animationData={botAnim} loop autoPlay style={{ width: 28, height: 28 }} />
            <div style={{ fontWeight: 800, fontSize: 16, color: brandTitleColor }}>Aadee Assistant</div>
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

            {/* Grouped slot chips (date headers clearly colored) */}
            {Object.keys(slotsByDay).length > 0 && (
              <div style={{ marginTop: 12 }}>
                {Object.entries(slotsByDay).map(([day, list]) => (
                  <div key={day} style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, margin: "8px 0", color: dateHeaderColor }}>
                      {new Date(day + "T00:00:00Z").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                    </div>
                    {list.map((iso) => (
                      <button key={iso} style={chip} onClick={() => chooseTime(iso)}>{fmtLocal(iso)}</button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Composer + actions */}
          <div style={{ padding: 12, borderTop: "1px solid #eee" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button
                onClick={startScheduling}
                disabled={loadingAvail}
                style={{ border: "1px solid #ddd", background: "#fff", borderRadius: 999, padding: "10px 14px", cursor: "pointer" }}
              >
                📅 Schedule a meeting
              </button>
            </div>

            <form onSubmit={onSend} style={{ display: "flex", gap: 8 }}>
              <input
                ref={inputRef}
                placeholder={
                  flow === FLOW.ASK_PURPOSE ? "Briefly describe the purpose…" :
                  flow === FLOW.ASK_EMAIL   ? "Your email for the invite…" :
                  flow === FLOW.ASK_NAME    ? "Your name for the invite…" :
                  flow === FLOW.ASK_PHONE   ? "Your phone (optional)…" :
                  "Type a message…"
                }
                style={{ flex: 1, border: "1px solid #ddd", borderRadius: 999, padding: "10px 14px" }}
              />
              <button style={{ background: "#111", color: "#fff", border: "none", borderRadius: 999, padding: "10px 16px", cursor: "pointer" }}>
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* keyframes for the ring */}
      <style>{`@keyframes pulse{0%{transform:scale(.96);opacity:.7}50%{transform:scale(1.06);opacity:1}100%{transform:scale(.96);opacity:.7}}`}</style>
    </>
  );
}
