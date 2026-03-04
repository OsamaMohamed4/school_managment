import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { isLoggedIn, role: userRole } = useAuth();

 
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }


  if (role && userRole !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
