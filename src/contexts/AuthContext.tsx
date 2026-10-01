import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db, legacyUsernameToEmail, normalizeUsername, USERNAME_PATTERN } from "../lib/firebase";
import { ApiUser } from "../utils/api";

interface AuthState {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
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

// Picks a free username from the account's displayName or email and creates the
// usernames/ reservation and users/ profile together, as register() does.
async function createMissingProfile(firebaseUser: User): Promise<ApiUser> {
  const base = (firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "player")
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "")
    .padEnd(3, "0")
    .slice(0, 16);
  let username = base;
  for (let i = 0; i < 20 && (await getDoc(doc(db, "usernames", username))).exists(); i++) {
    username = `${base}${Math.floor(Math.random() * 1000)}`;
  }
  const display_name = firebaseUser.displayName || username;
  const batch = writeBatch(db);
  batch.set(doc(db, "usernames", username), { uid: firebaseUser.uid });
  batch.set(doc(db, "users", firebaseUser.uid), { username, display_name, created_at: serverTimestamp() });
  await batch.commit();
  return { id: firebaseUser.uid, username, display_name, created_at: Date.now() };
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
      try {
        setUser(await loadProfile(firebaseUser.uid));
      } catch (err) {
        console.error("Failed to load profile", err);
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function login(email: string, password: string) {
    // Accounts created before real emails were collected only have a fake
    // address derived from their username, so a bare username still works.
    const signInEmail = email.includes("@") ? email.trim() : legacyUsernameToEmail(email);
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, signInEmail, password);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        throw new Error("Incorrect email or password");
      }
      if (code === "auth/invalid-email") throw new Error("Enter a valid email address");
      throw err;
    }

    // Signing in to Firebase isn't enough: the app also needs the users/{uid}
    // profile. Without this check a missing or unreadable profile leaves the
    // header on "Sign in" with no error.
    let profile: ApiUser | null;
    try {
      profile = await loadProfile(cred.user.uid);
    } catch (err) {
      console.error("Failed to load profile", err);
      await signOut(auth);
      throw new Error("Signed in, but couldn't load your profile (check the Firestore rules are deployed)");
    }
    if (!profile) {
      // Firebase account exists but has no profile (e.g. a signup that was
      // interrupted). Create one rather than leaving the user stuck.
      try {
        profile = await createMissingProfile(cred.user);
      } catch (err) {
        console.error("Failed to create profile", err);
        await signOut(auth);
        throw new Error("Signed in, but couldn't create your profile (check the Firestore rules are deployed)");
      }
    }
    setUser(profile);
  }

  async function register(username: string, email: string, password: string) {
    const display_name = username.trim();
    const normalized = normalizeUsername(username);
    if (!USERNAME_PATTERN.test(display_name)) {
      throw new Error("Username must be 3–20 characters: letters, numbers, . _ or -");
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

      // usernames/{username} reserves the name: its create fails if the doc
      // already exists, so this batch settles two people racing for it.
      const batch = writeBatch(db);
      batch.set(doc(db, "usernames", normalized), { uid: cred.user.uid });
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
