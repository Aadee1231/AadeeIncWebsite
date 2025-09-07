/**
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import site from "./content/site.json";
import Navbar from "./components/Navbar";
import Footer from "./components/FooterPro";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Portal from "./pages/Portal";
import Contact from "./pages/Contact";
import ChatWidget from "./components/ChatWidget";
import AuthProvider from "./components/AuthProvider";  

import "./styles/theme.css";
import "./styles/layout.css";
import "./styles/effects.css";

function useBrandColors() {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", site.brand.primary);
    root.style.setProperty("--color-accent", site.brand.accent);
  }, []);
}

export default function App() {
  useBrandColors();
  return (
    <BrowserRouter>
      <AuthProvider>   
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/portal/*" element={<Portal />} /> 
          <Route path="/contact" element={<Contact />} />
        </Routes>
        <Footer />
        <ChatWidget />
      </AuthProvider>
    </BrowserRouter>
  );
}
*/

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Portal from './Portal.jsx';
import PortalLogin from './PortalLogin.jsx';

function Home() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1>Aadee Inc.</h1>
      <p>Welcome! Head to the Portal to sign in.</p>
      <p style={{ marginTop: 16 }}>
        <Link to="/portal/login">Go to Portal Login →</Link>
      </p>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/portal/login"
          element={session ? <Navigate to="/portal" replace /> : <PortalLogin />}
        />
        <Route
          path="/portal/*"
          element={session ? <Portal /> : <Navigate to="/portal/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
