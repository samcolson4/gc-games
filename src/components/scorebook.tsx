import { useState, useEffect } from "react";
import { colors, fonts } from "../styles/tokens";
import { getStoredData, getPlayerTotals, getHistory, GameHistoryRecord } from "../utils/scoreHelpers";

const GAMES = [
  { label: "Rummy", playerKey: "rummyPlayers", scoreKey: "rummyScores", historyKey: "rummyHistory", lowWins: false },
  { label: "Golf", playerKey: "golfPlayers", scoreKey: "golfScores", historyKey: "golfHistory", lowWins: true },
  { label: "Mexican Train", playerKey: "mexicanTrainPlayers", scoreKey: "mexicanTrainScores", historyKey: "mexicanTrainHistory", lowWins: true },
];

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface GameSnapshot {
  label: string;
  players: { name: string; total: number }[];
  roundCount: number;
  lowWins: boolean;
  todayHistory: GameHistoryRecord[];
}

function GameBlock({ snap }: { snap: GameSnapshot }) {
  const hasActive = snap.players.length > 0;
  const hasTodayHistory = snap.todayHistory.length > 0;

  if (!hasActive && !hasTodayHistory) return null;

  const sorted = hasActive
    ? [...snap.players].sort((a, b) =>
        snap.lowWins ? a.total - b.total : b.total - a.total
      )
    : [];

  return (
    <div style={{ marginBottom: 36 }}>
      <div
        style={{
          fontFamily: fonts.franklin,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: colors.meta3,
          borderBottom: `1px solid ${colors.rule}`,
          paddingBottom: 6,
          marginBottom: 12,
        }}
      >
        {snap.label}
      </div>

      {hasActive && (
        <div style={{ marginBottom: hasTodayHistory ? 20 : 0 }}>
          <div
            style={{
              fontFamily: fonts.franklin,
              fontSize: 11,
              color: colors.meta3,
              marginBottom: 8,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            In progress · {snap.roundCount} round{snap.roundCount !== 1 ? "s" : ""}
          </div>
          {sorted.map((p, i) => (
            <div
              key={p.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "5px 0",
                borderBottom: `1px solid ${colors.ruleFaint}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span
                  style={{
                    fontFamily: fonts.franklin,
                    fontSize: 11,
                    color: colors.rank,
                    width: 14,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontFamily: fonts.serif, fontSize: 16, color: colors.ink }}>
                  {p.name}
                </span>
              </div>
              <span
                style={{
                  fontFamily: fonts.numbers,
                  fontSize: 15,
                  color: i === 0 ? colors.ink : colors.meta,
                  fontWeight: i === 0 ? 600 : 400,
                }}
              >
                {p.total}
              </span>
            </div>
          ))}
        </div>
      )}

      {hasTodayHistory && (
        <div>
          <div
            style={{
              fontFamily: fonts.franklin,
              fontSize: 11,
              color: colors.meta3,
              marginBottom: 8,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Completed today
          </div>
          {snap.todayHistory.map((record) => (
            <div
              key={record.id}
              style={{
                padding: "7px 0",
                borderBottom: `1px solid ${colors.ruleFaint}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: fonts.serif, fontSize: 15, color: colors.ink, fontWeight: 600 }}>
                  {record.winnerName}
                </span>
                <span style={{ fontFamily: fonts.franklin, fontSize: 11, color: colors.meta3 }}>
                  {record.time}
                </span>
              </div>
              <div style={{ fontFamily: fonts.franklin, fontSize: 12, color: colors.meta, marginTop: 2 }}>
                Won with {record.winnerTotal} · {record.roundCount} rounds · {record.playerCount} players
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Scorebook() {
  const [snapshots, setSnapshots] = useState<GameSnapshot[]>([]);

  useEffect(() => {
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const snaps = GAMES.map((game) => {
      const { players, scores } = getStoredData(game.playerKey, game.scoreKey);
      const totals = getPlayerTotals(players, scores);
      const history = getHistory(game.historyKey);
      const todayHistory = history.filter((r) => r.date === today);

      return {
        label: game.label,
        players: totals,
        roundCount: scores.length,
        lowWins: game.lowWins,
        todayHistory,
      };
    });

    setSnapshots(snaps);
  }, []);

  const anyContent = snapshots.some((s) => s.players.length > 0 || s.todayHistory.length > 0);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 40px" }}>
      <div
        style={{
          fontFamily: fonts.franklin,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: colors.meta3,
          marginBottom: 4,
        }}
      >
        {formatDate()}
      </div>
      <h2
        style={{
          fontFamily: fonts.serif,
          fontSize: 28,
          fontWeight: 700,
          color: colors.ink,
          margin: "0 0 4px",
        }}
      >
        Today&apos;s Scorebook
      </h2>
      <div
        style={{
          borderTop: `3px solid ${colors.ink}`,
          borderBottom: `1px solid ${colors.ink}`,
          height: 3,
          margin: "16px 0 28px",
        }}
      />

      {anyContent ? (
        snapshots.map((snap) => <GameBlock key={snap.label} snap={snap} />)
      ) : (
        <p style={{ fontFamily: fonts.serif, fontSize: 17, color: colors.meta }}>
          No games in progress or completed today.
        </p>
      )}
    </div>
  );
}
