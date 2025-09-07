/**
import { Link, Routes, Route } from "react-router-dom";
import RequireAuth from "../components/RequireAuth";
import PortalLogin from "./PortalLogin";
import PortalKingAI from "./PortalKingAI.jsx";
import PortalSocial from "./PortalSocial";
import PortalTools from "./PortalTools";
import PortalAdmin from "./PortalAdmin";

export default function Portal() {
  return (
    <Routes>
      <Route path="login" element={<PortalLogin />} />

      <Route
        path=""
        element={
          <RequireAuth>
            <div className="portal-home">
              <h1>Portal</h1>
              <p>Select an assistant:</p>
              <div className="grid">
                <Link to="king-ai" className="card">Aadee Chat (King AI)</Link>
                <Link to="social"  className="card">Social Media Manager</Link>
                <Link to="tools"   className="card">Business Tools Builder</Link>
                <Link to="admin"   className="card">Operator Dashboard</Link>
              </div>
            </div>
          </RequireAuth>
        }
      />
      <Route path="king-ai" element={<RequireAuth><PortalKingAI /></RequireAuth>} />
      <Route path="social"  element={<RequireAuth><PortalSocial /></RequireAuth>} />
      <Route path="tools"   element={<RequireAuth><PortalTools /></RequireAuth>} />
      <Route path="admin"   element={<RequireAuth><PortalAdmin /></RequireAuth>} />
    </Routes>
  );
}
  */

import { useEffect, useState } from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import PortalSocial from './PortalSocial.jsx';
import PortalKingAI from './PortalKingAI.jsx';
import PortalTools from './PortalTools.jsx';

function AadeeChat() {
  const [mode, setMode] = useState('unified'); // unified | social | king | tools
  const [messages, setMessages] = useState([
    { author: 'assistant', text: 'Hey! I am AadeeChat. What can I do for your business today?' }
  ]);
  const [input, setInput] = useState('');
  const apiBase = import.meta.env.VITE_API_BASE || '';

  async function send() {
    if (!input.trim()) return;
    const userMsg = { author: 'user', text: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mode,
          messages: [{ role: 'user', content: input }]
        })
      });
      const data = await res.json();
      setMessages((m) => [...m, { author: 'assistant', text: data.reply || '(no reply)' }]);
    } catch (e) {
      setMessages((m) => [...m, { author: 'assistant', text: 'Server error.' }]);
    }
  }

  return (
    <div className="aadee-chat">
      <div className="chat-controls">
        <label>Tool Mode:&nbsp;</label>
        <select value={mode} onChange={(e)=>setMode(e.target.value)}>
          <option value="unified">Unified</option>
          <option value="social">Social Media Manager</option>
          <option value="king">King AI</option>
          <option value="tools">Create/Upgrade Tools</option>
        </select>
      </div>

      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.author}`}>
            <div className="bubble">{m.text}</div>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          placeholder="Type your request…"
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          onKeyDown={(e)=> e.key === 'Enter' ? send() : null}
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}

export default function Portal() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email ?? ''));
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/portal/login';
  }

  return (
    <div className="portal-layout">
      <header className="portal-header">
        <div className="brand">Aadee Portal</div>
        <nav>
          <NavLink to="" end>Chat</NavLink>
          <NavLink to="social">Social</NavLink>
          <NavLink to="king">King AI</NavLink>
          <NavLink to="tools">Create/Upgrade</NavLink>
        </nav>
        <div className="me">
          <span>{email}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>

      <main>
        <Routes>
          <Route index element={<AadeeChat />} />
          <Route path="social" element={<PortalSocial />} />
          <Route path="king" element={<PortalKingAI />} />
          <Route path="tools" element={<PortalTools />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </main>
    </div>
  );
}

