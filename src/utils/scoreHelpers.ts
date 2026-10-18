import { WinCondition, rankByTotal } from "../games/gameTypes";

export interface GameHistoryRecord {
  id: number;
  date: string;
  time: string;
  unit: string;
  roundCount: number;
  playerCount: number;
  winnerName: string;
  winnerTotal: number;
  results: { name: string; total: number }[];
}

export function getStoredData(playerKey: string, scoreKey: string): { players: string[]; scores: string[][] } {
  const players: (string | null)[] = JSON.parse(localStorage.getItem(playerKey) || "[]");
  const scores: (string | null)[][] = JSON.parse(localStorage.getItem(scoreKey) || "[]");
  return {
    players: players.map((p) => p ?? ""),
    scores: scores.map((row) => (row ?? []).map((s) => s ?? "")),
  };
}

export function calculateCumulativeScore(playerScores: (string | undefined)[], upToRound: number): number {
  return playerScores
    .slice(0, upToRound + 1)
    .map(score => parseInt(score || "0", 10) || 0)
    .reduce((acc, curr) => acc + curr, 0);
}

export function getHistory(historyKey: string): GameHistoryRecord[] {
  return JSON.parse(localStorage.getItem(historyKey) || "[]");
}

export function deleteHistory(historyKey: string, id: number): GameHistoryRecord[] {
  const history = getHistory(historyKey).filter((r) => r.id !== id);
  localStorage.setItem(historyKey, JSON.stringify(history));
  return history;
}

export function clearHistory(historyKey: string): GameHistoryRecord[] {
  localStorage.setItem(historyKey, JSON.stringify([]));
  return [];
}

export function finishGame(
  historyKey: string,
  scoreKey: string,
  players: string[],
  scores: string[][],
  winCondition: WinCondition
): { history: GameHistoryRecord[]; clearedScores: string[][] } {
  const activePlayers = players
    .map((name, index) => ({
      name: name.trim(),
      index,
      total: calculateCumulativeScore(
        scores.map((row) => row[index]),
        scores.length - 1
      ),
    }))
    .filter((p) => p.name !== "");

  if (activePlayers.length === 0) {
    return { history: getHistory(historyKey), clearedScores: scores };
  }

  const sorted = rankByTotal(winCondition, activePlayers);

  const now = new Date();
  const record: GameHistoryRecord = {
    id: Date.now(),
    date: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    unit: "Round",
    roundCount: scores.filter((round) => round.some((s) => s.trim() !== "")).length,
    playerCount: activePlayers.length,
    winnerName: sorted[0].name,
    winnerTotal: sorted[0].total,
    results: sorted.map((p) => ({ name: p.name, total: p.total })),
  };

  const history = [record, ...getHistory(historyKey)];
  localStorage.setItem(historyKey, JSON.stringify(history));

  const clearedScores = [Array(players.length).fill("")];
  localStorage.setItem(scoreKey, JSON.stringify(clearedScores));

  return { history, clearedScores };
}

export function getPlayerTotals(
  players: string[],
  scores: string[][],
  winCondition: WinCondition
): { name: string; index: number; total: number }[] {
  const lastRound = Math.max(0, scores.length - 1);
  const totals = players
    .map((name, index) => ({
      name: name.trim(),
      index,
      total: calculateCumulativeScore(
        scores.map((row) => row[index]),
        lastRound
      ),
    }))
    .filter((p) => p.name !== "");
  return rankByTotal(winCondition, totals);
}

export function getSeasonStats(history: GameHistoryRecord[]): { name: string; wins: number; played: number }[] {
  const stats: Record<string, { wins: number; played: number }> = {};

  history.forEach((game) => {
    game.results.forEach((result, i) => {
      if (!stats[result.name]) {
        stats[result.name] = { wins: 0, played: 0 };
      }
      stats[result.name].played++;
      if (i === 0) {
        stats[result.name].wins++;
      }
    });
  });

  return Object.entries(stats)
    .map(([name, { wins, played }]) => ({ name, wins, played }))
    .sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name));
}

export interface LeaderInfo {
  name: string;
  total: number;
  playerCount: number;
  roundCount: number;
}

export function getLeaderInfo(
  playerKey: string,
  scoreKey: string,
  winCondition: WinCondition
): LeaderInfo | null {
  const { players, scores } = getStoredData(playerKey, scoreKey);
  const totals = getPlayerTotals(players, scores, winCondition);
  if (totals.length === 0) return null;
  return {
    name: totals[0].name,
    total: totals[0].total,
    playerCount: totals.length,
    roundCount: scores.filter((round) => round.some((s) => s.trim() !== "")).length,
  };
}

// Dealer starts as the first named player and rotates one seat per round.
export function getDealerIndex(activeIndices: number[], roundIndex: number): number {
  if (activeIndices.length === 0) return -1;
  return activeIndices[roundIndex % activeIndices.length];
}
