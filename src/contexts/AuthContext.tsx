import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, usernameToEmail } from "../lib/firebase";
import { ApiUser } from "../utils/api";

interface AuthState {
  user: ApiUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, display_name: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

async function loadProfile(uid: string): Promise<ApiUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data() as { username: string; display_name: string; created_at: { toMillis(): number } };
  return {
    id: uid,
    username: data.username,
    display_name: data.display_name,
    created_at: data.created_at?.toMillis() ?? Date.now(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      const profile = await loadProfile(firebaseUser.uid);
      setUser(profile);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function login(username: string, password: string) {
    await signInWithEmailAndPassword(auth, usernameToEmail(username), password);
  }

  async function register(username: string, display_name: string, password: string) {
    const normalized = username.trim().toLowerCase();
    let cred;
    try {
      cred = await createUserWithEmailAndPassword(auth, usernameToEmail(normalized), password);
    } catch (err) {
      if ((err as { code?: string }).code === "auth/email-already-in-use") {
        throw new Error("Username already taken");
      }
      throw err;
    }
    const created_at = Date.now();
    await setDoc(doc(db, "users", cred.user.uid), {
      username: normalized,
      display_name: display_name.trim(),
      created_at: serverTimestamp(),
    });
    // Set state directly rather than waiting for onAuthStateChanged, which can
    // fire before this setDoc above has committed and find no profile yet.
    setUser({ id: cred.user.uid, username: normalized, display_name: display_name.trim(), created_at });
  }

  function logout() {
    signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
