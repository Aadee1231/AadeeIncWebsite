// src/PortalKingAI.jsx
import { useState } from "react";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function PortalKingAI() {
  const [businessName, setBusinessName] = useState("");
  const [weekday, setWeekday] = useState("sunday");
  const [date, setDate] = useState(""); // optional specific date
  const [closed, setClosed] = useState(true);
  const [providers, setProviders] = useState(["google", "yelp"]);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const toggleProvider = (p) => {
    setProviders((cur) =>
      cur.includes(p) ? cur.filter(x => x !== p) : [...cur, p]
    );
  };
  const submit = async () => {
    setErr(""); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/actions/listings/update-hours`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("aa_token")}`
        },
        body: JSON.stringify({ business_name: businessName, weekday, date: date || null, closed, providers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error");
      setResult(data);
    } catch (e) {
      setErr("Failed to prepare hours update (stub).");
    }
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <h4>🏁 King AI — Change Hours</h4>
      <label>
        Business name
        <input value={businessName} onChange={(e) => setBusinessName(e.target.value)}
               style={{ width: "100%", padding: 8, marginTop: 4 }} />
      </label>
      <label>
        Weekday (optional if setting specific date)
        <select value={weekday} onChange={(e) => setWeekday(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4 }}>
          {["sunday","monday","tuesday","wednesday","thursday","friday","saturday"].map(w => <option key={w}>{w}</option>)}
        </select>
      </label>
      <label>
        Specific date (YYYY-MM-DD, optional)
        <input value={date} onChange={(e) => setDate(e.target.value)}
               placeholder="2025-09-14" style={{ width: "100%", padding: 8, marginTop: 4 }} />
      </label>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" checked={closed} onChange={(e) => setClosed(e.target.checked)} />
        Closed
      </label>
      <div>
        Providers:
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          {["google","yelp"].map(p => (
            <button key={p} onClick={() => toggleProvider(p)}
              style={{
                padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd",
                background: providers.includes(p) ? "#111827" : "white",
                color: providers.includes(p) ? "white" : "#111827"
              }}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <button onClick={submit} style={{ padding: "8px 12px", borderRadius: 8 }}>Generate Plan</button>
      {err && <div style={{ color: "crimson" }}>{err}</div>}
      {result && (
        <div style={{ marginTop: 8, padding: 10, border: "1px solid #eee", borderRadius: 8, background: "#f9fafb" }}>
          <b>Plan (stub):</b>
          <ul>
            {result.plan.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

