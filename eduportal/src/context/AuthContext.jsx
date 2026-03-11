import { createContext, useContext, useState, useEffect } from "react";
import { getUser, clearAuth } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUser());

  useEffect(() => {
    const stored = getUser();
    if (stored) setUser(stored);
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
