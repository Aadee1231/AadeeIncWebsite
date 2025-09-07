
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