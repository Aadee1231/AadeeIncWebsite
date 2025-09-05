// website/src/pages/PortalAdmin.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function PortalAdmin() {
  const { session } = useAuth();
  const [orgId] = useState("demo-org"); // TODO: replace with user's actual org
  const [activeTab, setActiveTab] = useState("actions");
  const [actions, setActions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  const authedHeaders = {
    "Content-Type": "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };

  async function loadActions() {
    try {
      const res = await fetch(`${API_BASE}/api/actions?org_id=${encodeURIComponent(orgId)}&status=pending`, {
        headers: authedHeaders,
      });
      const data = await res.json();
      setActions(data.actions || []);
    } catch (e) {
      console.error("Error loading actions:", e);
    }
  }

  async function loadSuggestions() {
    try {
      const res = await fetch(`${API_BASE}/api/suggestions?org_id=${encodeURIComponent(orgId)}&status=active`, {
        headers: authedHeaders,
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (e) {
      console.error("Error loading suggestions:", e);
    }
  }

  async function loadStats() {
    try {
      const [actionsRes, suggestionsRes] = await Promise.all([
        fetch(`${API_BASE}/api/actions/stats/${encodeURIComponent(orgId)}`, { headers: authedHeaders }),
        fetch(`${API_BASE}/api/suggestions/stats/${encodeURIComponent(orgId)}`, { headers: authedHeaders })
      ]);
      
      const actionsData = await actionsRes.json();
      const suggestionsData = await suggestionsRes.json();
      
      setStats({
        actions: actionsData.stats || {},
        suggestions: suggestionsData.stats || {}
      });
    } catch (e) {
      console.error("Error loading stats:", e);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      await Promise.all([loadActions(), loadSuggestions(), loadStats()]);
    } finally {
      setLoading(false);
    }
  }

  async function approveAction(action_id, approve) {
    try {
      await fetch(`${API_BASE}/api/actions/approve`, {
        method: "POST",
        headers: authedHeaders,
        body: JSON.stringify({ action_id, approve, note: approve ? "Approved by operator" : "Rejected by operator" }),
      });
      loadData(); // Reload all data
    } catch (e) {
      console.error("Error approving action:", e);
    }
  }

  async function dismissSuggestion(suggestion_id) {
    try {
      await fetch(`${API_BASE}/api/suggestions/dismiss`, {
        method: "POST",
        headers: authedHeaders,
        body: JSON.stringify({ suggestion_id, note: "Dismissed by operator" }),
      });
      loadData(); // Reload all data
    } catch (e) {
      console.error("Error dismissing suggestion:", e);
    }
  }

  async function createActionFromSuggestion(suggestion_id) {
    try {
      await fetch(`${API_BASE}/api/suggestions/create_action`, {
        method: "POST",
        headers: authedHeaders,
        body: JSON.stringify({ suggestion_id }),
      });
      loadData(); // Reload all data
    } catch (e) {
      console.error("Error creating action from suggestion:", e);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getActionTypeDisplay = (type) => {
    const typeMap = {
      "update_business_hours": "Business Hours",
      "update_google_business_profile": "Google Business",
      "update_yelp_listing": "Yelp Listing",
      "draft_social_post": "Social Media Post",
      "update_website_content": "Website Content"
    };
    return typeMap[type] || type;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      "urgent": "#ef4444",
      "high": "#f97316", 
      "medium": "#eab308",
      "low": "#22c55e"
    };
    return colors[priority] || "#6b7280";
  };

  return (
    <div style={{ maxWidth: 1200, margin: "24px auto", padding: "0 12px" }}>
      <h2>Operator Dashboard</h2>
      
      {/* Stats Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#475569" }}>Pending Actions</h4>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#1e293b" }}>{stats.actions?.pending || 0}</div>
        </div>
        <div style={{ background: "#f0fdf4", padding: 16, borderRadius: 8, border: "1px solid #bbf7d0" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#166534" }}>Completed Actions</h4>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#15803d" }}>{stats.actions?.completed || 0}</div>
        </div>
        <div style={{ background: "#fefce8", padding: 16, borderRadius: 8, border: "1px solid #fde047" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#a16207" }}>Active Suggestions</h4>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#ca8a04" }}>{stats.suggestions?.active || 0}</div>
        </div>
        <div style={{ background: "#fef2f2", padding: 16, borderRadius: 8, border: "1px solid #fecaca" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#991b1b" }}>Failed Actions</h4>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#dc2626" }}>{stats.actions?.failed || 0}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 0 }}>
          {["actions", "suggestions"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 24px",
                border: "none",
                background: "none",
                borderBottom: activeTab === tab ? "2px solid #3b82f6" : "2px solid transparent",
                color: activeTab === tab ? "#3b82f6" : "#6b7280",
                fontWeight: activeTab === tab ? "600" : "400",
                cursor: "pointer",
                textTransform: "capitalize"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading && <p>Loading…</p>}

      {/* Actions Tab */}
      {activeTab === "actions" && (
        <div>
          <h3>Pending Actions</h3>
          {!loading && !actions.length && <p>No pending actions.</p>}
          
          {actions.map((action) => (
            <div
              key={action.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 16,
                margin: "12px 0",
                background: "#fff"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: "600", marginBottom: 4 }}>
                    {getActionTypeDisplay(action.type)}
                  </div>
                  {action.description && (
                    <div style={{ color: "#6b7280", marginBottom: 8 }}>{action.description}</div>
                  )}
                  <div style={{ fontSize: 14, color: "#9ca3af" }}>
                    Created: {new Date(action.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: "500"
                }}>
                  {action.status}
                </div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <details>
                  <summary style={{ cursor: "pointer", fontWeight: "500", marginBottom: 8 }}>
                    View Parameters
                  </summary>
                  <pre style={{ 
                    background: "#f9fafb", 
                    padding: 12, 
                    borderRadius: 6, 
                    overflowX: "auto",
                    fontSize: 12,
                    border: "1px solid #e5e7eb"
                  }}>
                    {JSON.stringify(action.params, null, 2)}
                  </pre>
                </details>
              </div>
              
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => approveAction(action.id, true)}
                  style={{ 
                    padding: "8px 16px", 
                    borderRadius: 6, 
                    border: "1px solid #10b981", 
                    background: "#10b981", 
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => approveAction(action.id, false)}
                  style={{ 
                    padding: "8px 16px", 
                    borderRadius: 6, 
                    border: "1px solid #ef4444", 
                    background: "#ef4444", 
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === "suggestions" && (
        <div>
          <h3>AI Suggestions</h3>
          {!loading && !suggestions.length && <p>No active suggestions.</p>}
          
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 16,
                margin: "12px 0",
                background: "#fff"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 18, fontWeight: "600" }}>{suggestion.title}</div>
                    <div style={{
                      background: getPriorityColor(suggestion.priority),
                      color: "white",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: "500",
                      textTransform: "uppercase"
                    }}>
                      {suggestion.priority}
                    </div>
                  </div>
                  <div style={{ color: "#6b7280", marginBottom: 8 }}>{suggestion.description}</div>
                  <div style={{ fontSize: 14, color: "#9ca3af" }}>
                    Created: {new Date(suggestion.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {suggestion.suggested_action && (
                <div style={{ marginBottom: 16 }}>
                  <details>
                    <summary style={{ cursor: "pointer", fontWeight: "500", marginBottom: 8 }}>
                      View Suggested Action
                    </summary>
                    <pre style={{ 
                      background: "#f0f9ff", 
                      padding: 12, 
                      borderRadius: 6, 
                      overflowX: "auto",
                      fontSize: 12,
                      border: "1px solid #bae6fd"
                    }}>
                      {JSON.stringify(suggestion.suggested_action, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
              
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => createActionFromSuggestion(suggestion.id)}
                  style={{ 
                    padding: "8px 16px", 
                    borderRadius: 6, 
                    border: "1px solid #3b82f6", 
                    background: "#3b82f6", 
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                >
                  ⚡ Create Action
                </button>
                <button
                  onClick={() => dismissSuggestion(suggestion.id)}
                  style={{ 
                    padding: "8px 16px", 
                    borderRadius: 6, 
                    border: "1px solid #6b7280", 
                    background: "white", 
                    color: "#6b7280",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
