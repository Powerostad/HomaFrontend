import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

/**
 * User type - represents an authenticated user
 */
export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

/**
 * AuthContext - manages user authentication state
 * Separated from AppContext for better isolation and debugging
 */
interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  setUser: (user: User | null) => void;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Check for existing auth on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem("authToken");
      const savedUser = localStorage.getItem("user");
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Error loading auth state:", error);
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("authToken", `token_${userData.id}`);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        setUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
