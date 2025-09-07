
// website/src/pages/PortalKingAI.jsx
import { useState } from "react";
import { useAuth } from "../components/AuthProvider";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function PortalKingAI() {
  const { session } = useAuth();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [orgId] = useState("demo-org"); // TODO: replace with real org selection later
  const [input, setInput] = useState("");
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const authedHeaders = {
    "Content-Type": "application/json",
    // If your backend enforces Supabase JWT verification, pass it:
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };

  async function send() {
    if (!input.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat/message`, {
        method: "POST",
        headers: authedHeaders,
        body: JSON.stringify({
          session_id: sessionId,
          text: input,
          agent: "king_ai",
          org_id: orgId,
        }),
      });
      const data = await res.json();
      setLog((l) => [
        ...l,
        { role: "user", text: input },
        { role: "assistant", text: data.reply || "(no reply)" },
      ]);
      setInput("");
    } catch (e) {
      setLog((l) => [...l, { role: "assistant", text: `Error: ${String(e)}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "24px auto", padding: "0 12px" }}>
      <h2>AadeeChat (King AI)</h2>
      <p style={{ color: "#555" }}>
        Try: <code>Update Friday to 9-3 and Sunday closed</code>
      </p>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, minHeight: 180, marginBottom: 12 }}>
        {log.length === 0 && <div style={{ color: "#888" }}>Start a conversation…</div>}
        {log.map((m, i) => (
          <div key={i} style={{ margin: "6px 0", whiteSpace: "pre-wrap" }}>
            <strong style={{ textTransform: "capitalize" }}>{m.role}:</strong> {m.text}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask me something…"
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={busy}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #111827",
            background: busy ? "#9ca3af" : "#111827",
            color: "white",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}

