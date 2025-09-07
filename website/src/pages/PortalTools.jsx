// src/PortalTools.jsx
import { useState } from "react";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function PortalTools() {
  const [keywords, setKeywords] = useState("cafe, roasted beans, cozy");
  const [initials, setInitials] = useState("AC");
  const [names, setNames] = useState([]);
  const [svg, setSvg] = useState(null);
  const [err, setErr] = useState("");

  const generate = async () => {
    setErr("");
    setNames([]); setSvg(null);
    try {
      const res = await fetch(`${API_BASE}/actions/brand/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("aa_token")}`
        },
        body: JSON.stringify({
          keywords: keywords.split(",").map(s => s.trim()).filter(Boolean),
          tone: "modern",
          initials: initials.trim() || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error");
      setNames(data.names || []);
      setSvg(data.svg_logo || null);
    } catch (e) {
      setErr("Brand generation failed.");
    }
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <h4>🎨 Brand Tools — Name & Simple Logo</h4>
      <label>
        Keywords (comma-separated)
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)}
               style={{ width: "100%", padding: 8, marginTop: 4 }} />
      </label>
      <label>
        Monogram initials (for demo SVG logo)
        <input value={initials} onChange={(e) => setInitials(e.target.value)}
               style={{ width: "100%", padding: 8, marginTop: 4 }} />
      </label>
      <button onClick={generate} style={{ padding: "8px 12px", borderRadius: 8 }}>Generate</button>
      {err && <div style={{ color: "crimson" }}>{err}</div>}
      {names.length > 0 && (
        <div>
          <b>Name ideas:</b>
          <ul>
            {names.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}
      {svg && (
        <div>
          <b>Logo (SVG demo):</b>
          <div
            style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden", width: 256, height: 256 }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      )}
    </div>
  );
}
