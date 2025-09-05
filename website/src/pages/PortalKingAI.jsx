import { useState } from "react";
import { useAuth } from "../components/AuthProvider";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function PortalKingAI() {
  const { session } = useAuth();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState("");
  const [log, setLog] = useState([]);

  async function send() {
    const res = await fetch(`${API_BASE}/api/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ session_id: sessionId, text: input, agent: "king_ai" }),
    });
    const data = await res.json();
    setLog((l) => [...l, { role: "user", text: input }, { role: "assistant", text: data.reply }]);
    setInput("");
  }

  return (
    <div>
      <h2>Aadee Chat (King AI)</h2>
      <div className="chat">
        {log.map((m,i)=><div key={i}><b>{m.role}:</b> {m.text}</div>)}
      </div>
      <input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Ask me something..." />
      <button onClick={send}>Send</button>
    </div>
  );
}
