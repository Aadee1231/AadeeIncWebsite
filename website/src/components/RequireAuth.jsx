import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function RequireAuth({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return null; // or spinner
  if (!session) return <Navigate to="/portal/login" state={{ from: location }} replace />;
  return children;
}
