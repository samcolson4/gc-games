import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export interface ApiUser {
  id: string;
  username: string;
  display_name: string;
  created_at: number;
}

export interface ApiGameSummary {
  id: string;
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

interface GamePlayer {
  id: string;
  display_name: string;
}

interface GameDoc {
  game_type: string;
  status: "in_progress" | "completed";
  created_by: string;
  created_at: Timestamp;
  completed_at: Timestamp | null;
  player_ids: string[];
  players: GamePlayer[];
}

interface ScoreDoc {
  user_id: string;
  round_number: number;
  value: number;
}

function toMillis(ts: Timestamp | null): number | null {
  return ts ? ts.toMillis() : null;
}

async function fetchGameSummary(gameId: string, game: GameDoc): Promise<ApiGameSummary> {
  const scoresSnap = await getDocs(collection(db, "games", gameId, "scores"));
  const totals = new Map<string, number>();
  const rounds = new Set<number>();
  scoresSnap.forEach((d) => {
    const s = d.data() as ScoreDoc;
    totals.set(s.user_id, (totals.get(s.user_id) || 0) + s.value);
    rounds.add(s.round_number);
  });

  const results = game.players
    .map((p) => ({ display_name: p.display_name, total: totals.get(p.id) ?? 0 }))
    .sort((a, b) => a.total - b.total);

  return {
    id: gameId,
    game_type: game.game_type,
    status: game.status,
    created_at: toMillis(game.created_at) ?? Date.now(),
    completed_at: toMillis(game.completed_at),
    player_count: game.players.length,
    round_count: rounds.size,
    winner_display_name: results[0]?.display_name ?? null,
    winner_total: results[0]?.total ?? null,
    results,
  };
}

export const api = {
  async listUsers() {
    const snap = await getDocs(query(collection(db, "users"), orderBy("display_name", "asc")));
    const users: ApiUser[] = snap.docs.map((d) => {
      const data = d.data() as { username: string; display_name: string; created_at: Timestamp };
      return {
        id: d.id,
        username: data.username,
        display_name: data.display_name,
        created_at: toMillis(data.created_at) ?? Date.now(),
      };
    });
    return { users };
  },

  async createGame(game_type: string, player_ids: string[]) {
    if (player_ids.length < 2) throw new Error("At least 2 player_ids are required");

    const userDocs = await Promise.all(player_ids.map((id) => getDoc(doc(db, "users", id))));
    const players: GamePlayer[] = userDocs.map((snap, i) => {
      if (!snap.exists()) throw new Error("Player not found");
      return { id: player_ids[i], display_name: (snap.data() as { display_name: string }).display_name };
    });

    const createdBy = auth.currentUser?.uid;
    if (!createdBy) throw new Error("Not signed in");

    const ref = await addDoc(collection(db, "games"), {
      game_type,
      status: "in_progress",
      created_by: createdBy,
      created_at: serverTimestamp(),
      completed_at: null,
      player_ids,
      players,
    });

    return { id: ref.id };
  },

  async listGames(params?: { game_type?: string; user_id?: string }) {
    const clauses = [where("status", "==", "completed")];
    if (params?.game_type) clauses.push(where("game_type", "==", params.game_type));
    if (params?.user_id) clauses.push(where("player_ids", "array-contains", params.user_id));

    const snap = await getDocs(
      query(collection(db, "games"), ...clauses, orderBy("completed_at", "desc"), limit(100))
    );

    const games = await Promise.all(
      snap.docs.map((d) => fetchGameSummary(d.id, d.data() as GameDoc))
    );
    return { games };
  },

  async submitScores(gameId: string, scores: { user_id: string; round_number: number; value: number }[]) {
    const gameSnap = await getDoc(doc(db, "games", gameId));
    if (!gameSnap.exists()) throw new Error("Game not found");
    const game = gameSnap.data() as GameDoc;
    if (game.status === "completed") throw new Error("Cannot modify a completed game");

    await Promise.all(
      scores.map((s) =>
        setDoc(doc(db, "games", gameId, "scores", `${s.user_id}_${s.round_number}`), s)
      )
    );

    return { ok: true };
  },

  async completeGame(gameId: string) {
    await updateDoc(doc(db, "games", gameId), {
      status: "completed",
      completed_at: serverTimestamp(),
    });
    return { ok: true };
  },
};
