// src/PortalSocial.jsx
import { useState } from "react";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function PortalSocial() {
  const [topic, setTopic] = useState("");
  const [ideas, setIdeas] = useState([]);
  const [err, setErr] = useState("");

  const getIdeas = async () => {
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/actions/social/instagram/ideas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("aa_token")}`
        },
        body: JSON.stringify({ topic, count: 3 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error");
      setIdeas(data.ideas);
    } catch (e) {
      setErr("Could not fetch ideas.");
    }
  };

  const approve = async (id) => {
    try {
      await fetch(`${API_BASE}/actions/social/instagram/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("aa_token")}`
        },
        body: JSON.stringify({ idea_id: id, platform: "instagram" }),
      });
      alert("Approved (stub). In Part 2 this will post via Instagram Graph API.");
    } catch {
      alert("Failed to approve.");
    }
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <h4>📣 Social Media Manager — Instagram</h4>
      <label>
        Topic / prompt
        <input value={topic} onChange={(e) => setTopic(e.target.value)}
               placeholder="Grand opening of Aadee Bakery"
               style={{ width: "100%", padding: 8, marginTop: 4 }} />
      </label>
      <button onClick={getIdeas} style={{ padding: "8px 12px", borderRadius: 8 }}>Generate 3 Ideas</button>
      {err && <div style={{ color: "crimson" }}>{err}</div>}
      <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
        {ideas.map((i) => (
          <div key={i.id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
            <div style={{ fontWeight: 600 }}>{i.headline}</div>
            <div style={{ color: "#444", whiteSpace: "pre-wrap" }}>{i.caption}</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              (Image prompt idea: {i.image_prompt})
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button onClick={() => approve(i.id)} style={{ padding: "6px 10px", borderRadius: 8 }}>Approve & Post</button>
              <button style={{ padding: "6px 10px", borderRadius: 8, border: "1px dashed #bbb", background: "#fff" }}>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
