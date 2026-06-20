export type GameType = "rummy" | "golf" | "mexican_train";
export type GameStatus = "in_progress" | "completed";

export interface User {
  id: number;
  username: string;
  display_name: string;
  created_at: number;
}

export interface Game {
  id: number;
  game_type: GameType;
  status: GameStatus;
  created_by: number | null;
  created_at: number;
  completed_at: number | null;
}

export interface GamePlayer {
  game_id: number;
  user_id: number;
  join_order: number;
}

export interface Score {
  id: number;
  game_id: number;
  user_id: number;
  round_number: number;
  value: number;
}

export interface GameWithDetails {
  game: Game;
  players: (User & { join_order: number })[];
  scores: Score[];
}

export interface GameSummary {
  id: number;
  game_type: GameType;
  status: GameStatus;
  created_at: number;
  completed_at: number | null;
  player_count: number;
  round_count: number;
  winner_display_name: string | null;
  winner_total: number | null;
  results: { display_name: string; total: number }[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ScoreSubmission {
  user_id: number;
  round_number: number;
  value: number;
}
