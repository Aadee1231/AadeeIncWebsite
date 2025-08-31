import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import site from "./content/site.json";
import Navbar from "./components/Navbar";
import Footer from "./components/FooterPro";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import "./styles/theme.css";
import "./styles/layout.css";
import "./styles/effects.css";
import ChatWidget from "./components/ChatWidget";


// Sync site.json colors to CSS variables so rebranding is easy
function useBrandColors(){
  useEffect(()=>{
    const root = document.documentElement;
    root.style.setProperty("--color-primary", site.brand.primary);
    root.style.setProperty("--color-accent", site.brand.accent);
  },[]);
}

export default function App(){
  useBrandColors();
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/about" element={<About/>}/>
        <Route path="/services" element={<Services/>}/>
        <Route path="/pricing" element={<Pricing/>}/>
        <Route path="/contact" element={<Contact/>}/>
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <>
      {/* your site content */}
      <ChatWidget />
    </>
  );
}
