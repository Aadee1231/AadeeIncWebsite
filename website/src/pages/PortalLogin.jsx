/*
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
  */

import { useState } from 'react';
import { supabase } from './lib/supabaseClient';

export default function PortalLogin() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function ensureOrg() {
    const { data: me } = await supabase.auth.getUser();
    const userId = me?.user?.id;
    if (!userId) return;

    // Do I have any orgs?
    let { data: memberships } = await supabase
      .from('memberships')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1);

    if (!memberships || memberships.length === 0) {
      // Create org and membership
      const orgName = 'My Business';
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert([{ name: orgName, created_by: userId }])
        .select()
        .single();
      if (orgErr) throw orgErr;

      const { error: memErr } = await supabase
        .from('memberships')
        .insert([{ org_id: org.id, user_id: userId, role: 'owner' }]);
      if (memErr) throw memErr;
    }
  }

  async function signIn(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      // try sign in
      const { error: signinErr } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (signinErr) {
        // if not signed up, sign up
        const { error: signupErr } = await supabase.auth.signUp({ email, password: pw });
        if (signupErr) throw signupErr;
      }
      await ensureOrg();
      setMsg('Success! Redirecting…');
      window.location.href = '/portal';
    } catch (err) {
      setMsg(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap" style={{ maxWidth: 420, margin: '4rem auto' }}>
      <h2>Portal Login</h2>
      <form onSubmit={signIn}>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        <button disabled={loading}>{loading ? 'Loading…' : 'Login / Sign up'}</button>
      </form>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}

