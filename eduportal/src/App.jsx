import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute   from "./components/ProtectedRoute";
import LandingPage      from "./pages/LandingPage";
import LoginPage        from "./pages/LoginPage";
import AdminDashboard   from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ProfilePage     from './pages/ProfilePage';
import ParentDashboard  from "./pages/ParentDashboard";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"                   element={<LandingPage />} />
      <Route path="/login/:role"        element={<LoginPage />} />
      <Route path="/admin/dashboard"    element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/teacher/dashboard"  element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/student/dashboard"  element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProfilePage/>}/>
        <Route path="/parent/dashboard"   element={<ProtectedRoute role="parent"><ParentDashboard /></ProtectedRoute>} />
      <Route path="*"                   element={<Navigate to="/" replace />} />
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
