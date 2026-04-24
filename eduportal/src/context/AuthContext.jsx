import { createContext, useContext, useState, useEffect } from "react";
import { authAPI, getUser, clearAuth } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUser());

  useEffect(() => {
    const stored = getUser();
    if (stored) setUser(stored);
  }, []);

  // ✅ FIX: login now calls the API and validates the role
  const login = async (email, password, role) => {
    const data = await authAPI.login(email, password);
    // authAPI.login already saves tokens + user to localStorage

    if (data.user.role !== role) {
      clearAuth(); // remove the tokens we just saved
      throw new Error(`This account is not a ${role} account. Please select the correct role.`);
    }

    setUser(data.user);
    return data;
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
