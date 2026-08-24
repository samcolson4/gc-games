import { useState, useEffect } from "react";
import { api, ApiUser } from "../utils/api";
import { colors, fonts } from "../styles/tokens";

interface PlayerSelectProps {
  maxPlayers?: number;
  onConfirm: (players: ApiUser[]) => void;
}

export function PlayerSelect({ maxPlayers = 6, onConfirm }: PlayerSelectProps) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listUsers()
      .then(({ users }) => setUsers(users))
      .catch(() => setError("Could not load players."))
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < maxPlayers) {
        next.add(id);
      }
      return next;
    });
  }

  function handleConfirm() {
    const players = users.filter((u) => selected.has(u.id));
    if (players.length < 2) return;
    onConfirm(players);
  }

  if (loading) {
    return (
      <p style={{ fontFamily: fonts.franklin, fontSize: 14, color: colors.meta3 }}>
        Loading players…
      </p>
    );
  }

  if (error) {
    return (
      <p style={{ fontFamily: fonts.franklin, fontSize: 14, color: colors.accent }}>
        {error}
      </p>
    );
  }

  return (
    <div>
      <div
        style={{
          fontFamily: fonts.franklin,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: colors.accent,
          marginBottom: 14,
        }}
      >
        Select Players
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {users.map((u) => {
          const checked = selected.has(u.id);
          const disabled = !checked && selected.size >= maxPlayers;
          return (
            <label
              key={u.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: `1px solid ${colors.ruleFaint}`,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(u.id)}
                style={{ width: 16, height: 16, accentColor: colors.accent, cursor: "pointer" }}
              />
              <span
                style={{
                  fontFamily: fonts.serif,
                  fontSize: 18,
                  color: colors.ink,
                  fontWeight: checked ? 700 : 400,
                }}
              >
                {u.display_name}
              </span>
            </label>
          );
        })}
      </div>
      <button
        disabled={selected.size < 2}
        onClick={handleConfirm}
        style={{
          marginTop: 20,
          fontFamily: fonts.franklin,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          padding: "10px 24px",
          background: selected.size < 2 ? colors.ruleFaint : colors.ink,
          color: selected.size < 2 ? colors.rank : colors.paper,
          border: "none",
          cursor: selected.size < 2 ? "not-allowed" : "pointer",
        }}
      >
        Start Game · {selected.size} player{selected.size !== 1 ? "s" : ""}
      </button>
    </div>
  );
}
