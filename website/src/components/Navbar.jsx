import { NavLink } from "react-router-dom";
import "../styles/layout.css";

export default function Navbar(){
  const active = ({ isActive }) => ({ marginLeft:"1rem", color:"var(--text)", ...(isActive? { fontWeight:600 } : {}) });
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <strong>Aadee Inc.</strong>
        <div className="nav-links">
          <NavLink to="/"        className={({isActive})=> isActive ? "active" : ""} style={active}>Home</NavLink>
          <NavLink to="/about"   className={({isActive})=> isActive ? "active" : ""} style={active}>About</NavLink>
          <NavLink to="/services"className={({isActive})=> isActive ? "active" : ""} style={active}>Services</NavLink>
          <NavLink to="/pricing" className={({isActive})=> isActive ? "active" : ""} style={active}>Price</NavLink>
          <NavLink to="/contact" className={({isActive})=> isActive ? "active" : ""} style={active}>Contact</NavLink>
        </div>
      </div>
    </nav>
  );
}
