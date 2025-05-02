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

export function clearScores(scoreKey: string) {
  localStorage.setItem(scoreKey, JSON.stringify([]));
  return [];
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
