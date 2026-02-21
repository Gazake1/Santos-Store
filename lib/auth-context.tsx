"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  nickname: string;
  cpf: string;
  phone: string;
  phone_verified: number;
  birth: string;
  gender: string;
  theme_preference: string;
  avatar: string;
  cep: string;
  street: string;
  street_number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (user: User) => void;
  updateToken: (token: string) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("sg_token");
    const savedUser = localStorage.getItem("sg_user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch { /* invalid data */ }
    }
    setLoading(false);
  }, []);

  const saveSession = useCallback((userData: User, tokenData: string) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem("sg_user", JSON.stringify(userData));
    localStorage.setItem("sg_token", tokenData);
    localStorage.setItem("sg_profile", JSON.stringify(userData));
    if (userData.theme_preference) {
      localStorage.setItem("sg_theme", userData.theme_preference);
      document.documentElement.setAttribute("data-theme", userData.theme_preference);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      saveSession(data.user, data.token);
      // Sync cart from server
      if (data.cart?.length) {
        const localCart = JSON.parse(localStorage.getItem("sg_cart") || "[]");
        const merged = [...localCart];
        data.cart.forEach((item: { product_id: string; quantity: number; name: string; price: number; category: string }) => {
          const idx = merged.findIndex((m: { product_id: string }) => m.product_id === item.product_id);
          if (idx === -1) merged.push(item);
        });
        localStorage.setItem("sg_cart", JSON.stringify(merged));
      }
      return { success: true };
    } catch {
      return { success: false, error: "Erro de conexão" };
    }
  }, [saveSession]);

  const register = useCallback(async (data: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) return { success: false, error: result.error };
      saveSession(result.user, result.token);
      return { success: true };
    } catch {
      return { success: false, error: "Erro de conexão" };
    }
  }, [saveSession]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("sg_user");
    localStorage.removeItem("sg_token");
    localStorage.removeItem("sg_profile");
    localStorage.removeItem("sg_cart");
  }, []);

  const updateUser = useCallback((u: User) => {
    setUser(u);
    localStorage.setItem("sg_user", JSON.stringify(u));
    localStorage.setItem("sg_profile", JSON.stringify(u));
  }, []);

  const updateToken = useCallback((t: string) => {
    setToken(t);
    localStorage.setItem("sg_token", t);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, register, logout,
      updateUser, updateToken,
      isAdmin: user?.role === "admin",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
