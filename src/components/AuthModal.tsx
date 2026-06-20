import { useState, FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { colors, fonts } from "../styles/tokens";

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), displayName.trim(), password);
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: fonts.franklin,
    fontSize: 15,
    padding: "9px 12px",
    border: `1px solid ${colors.inputBorder}`,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    background: colors.paper,
    color: colors.ink,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.paper,
          padding: 36,
          maxWidth: 380,
          width: "90%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontFamily: fonts.franklin,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: colors.accent,
            marginBottom: 20,
          }}
        >
          {mode === "login" ? "Sign In" : "Create Account"}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            style={inputStyle}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          {mode === "register" && (
            <input
              style={inputStyle}
              placeholder="Display name (e.g. Sam)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          )}
          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />

          {error && (
            <div
              style={{
                fontFamily: fonts.franklin,
                fontSize: 13,
                color: colors.accent,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              fontFamily: fonts.franklin,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "11px 0",
              background: colors.ink,
              color: colors.paper,
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
              marginTop: 4,
            }}
          >
            {submitting ? "…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
          style={{
            marginTop: 16,
            background: "none",
            border: "none",
            fontFamily: fonts.franklin,
            fontSize: 13,
            color: colors.meta3,
            cursor: "pointer",
            padding: 0,
            textDecoration: "underline",
          }}
        >
          {mode === "login" ? "Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
