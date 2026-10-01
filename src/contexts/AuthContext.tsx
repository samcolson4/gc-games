import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db, legacyUsernameToEmail, normalizeUsername, USERNAME_PATTERN } from "../lib/firebase";
import { ApiUser } from "../utils/api";

interface AuthState {
  user: ApiUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
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
    const normalized = normalizeUsername(username);
    // usernames/{username} maps a username to the email Firebase Auth signs in with.
    // Older accounts have no entry and use the fake email they were created with.
    const mapping = await getDoc(doc(db, "usernames", normalized));
    const email = mapping.exists() ? (mapping.data() as { email: string }).email : legacyUsernameToEmail(normalized);
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        throw new Error("Incorrect username or password");
      }
      throw err;
    }
    if (!mapping.exists()) {
      // Backfill the mapping so a new signup can't claim this legacy username.
      setDoc(doc(db, "usernames", normalized), { uid: cred.user.uid, email }).catch(() => {});
    }
  }

  async function register(username: string, email: string, password: string) {
    const display_name = username.trim();
    const normalized = normalizeUsername(username);
    if (!USERNAME_PATTERN.test(display_name)) {
      throw new Error("Username must be 3–20 characters: letters, numbers, . _ or -");
    }
    if ((await getDoc(doc(db, "usernames", normalized))).exists()) {
      throw new Error("Username already taken");
    }

    let cred;
    try {
      cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-in-use") throw new Error("An account with that email already exists");
      if (code === "auth/invalid-email") throw new Error("Enter a valid email address");
      if (code === "auth/weak-password") throw new Error("Password must be at least 6 characters");
      throw err;
    }

    try {
      // Legacy accounts may own this username without a usernames/ entry yet.
      const legacy = await getDocs(query(collection(db, "users"), where("username", "==", normalized), limit(1)));
      if (!legacy.empty) throw new Error("Username already taken");

      // The usernames/ create fails if the doc already exists, so this batch is
      // what actually reserves the username if two people race for it.
      const batch = writeBatch(db);
      batch.set(doc(db, "usernames", normalized), { uid: cred.user.uid, email: cred.user.email });
      batch.set(doc(db, "users", cred.user.uid), {
        username: normalized,
        display_name,
        created_at: serverTimestamp(),
      });
      await batch.commit();
    } catch (err) {
      await deleteUser(cred.user).catch(() => {});
      if ((err as { code?: string }).code === "permission-denied") throw new Error("Username already taken");
      throw err;
    }

    await updateProfile(cred.user, { displayName: display_name }).catch(() => {});
    // Set state directly rather than waiting for onAuthStateChanged, which can
    // fire before the batch above has committed and find no profile yet.
    setUser({ id: cred.user.uid, username: normalized, display_name, created_at: Date.now() });
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
