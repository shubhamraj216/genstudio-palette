// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";

const BACKEND_BASE = "http://localhost:8000";

export type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_guest?: boolean;
  guest_quota?: number;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const getToken = () => {
    try { return localStorage.getItem("access_token"); } catch { return null; }
  };

  const authHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchMe = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/me`, {
        headers: { "Content-Type": "application/json", ...authHeaders() },
      });
      if (!res.ok) {
        // token invalid / expired
        setUser(null);
        localStorage.removeItem("access_token");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUser({
        id: data.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        is_guest: data.is_guest,
        guest_quota: data.guest_quota,
      });
    } catch (err) {
      console.error("fetchMe error", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token") {
        fetchMe();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${BACKEND_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Login failed");
    }
    const data = await res.json();
    const token = data.access_token;
    if (!token) throw new Error("No token returned");
    localStorage.setItem("access_token", token);
    await fetchMe();
  };

  const signup = async (email: string, password: string, first_name?: string, last_name?: string) => {
    const res = await fetch(`${BACKEND_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, first_name, last_name }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Signup failed");
    }
    const data = await res.json();
    const token = data.access_token;
    if (token) {
      localStorage.setItem("access_token", token);
      // backend returns user optionally in response (we added that), but fetchMe will refresh
      await fetchMe();
      return;
    }
    throw new Error("No token returned");
  };

  const guest = async () => {
    const res = await fetch(`${BACKEND_BASE}/api/auth/guest`, { method: "POST" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Guest signup failed");
    }
    const data = await res.json();
    const token = data.access_token;
    if (!token) throw new Error("No token returned");
    localStorage.setItem("access_token", token);
    await fetchMe();
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return { user, loading, login, signup, logout, guest, fetchMe, authHeaders };
}
