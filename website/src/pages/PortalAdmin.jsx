// website/src/pages/PortalAdmin.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function PortalAdmin() {
  const { session } = useAuth();
  const [orgId] = useState("demo-org"); // TODO: replace with user’s actual org
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const authedHeaders = {
    "Content-Type": "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/actions?org_id=${encodeURIComponent(orgId)}&status=pending`, {
        headers: authedHeaders,
      });
      const data = await res.json();
      setRows(data.actions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function approve(action_id, approve) {
    await fetch(`${API_BASE}/api/actions/approve`, {
      method: "POST",
      headers: authedHeaders,
      body: JSON.stringify({ action_id, approve, note: approve ? "Looks good" : "Not right now" }),
    });
    load();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 12px" }}>
      <h2>Operator Dashboard</h2>
      {loading && <p>Loading…</p>}
      {!loading && !rows.length && <p>No pending actions.</p>}

      {rows.map((a) => (
        <div
          key={a.id}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 12,
            margin: "12px 0",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div><b>Type:</b> {a.type}</div>
            <div><b>Status:</b> {a.status}</div>
            <div><b>Created:</b> {new Date(a.created_at).toLocaleString()}</div>
          </div>
          <div style={{ marginTop: 8 }}>
            <b>Params:</b>
            <pre style={{ background: "#f9fafb", padding: 8, borderRadius: 6, overflowX: "auto" }}>
              {JSON.stringify(a.params, null, 2)}
            </pre>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => approve(a.id, true)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #10b981", background: "#10b981", color: "white" }}
            >
              Approve
            </button>
            <button
              onClick={() => approve(a.id, false)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ef4444", background: "#ef4444", color: "white" }}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}