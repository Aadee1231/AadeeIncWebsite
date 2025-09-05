import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../components/AuthProvider";
import { Navigate, useLocation } from "react-router-dom";

export default function PortalLogin() {
  const { session } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/portal";

  useEffect(() => {
    // You can embed Supabase Auth UI here; for MVP do magic link:
    // supabase.auth.signInWithOtp({ email }) ... or render your own form.
  }, []);

  if (session) return <Navigate to={from} replace />;

  return (
    <div style={{maxWidth: 420, margin: "40px auto", textAlign:"center"}}>
      <h2>Portal Login</h2>
      <p>Sign-ups require a meeting with Aadee Inc. to be enabled.</p>
      {/* Replace with your email/password or magic link form */}
      {/* Example quick button for OAuth (Google): */}
      <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>
        Continue with Google
      </button>
    </div>
  );
}
