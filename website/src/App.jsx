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
          <Route path="/portal/*" element={<Portal />} /> {/* has /portal/login and the agent pages */}
          <Route path="/contact" element={<Contact />} />
        </Routes>
        <Footer />
        <ChatWidget />
      </AuthProvider>
    </BrowserRouter>
  );
}
