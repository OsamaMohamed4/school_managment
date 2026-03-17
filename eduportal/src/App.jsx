import './animations.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute   from "./components/ProtectedRoute";
import LandingPage      from "./pages/LandingPage";
import LoginPage        from "./pages/LoginPage";
import AdminDashboard   from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ProfilePage      from './pages/ProfilePage';
import ParentDashboard  from "./pages/ParentDashboard";


function AppRoutes() {
  return (
    <Routes>
      <Route path="/"                  element={<LandingPage />} />
      <Route path="/login/:role"       element={<LoginPage />} />

      {/* ✅ FIX: LoginPage does navigate(`/${role}`) so routes must be /admin /teacher etc */}
      <Route path="/admin"    element={<ProtectedRoute role="admin">   <AdminDashboard />   </ProtectedRoute>} />
      <Route path="/teacher"  element={<ProtectedRoute role="teacher"> <TeacherDashboard /> </ProtectedRoute>} />
      <Route path="/student"  element={<ProtectedRoute role="student"> <StudentDashboard /> </ProtectedRoute>} />
      <Route path="/parent"   element={<ProtectedRoute role="parent">  <ParentDashboard />  </ProtectedRoute>} />

      {/* Keep old paths as aliases so bookmarks still work */}
      <Route path="/admin/dashboard"   element={<Navigate to="/admin"   replace />} />
      <Route path="/teacher/dashboard" element={<Navigate to="/teacher" replace />} />
      <Route path="/student/dashboard" element={<Navigate to="/student" replace />} />
      <Route path="/parent/dashboard"  element={<Navigate to="/parent"  replace />} />

      <Route path="/profile" element={<ProfilePage />} />
      <Route path="*"        element={<Navigate to="/" replace />} />
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
