import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function PortalAdmin() {
  const { session } = useAuth();
  const [orgId] = useState("demo-org"); // replace with the user’s actual org selection later
  const [rows, setRows] = useState([]);

  async function load() {
    const res = await fetch(`${API_BASE}/api/actions?org_id=${orgId}&status=pending`, {
      headers: { "Authorization": `Bearer ${session?.access_token}` }
    });
    const data = await res.json();
    setRows(data.actions || []);
  }

  async function approve(action_id, approve) {
    await fetch(`${API_BASE}/api/actions/approve`, {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        "Authorization": `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ action_id, approve, note: approve ? "Looks good" : "Not right now" })
    });
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2>Operator Dashboard</h2>
      {!rows.length && <p>No pending actions.</p>}
      {rows.map(a => (
        <div key={a.id} className="card" style={{textAlign:"left"}}>
          <div><b>Type:</b> {a.type}</div>
          <div><b>Params:</b> <pre>{JSON.stringify(a.params, null, 2)}</pre></div>
          <button onClick={()=>approve(a.id, true)}>Approve</button>
          <button onClick={()=>approve(a.id, false)}>Reject</button>
        </div>
      ))}
    </div>
  );
}
