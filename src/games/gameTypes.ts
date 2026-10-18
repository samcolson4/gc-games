// Every game is scored the same way: each player gets a number per round and
// their total is the sum. The game type only decides which end of the table
// wins. Add a game here and it gets a page, a nav link and scorebook entry.

export type WinCondition = "lowest" | "highest";

export interface GameType {
  // Stored as `game_type` on Firestore game docs — don't rename existing ids.
  id: string;
  label: string;
  // URL path segment, e.g. /mexican-train
  slug: string;
  winCondition: WinCondition;
  // Prefix for the in-progress card and history kept in localStorage.
  storagePrefix: string;
  // What each round asks for, in order. Implies a round limit of its length.
  roundObjectives?: string[];
  // Round limit for games without objectives. Omit both for unlimited rounds.
  maxRounds?: number;
}

export const GAME_TYPES: GameType[] = [
  {
    id: "rummy",
    label: "Buying Rummy",
    slug: "rummy",
    winCondition: "lowest",
    storagePrefix: "rummy",
    roundObjectives: [
      "A set of three",
      "A run of three",
      "A set and a run",
      "A set of four",
      "A run of four",
      "Everything down at once",
    ],
  },
  { id: "rummy_10", label: "Rummy 10", slug: "rummy-10", winCondition: "lowest", storagePrefix: "rummy10", maxRounds: 10 },
  { id: "golf", label: "Golf", slug: "golf", winCondition: "lowest", storagePrefix: "golf" },
  { id: "mexican_train", label: "Mexican Train", slug: "mexican-train", winCondition: "lowest", storagePrefix: "mexicanTrain" },
];

export function getGameType(id: string): GameType | undefined {
  return GAME_TYPES.find((g) => g.id === id);
}

export function getGameTypeBySlug(slug: string): GameType | undefined {
  return GAME_TYPES.find((g) => g.slug === slug);
}

export function storageKeys(game: GameType) {
  return {
    playerKey: `${game.storagePrefix}Players`,
    playerIdKey: `${game.storagePrefix}PlayerIds`,
    scoreKey: `${game.storagePrefix}Scores`,
    historyKey: `${game.storagePrefix}History`,
  };
}

// Orders a and b so the player who is winning comes first.
export function compareTotals(winCondition: WinCondition, a: number, b: number): number {
  return winCondition === "lowest" ? a - b : b - a;
}

export function rankByTotal<T extends { total: number }>(winCondition: WinCondition, rows: T[]): T[] {
  return [...rows].sort((a, b) => compareTotals(winCondition, a.total, b.total));
}

export function winConditionPhrase(winCondition: WinCondition): string {
  return winCondition === "lowest" ? "lowest score wins" : "highest score wins";
}

export function getMaxRounds(game: GameType): number | undefined {
  return game.maxRounds ?? game.roundObjectives?.length;
}

// The game's rules as display lines, e.g. ["6 rounds", "Lowest score wins"].
export function gameRules(game: GameType): string[] {
  const phrase = winConditionPhrase(game.winCondition);
  const rules: string[] = [];
  const maxRounds = getMaxRounds(game);
  if (maxRounds !== undefined) rules.push(`${maxRounds} rounds`);
  rules.push(phrase.charAt(0).toUpperCase() + phrase.slice(1));
  return rules;
}
