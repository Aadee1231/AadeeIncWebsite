// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import site from "./content/site.json";
import Navbar from "./components/Navbar";
import Footer from "./components/FooterPro";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import ChatWidget from "./components/ChatWidget";
import AuthProvider, { useAuth } from "./components/AuthProvider";

// NOTE: these now come from /pages
import Portal from "./pages/Portal";
import PortalLogin from "./pages/PortalLogin";

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

// ✅ Use Supabase session for protection (not aa_token)
function RequireAuth({ children }) {
  const { session, loading } = useAuth();
  if (loading) return null;            // avoid flicker/blank during init
  return session ? children : <Navigate to="/portal/login" replace />;
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

          <Route path="/portal/login" element={<PortalLogin />} />

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
