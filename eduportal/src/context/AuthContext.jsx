import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const getStoredUser = () => {
  try {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [role, setRole] = useState(() => localStorage.getItem("role"));

  const login = (userData) => {
    setUser(userData.user);
    setRole(userData.user.role);
  };

  const logout = () => {
    ["access_token", "refresh_token", "role", "user"].forEach((k) =>
      localStorage.removeItem(k)
    );
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, role, login, logout, isLoggedIn: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
