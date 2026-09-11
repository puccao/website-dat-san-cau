import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "../types/index.js";
import { api } from "../services/api.js";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  isUser: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  quickLogin: (role: "admin" | "user") => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore login from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    } else {
      // Default to logged-in regular user for frictionless first-time preview experience
      quickLogin("user").catch(() => {});
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.auth.login(email, password);
      if (res.success && res.token) {
        localStorage.setItem("auth_token", res.token);
        localStorage.setItem("auth_user", JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || "Đăng nhập thất bại" };
    } catch (err: any) {
      return { success: false, message: err.message || "Lỗi đăng nhập" };
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      const res = await api.auth.register(name, email, password, phone);
      if (res.success && res.token) {
        localStorage.setItem("auth_token", res.token);
        localStorage.setItem("auth_user", JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || "Đăng ký thất bại" };
    } catch (err: any) {
      return { success: false, message: err.message || "Lỗi đăng ký" };
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
  };

  const quickLogin = async (role: "admin" | "user") => {
    if (role === "admin") {
      const res = await login("admin@badminton.vn", "admin123");
      return res.success;
    } else {
      const res = await login("user@badminton.vn", "123456");
      return res.success;
    }
  };

  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user" || !user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        isUser,
        login,
        register,
        logout,
        quickLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
