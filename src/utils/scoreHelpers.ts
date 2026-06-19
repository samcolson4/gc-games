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

export function getStoredData(playerKey: string, scoreKey: string) {
  const players = JSON.parse(localStorage.getItem(playerKey) || JSON.stringify(Array(6).fill("")));
  const scores = JSON.parse(localStorage.getItem(scoreKey) || JSON.stringify([]));
  return { players, scores };
}

export function updatePlayerName(players: string[], index: number, name: string, playerKey: string) {
  const newPlayers = [...players];
  newPlayers[index] = name;
  localStorage.setItem(playerKey, JSON.stringify(newPlayers));
  return newPlayers;
}

export function updateScore(
  scores: string[][],
  playerIndex: number,
  roundIndex: number,
  score: string,
  scoreKey: string
) {
  const updatedScores = scores.map(row => [...row]);
  updatedScores[roundIndex][playerIndex] = score;
  localStorage.setItem(scoreKey, JSON.stringify(updatedScores));
  return updatedScores;
}

export function clearScores(scoreKey: string, roundCount = 6, playerCount = 6) {
  const emptyScores: string[][] = Array(roundCount).fill(null).map(() => Array(playerCount).fill(""));
  localStorage.setItem(scoreKey, JSON.stringify(emptyScores));
  return emptyScores;
}

export function clearPlayersAndScores(playerKey: string, scoreKey: string) {
  const emptyPlayers = Array(6).fill("");
  const emptyScores: string[][] = [];
  localStorage.setItem(playerKey, JSON.stringify(emptyPlayers));
  localStorage.setItem(scoreKey, JSON.stringify(emptyScores));
  return { emptyPlayers, emptyScores };
}

export function calculateCumulativeScore(playerScores: (string | undefined)[], upToRound: number): number {
  return playerScores
    .slice(0, upToRound + 1)
    .map(score => parseInt(score || "0", 10))
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
  lowWins = true
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

  const sorted = [...activePlayers].sort((a, b) =>
    lowWins ? a.total - b.total : b.total - a.total
  );

  const now = new Date();
  const record: GameHistoryRecord = {
    id: Date.now(),
    date: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    unit: "Round",
    roundCount: scores.length,
    playerCount: activePlayers.length,
    winnerName: sorted[0].name,
    winnerTotal: sorted[0].total,
    results: sorted.map((p) => ({ name: p.name, total: p.total })),
  };

  const history = [record, ...getHistory(historyKey)];
  localStorage.setItem(historyKey, JSON.stringify(history));

  const playerCount = players.length;
  const roundCount = scores.length || 1;
  const clearedScores = Array(roundCount)
    .fill(null)
    .map(() => Array(playerCount).fill(""));
  localStorage.setItem(scoreKey, JSON.stringify(clearedScores));

  return { history, clearedScores };
}

export function getPlayerTotals(
  players: string[],
  scores: string[][]
): { name: string; index: number; total: number }[] {
  const lastRound = Math.max(0, scores.length - 1);
  return players
    .map((name, index) => ({
      name: name.trim(),
      index,
      total: calculateCumulativeScore(
        scores.map((row) => row[index]),
        lastRound
      ),
    }))
    .filter((p) => p.name !== "")
    .sort((a, b) => a.total - b.total);
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

export function getLeaderInfo(playerKey: string, scoreKey: string): LeaderInfo | null {
  const { players, scores } = getStoredData(playerKey, scoreKey);
  const totals = getPlayerTotals(players, scores);
  if (totals.length === 0) return null;
  return {
    name: totals[0].name,
    total: totals[0].total,
    playerCount: totals.length,
    roundCount: scores.length,
  };
}
