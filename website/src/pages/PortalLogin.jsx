
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { supabase } from "../lib/supabaseClient";

export default function PortalLogin() {
  const { session } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/portal";

  if (session) return <Navigate to={from} replace />;

  async function signInGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/portal` // brings them back to the portal after login
      }
    });
  }

  return (
    <div style={{maxWidth: 420, margin: "40px auto", textAlign:"center"}}>
      <h2>Portal Login</h2>
      <p style={{color:"#555"}}>Sign-ups require a meeting with Aadee Inc. to be enabled.</p>
      <button onClick={signInGoogle}
        style={{padding:"10px 14px", borderRadius:8, border:"1px solid #111827", background:"#111827", color:"#fff"}}>
        Continue with Google
      </button>
    </div>
  );
}