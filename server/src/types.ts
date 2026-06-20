export type GameType = "rummy" | "golf" | "mexican_train";
export type GameStatus = "in_progress" | "completed";

export interface ScoreSubmission {
  user_id: number;
  round_number: number;
  value: number;
}
