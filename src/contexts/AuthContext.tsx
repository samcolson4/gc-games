import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, ApiUser } from "../utils/api";

interface AuthState {
  user: ApiUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, display_name: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("gc_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => {
        localStorage.removeItem("gc_token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function login(username: string, password: string) {
    const res = await api.login(username, password);
    localStorage.setItem("gc_token", res.token);
    setToken(res.token);
    setUser(res.user);
  }

  async function register(username: string, display_name: string, password: string) {
    const res = await api.register(username, display_name, password);
    localStorage.setItem("gc_token", res.token);
    setToken(res.token);
    setUser(res.user);
  }

  function logout() {
    localStorage.removeItem("gc_token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
