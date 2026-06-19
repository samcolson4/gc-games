import { useState, useEffect } from "react";
import {
  GameHistoryRecord,
  getSeasonStats,
} from "../../utils/scoreHelpers";
import { colors, fonts } from "../../styles/tokens";
import { getOrdinal } from "../../styles/editorialStyles";

interface StandingsRailProps {
  standings: { name: string; total: number }[];
  gameName: string;
  history: GameHistoryRecord[];
  isNarrow?: boolean;
}

export function StandingsRail({ standings, gameName, history, isNarrow }: StandingsRailProps) {
  const leader = standings[0];
  const rest = standings.slice(1);
  const seasonStats = getSeasonStats(history);

  return (
    <aside
      style={{
        borderLeft: isNarrow ? "none" : `1px solid ${colors.ink}`,
        borderTop: isNarrow ? `1px solid ${colors.ink}` : "none",
        paddingLeft: isNarrow ? 0 : 32,
        paddingTop: isNarrow ? 32 : 0,
      }}
    >
      <div
        style={{
          fontFamily: fonts.franklin,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: colors.accent,
        }}
      >
        Standings
      </div>
      <div
        style={{
          fontFamily: fonts.serif,
          fontStyle: "italic",
          fontSize: 14,
          color: colors.meta3,
          marginTop: 5,
          paddingBottom: 16,
          borderBottom: `1px solid ${colors.ink}`,
        }}
      >
        Fewest points takes the lead.
      </div>

      {leader ? (
        <>
          <div style={{ padding: "22px 0 20px", borderBottom: `1px solid ${colors.rule}` }}>
            <div
              style={{
                fontFamily: fonts.franklin,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: colors.accent,
              }}
            >
              1st · In the lead
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                marginTop: 8,
              }}
            >
              <span
                style={{
                  fontFamily: fonts.serif,
                  fontWeight: 700,
                  fontSize: 30,
                  lineHeight: 1.05,
                  color: colors.ink,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: "1 1 auto",
                  minWidth: 0,
                }}
              >
                {leader.name}
              </span>
              <span
                style={{
                  fontFamily: fonts.numbers,
                  fontSize: 32,
                  fontWeight: 700,
                  lineHeight: 1,
                  flex: "none",
                  color: colors.accent,
                }}
              >
                {leader.total}
              </span>
            </div>
          </div>
          {rest.map((player, i) => (
            <div
              key={player.name}
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                padding: "15px 0",
                borderBottom: `1px solid ${colors.ruleFaint}`,
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 11,
                  minWidth: 0,
                  flex: "1 1 auto",
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.franklin,
                    fontSize: 12,
                    fontWeight: 700,
                    color: colors.rank,
                    flex: "none",
                  }}
                >
                  {getOrdinal(i + 2)}
                </span>
                <span
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 19,
                    color: colors.ink,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: "1 1 auto",
                    minWidth: 0,
                  }}
                >
                  {player.name}
                </span>
              </span>
              <span
                style={{
                  fontFamily: fonts.numbers,
                  fontSize: 21,
                  color: "#444",
                  flex: "none",
                }}
              >
                {player.total}
              </span>
            </div>
          ))}
        </>
      ) : (
        <p
          style={{
            fontFamily: fonts.serif,
            fontSize: 16,
            color: colors.faintLabel,
            lineHeight: 1.5,
            margin: "22px 0 0",
          }}
        >
          The table is empty. Add players and the standings will keep score, ranked from first to last.
        </p>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 32, paddingTop: 18, borderTop: `2px solid ${colors.ink}` }}>
          <div
            style={{
              fontFamily: fonts.franklin,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: colors.accent,
            }}
          >
            This Season
          </div>
          <div
            style={{
              fontFamily: fonts.serif,
              fontStyle: "italic",
              fontSize: 14,
              color: colors.meta3,
              marginTop: 5,
              paddingBottom: 14,
              borderBottom: `1px solid ${colors.ink}`,
            }}
          >
            {history.length} game{history.length !== 1 ? "s" : ""} logged in {gameName}
          </div>
          {seasonStats.map((stat, i) => (
            <div
              key={stat.name}
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                padding: "15px 0",
                borderBottom: `1px solid ${colors.ruleFaint}`,
              }}
            >
              <span style={{ display: "flex", alignItems: "baseline", gap: 11, minWidth: 0, flex: "1 1 auto" }}>
                <span
                  style={{
                    fontFamily: fonts.franklin,
                    fontSize: 12,
                    fontWeight: 700,
                    color: colors.rank,
                    flex: "none",
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 19,
                    color: colors.ink,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: "1 1 auto",
                    minWidth: 0,
                  }}
                >
                  {stat.name}
                </span>
              </span>
              <span
                style={{
                  fontFamily: fonts.numbers,
                  fontSize: 22,
                  fontWeight: 700,
                  color: i === 0 ? colors.accent : colors.body,
                  flex: "none",
                }}
              >
                {stat.wins} WINS
              </span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

interface GameHistorySectionProps {
  history: GameHistoryRecord[];
  onDelete: (id: number) => void;
  onClearHistory: () => void;
}

export function GameHistorySection({ history, onDelete, onClearHistory }: GameHistorySectionProps) {
  if (history.length === 0) return null;

  return (
    <div style={{ marginTop: 52 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          borderBottom: `2px solid ${colors.ink}`,
          paddingBottom: 11,
        }}
      >
        <span
          style={{
            fontFamily: fonts.franklin,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: colors.faintLabel,
          }}
        >
          Recent Games
        </span>
        <button
          onClick={onClearHistory}
          style={{
            fontFamily: fonts.franklin,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            background: "none",
            border: "none",
            color: colors.faintLabel,
            cursor: "pointer",
            padding: 0,
          }}
        >
          Clear history
        </button>
      </div>
      {history.map((game, index) => (
        <div
          key={game.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 24,
            padding: "18px 0",
            borderBottom: `1px solid ${colors.rule}`,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: fonts.franklin,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: colors.faintLabel,
              }}
            >
              Game {history.length - index} · {game.date} · {game.time}
            </div>
            <div
              style={{
                fontFamily: fonts.serif,
                fontWeight: 700,
                fontSize: 23,
                color: colors.ink,
                marginTop: 5,
                lineHeight: 1.15,
              }}
            >
              {game.winnerName} won with {game.winnerTotal}
            </div>
            <div
              style={{
                fontFamily: fonts.numbers,
                fontSize: 15,
                color: colors.meta2,
                marginTop: 5,
                overflowWrap: "anywhere",
              }}
            >
              {game.results.map((r) => `${r.name} ${r.total}`).join(" · ")}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 10,
              flex: "none",
            }}
          >
            <span
              style={{
                fontFamily: fonts.franklin,
                fontSize: 11.5,
                color: colors.faintLabel,
                whiteSpace: "nowrap",
              }}
            >
              {game.playerCount} players · {game.roundCount} rounds
            </span>
            <button
              onClick={() => onDelete(game.id)}
              style={{
                border: "none",
                background: "none",
                color: colors.inputBorder,
                cursor: "pointer",
                fontSize: 17,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function useNarrowLayout(breakpoint = 860) {
  const [isNarrow, setIsNarrow] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const handleResize = () => setIsNarrow(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isNarrow;
}
