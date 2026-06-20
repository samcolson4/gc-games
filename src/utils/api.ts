const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface ApiUser {
  id: number;
  username: string;
  display_name: string;
  created_at: number;
}

export interface ApiGameSummary {
  id: number;
  game_type: string;
  status: string;
  created_at: number;
  completed_at: number | null;
  player_count: number;
  round_count: number;
  winner_display_name: string | null;
  winner_total: number | null;
  results: { display_name: string; total: number }[];
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("gc_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  register(username: string, display_name: string, password: string) {
    return apiFetch<{ token: string; user: ApiUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, display_name, password }),
    });
  },

  login(username: string, password: string) {
    return apiFetch<{ token: string; user: ApiUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  me() {
    return apiFetch<{ user: ApiUser }>("/api/auth/me");
  },

  listUsers() {
    return apiFetch<{ users: ApiUser[] }>("/api/users");
  },

  createGame(game_type: string, player_ids: number[]) {
    return apiFetch<{ id: number }>("/api/games", {
      method: "POST",
      body: JSON.stringify({ game_type, player_ids }),
    });
  },

  listGames(params?: { game_type?: string; user_id?: number }) {
    const qs = new URLSearchParams();
    if (params?.game_type) qs.set("game_type", params.game_type);
    if (params?.user_id) qs.set("user_id", String(params.user_id));
    const q = qs.toString();
    return apiFetch<{ games: ApiGameSummary[] }>(`/api/games${q ? `?${q}` : ""}`);
  },

  submitScores(gameId: number, scores: { user_id: number; round_number: number; value: number }[]) {
    return apiFetch<{ ok: boolean }>(`/api/games/${gameId}/scores`, {
      method: "POST",
      body: JSON.stringify({ scores }),
    });
  },

  completeGame(gameId: number) {
    return apiFetch<{ ok: boolean }>(`/api/games/${gameId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "completed" }),
    });
  },
};
