import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Accounts created before real emails were collected signed up with a fake,
// non-deliverable address derived from their username. Login falls back to
// this address when the user types a username instead of an email.
export function legacyUsernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@users.gc-games.local`;
}

// Usernames are unique case-insensitively; the lowercase form is the doc id
// in `usernames/{username}` and the `username` field on `users/{uid}`.
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,20}$/;
