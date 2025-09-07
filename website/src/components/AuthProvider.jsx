import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);
const VITE_API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthCtx.Provider value={{ session, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

useEffect(() => {
  async function ensureBackendToken() {
    if (!session) {
      localStorage.removeItem("aa_token");
      localStorage.removeItem("aa_user");
      return;
    }
    try {
      // create a demo token the FastAPI expects
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: session.user?.email || "user@aadeeinc.com",
          password: "supabase-oauth"
        })
      });
      const data = await res.json();
      localStorage.setItem("aa_token", data.access_token);
      localStorage.setItem("aa_user", JSON.stringify(data.user));
    } catch (e) {
      console.warn("Failed to fetch aa_token", e);
    }
  }
  ensureBackendToken();
}, [session]);


