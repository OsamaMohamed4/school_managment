import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage      from "./pages/LandingPage";
import LoginPage        from "./pages/LoginPage";
import AdminDashboard   from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";

function AppRoutes() {
  const { isLoggedIn, role } = useAuth();

  return (
    <Routes>
      <Route path="/"             element={<LandingPage />} />
      <Route path="/login/:role"  element={<LoginPage />} />

      <Route path="/admin/dashboard" element={
        <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
      }/>
      <Route path="/teacher/dashboard" element={
        <ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>
      }/>
      <Route path="/student/dashboard" element={
        <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
      }/>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
