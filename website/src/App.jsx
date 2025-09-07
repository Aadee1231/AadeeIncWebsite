import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import site from "./content/site.json";
import Navbar from "./components/Navbar";
import Footer from "./components/FooterPro";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Portal from "./pages/Portal";         // Protected (after login)
import Contact from "./pages/Contact";
import ChatWidget from "./components/ChatWidget";
import AuthProvider from "./components/AuthProvider";

// NEW: public login page for the portal
import PortalLogin from "./pages/PortalLogin"; // <-- make sure this file exists

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

// NEW: minimal auth gate for the Portal area
function RequireAuth({ children }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("aa_token") : null;
  return token ? children : <Navigate to="/portal/login" replace />;
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

          {/* NEW: public login page */}
          <Route path="/portal/login" element={<PortalLogin />} />

          {/* EXISTING: portal stays the same path, now protected */}
          <Route
            path="/portal/*"
            element={
              <RequireAuth>
                <Portal />
              </RequireAuth>
            }
          />

          <Route path="/contact" element={<Contact />} />
        </Routes>
        <Footer />
        <ChatWidget />
      </AuthProvider>
    </BrowserRouter>
  );
}
