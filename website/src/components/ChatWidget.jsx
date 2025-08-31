import { useState, useRef } from "react";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);
  const backend = import.meta.env.VITE_PUBLIC_BACKEND_URL;
  const sessionId = "00000000-0000-0000-0000-000000000001"; // replace with a real uuid later

  async function send(e) {
    e.preventDefault();
    const text = inputRef.current.value.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    inputRef.current.value = "";

    const res = await fetch(`${backend}/api/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, text }),
    });
    const data = await res.json();
    setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 p-4 bg-black text-white rounded-full"
      >
        Chat
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 w-80 h-96 bg-white border shadow-lg flex flex-col">
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block px-3 py-2 rounded-2xl ${
                    m.role === "user" ? "bg-black text-white" : "bg-gray-200"
                  }`}
                >
                  {m.content}
                </span>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="p-2 border-t flex gap-2">
            <input ref={inputRef} className="flex-1 border p-2 rounded" placeholder="Type…" />
            <button className="px-3 py-2 bg-black text-white rounded">Send</button>
          </form>
        </div>
      )}
    </>
  );
}
