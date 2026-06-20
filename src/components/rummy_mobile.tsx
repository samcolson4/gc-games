import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  updatePlayerName,
  updateScore,
  clearScores,
  calculateCumulativeScore,
  getStoredData,
  clearPlayersAndScores,
  finishGame,
  getHistory,
  deleteHistory,
  clearHistory,
  getPlayerTotals,
  GameHistoryRecord,
} from "../utils/scoreHelpers";
import { colors, fonts } from "../styles/tokens";
import { editorialStyles } from "../styles/editorialStyles";
import { GameHistorySection } from "./editorial/ScorecardShared";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "./AuthModal";

const PLAYER_KEY = "rummyPlayers";
const SCORE_KEY = "rummyScores";
const HISTORY_KEY = "rummyHistory";
const ROUNDS = 6;

const navItems = [
  { to: "/", label: "Rummy" },
  { to: "/golf", label: "Golf" },
  { to: "/mexican-train", label: "Mexican Train" },
  { to: "/suburb", label: "Suburb" },
  { to: "/nz", label: "NZ" },
];

function BurgerMenu() {
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { user, logout, loading: authLoading } = useAuth();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          display: "flex",
          flexDirection: "column",
          gap: 5,
          zIndex: 10,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{ display: "block", width: 24, height: 2, backgroundColor: colors.ink }}
          />
        ))}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
          }}
        >
          <div
            onClick={() => setOpen(false)}
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
          />
          <div
            style={{
              width: 260,
              backgroundColor: colors.paper,
              display: "flex",
              flexDirection: "column",
              padding: "24px 0",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 24px 20px",
                borderBottom: `1px solid ${colors.rule}`,
              }}
            >
              <span
                style={{
                  fontFamily: fonts.franklin,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: colors.meta3,
                }}
              >
                Games
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 20,
                  lineHeight: 1,
                  color: colors.meta,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>

            <nav style={{ padding: "12px 0" }}>
              {navItems.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "block",
                    padding: "14px 24px",
                    fontFamily: fonts.serif,
                    fontSize: 20,
                    fontWeight: 700,
                    color: colors.ink,
                    textDecoration: "none",
                    borderBottom: `1px solid ${colors.ruleFaint}`,
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div
              style={{
                marginTop: "auto",
                padding: "20px 24px 0",
                borderTop: `1px solid ${colors.rule}`,
              }}
            >
              {!authLoading && (
                user ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <span
                      style={{
                        fontFamily: fonts.franklin,
                        fontSize: 13,
                        color: colors.meta3,
                      }}
                    >
                      Signed in as {user.display_name}
                    </span>
                    <button
                      onClick={() => { logout(); setOpen(false); }}
                      style={{
                        fontFamily: fonts.franklin,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        background: "none",
                        border: `1px solid ${colors.inputBorder}`,
                        color: colors.meta3,
                        cursor: "pointer",
                        padding: "8px 16px",
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowAuth(true); setOpen(false); }}
                    style={{
                      fontFamily: fonts.franklin,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      background: colors.ink,
                      color: colors.paper,
                      border: "none",
                      cursor: "pointer",
                      padding: "10px 20px",
                      width: "100%",
                    }}
                  >
                    Sign in
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}

function RummyMobile() {
  const [players, setPlayers] = useState<string[]>(Array(6).fill(""));
  const [scores, setScores] = useState<string[][]>(
    Array(ROUNDS).fill(null).map(() => Array(6).fill(""))
  );
  const [history, setHistory] = useState<GameHistoryRecord[]>([]);
  const [draftPlayer, setDraftPlayer] = useState("");

  useEffect(() => {
    const { players: initialPlayers, scores: initialScores } = getStoredData(
      PLAYER_KEY,
      SCORE_KEY
    );
    setPlayers(initialPlayers);
    const validScores = Array(ROUNDS).fill(null).map((_, i) =>
      Array(6).fill("").map((_, j) => initialScores?.[i]?.[j] || "")
    );
    setScores(validScores);
    setHistory(getHistory(HISTORY_KEY));
  }, []);

  const handleNameChange = (index: number, name: string) => {
    const newPlayers = updatePlayerName(players, index, name, PLAYER_KEY);
    setPlayers(newPlayers);
  };

  const handleScoreChange = (
    playerIndex: number,
    roundIndex: number,
    score: string
  ) => {
    const newScores = updateScore(scores, playerIndex, roundIndex, score, SCORE_KEY);
    setScores(newScores);
  };

  const addPlayer = () => {
    const name = draftPlayer.trim();
    if (!name) return;
    const emptyIndex = players.findIndex((p) => p.trim() === "");
    if (emptyIndex === -1) return;
    handleNameChange(emptyIndex, name);
    setDraftPlayer("");
  };

  const clearOnlyScores = () => {
    const emptyScores = clearScores(SCORE_KEY, ROUNDS, 6);
    setScores(emptyScores);
  };

  const handleClearAll = () => {
    const { emptyPlayers } = clearPlayersAndScores(PLAYER_KEY, SCORE_KEY);
    setPlayers(emptyPlayers);
    setScores(Array(ROUNDS).fill(null).map(() => Array(6).fill("")));
  };

  const handleFinishGame = () => {
    const { history: newHistory, clearedScores } = finishGame(
      HISTORY_KEY,
      SCORE_KEY,
      players,
      scores
    );
    setHistory(newHistory);
    setScores(clearedScores);
  };

  const getPlayerEmoji = (playerIndex: number, roundIndex: number) => {
    const emojis = ["🟩", "🟦", "🟪", "🟨", "🟧", "🟥"];
    const playerScores = players
      .map((_, i) => ({
        index: i,
        score: calculateCumulativeScore(scores.map((row) => row[i]), roundIndex),
      }))
      .filter(({ index }) => players[index].trim() !== "")
      .sort((a, b) => a.score - b.score);

    if (playerScores.length === 0) return "";

    let currentScore = playerScores[0]?.score;
    let currentGroup: typeof playerScores = [];
    let emojiIndex = 0;

    for (const player of playerScores) {
      if (player.score === currentScore) {
        currentGroup.push(player);
      } else {
        if (currentGroup.some((p) => p.index === playerIndex)) {
          return emojis[emojiIndex];
        }
        currentGroup = [player];
        currentScore = player.score;
        emojiIndex++;
      }
    }

    if (currentGroup.some((p) => p.index === playerIndex)) {
      return emojis[emojiIndex];
    }
    return "";
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const activePlayers = players.filter((name) => name.trim() !== "");
  const hasAnyScores = scores.some((round) =>
    round.some((score) => score.trim() !== "")
  );
  const standings = getPlayerTotals(players, scores);
  const leaderTotal = standings[0]?.total;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100vw",
        minHeight: "100vh",
        backgroundColor: colors.paper,
        padding: "16px",
        boxSizing: "border-box",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <BurgerMenu />
      <div style={{ textAlign: "center", marginBottom: 16, paddingTop: 8 }}>
        <div style={editorialStyles.eyebrow}>The Scorecard</div>
        <h1
          style={{
            fontFamily: fonts.serif,
            fontWeight: 700,
            fontSize: 32,
            margin: "8px 0 4px",
            color: colors.ink,
          }}
        >
          Rummy
        </h1>
        <p style={{ ...editorialStyles.dek, fontSize: 15, margin: 0 }}>
          {activePlayers.length} players · lowest score wins
        </p>
      </div>

      {standings.length > 0 && (
        <div
          style={{
            borderTop: `2px solid ${colors.ink}`,
            borderBottom: `1px solid ${colors.rule}`,
            padding: "14px 0",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              ...editorialStyles.eyebrow,
              color: colors.accent,
              fontSize: 10,
              marginBottom: 6,
            }}
          >
            Standings
          </div>
          {standings.slice(0, 3).map((s, i) => (
            <div
              key={s.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                fontFamily: fonts.serif,
                fontSize: 16,
              }}
            >
              <span>{i + 1}. {s.name}</span>
              <span
                style={{
                  fontFamily: fonts.numbers,
                  fontWeight: 700,
                  color: s.total === leaderTotal ? colors.accent : colors.body,
                }}
              >
                {s.total}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={clearOnlyScores} style={{ ...editorialStyles.btnClear, flex: 1, minWidth: 120 }}>
          Clear Scores
        </button>
        <button
          onClick={handleClearAll}
          style={{ ...editorialStyles.btnDanger, flex: 1, minWidth: 120 }}
        >
          Clear All
        </button>
      </div>

      <div
        style={{
          borderTop: `1px solid ${colors.rule}`,
          paddingTop: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ ...editorialStyles.eyebrow, marginBottom: 10 }}>Players</div>
        {players.map((name, i) => {
          if (i === 0 || players[i - 1].trim() !== "") {
            return (
              <input
                key={i}
                type="text"
                placeholder={`Player ${i + 1}`}
                value={name}
                onChange={(e) => handleNameChange(i, e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: 16,
                  fontFamily: fonts.franklin,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: 0,
                  boxSizing: "border-box",
                  minHeight: 44,
                  marginBottom: 8,
                }}
              />
            );
          }
          return null;
        })}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            type="text"
            value={draftPlayer}
            onChange={(e) => setDraftPlayer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPlayer()}
            placeholder="Add player"
            style={{ ...editorialStyles.addPlayerInput, flex: 1, width: "auto" }}
          />
          <button onClick={addPlayer} style={editorialStyles.btnOutline}>
            Add
          </button>
        </div>
      </div>

      {activePlayers.length > 0 && (
        <div>
          <div style={{ ...editorialStyles.eyebrow, marginBottom: 12 }}>Rounds</div>
          {[...Array(ROUNDS)].map((_, roundIndex) => {
            const roundScores = scores[roundIndex] || [];
            const hasScores = roundScores.some((score) => score.trim() !== "");

            let lastRoundWithScores = -1;
            for (let i = ROUNDS - 1; i >= 0; i--) {
              if (players.some((_, pi) => scores[i]?.[pi]?.trim() !== "")) {
                lastRoundWithScores = i;
                break;
              }
            }
            const isLastRound = roundIndex === lastRoundWithScores;

            return (
              <div
                key={roundIndex}
                style={{
                  borderTop: isLastRound && hasScores ? `2px solid ${colors.ink}` : `1px solid ${colors.rule}`,
                  padding: "14px 0",
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: fonts.franklin,
                      fontWeight: 700,
                      fontSize: 14,
                      color: colors.ink,
                    }}
                  >
                    Round {roundIndex + 1}
                  </span>
                  {hasScores && isLastRound && (
                    <span
                      style={{
                        fontFamily: fonts.franklin,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: colors.accent,
                      }}
                    >
                      Current
                    </span>
                  )}
                </div>

                {activePlayers.map((playerName) => {
                  const originalIndex = players.indexOf(playerName);
                  const score = roundScores[originalIndex] || "";
                  const cumulativeScore = hasScores
                    ? calculateCumulativeScore(
                        scores.map((row) => row[originalIndex]),
                        roundIndex
                      )
                    : null;
                  const emoji = hasScores
                    ? getPlayerEmoji(originalIndex, roundIndex)
                    : "";

                  return (
                    <div
                      key={originalIndex}
                      style={{
                        padding: "10px 0",
                        borderBottom: `1px solid ${colors.ruleFaint}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: fonts.serif,
                            fontWeight: 700,
                            fontSize: 16,
                            color: colors.ink,
                          }}
                        >
                          {playerName}
                        </span>
                        {emoji && <span style={{ fontSize: 18 }}>{emoji}</span>}
                      </div>
                      <input
                        type="number"
                        placeholder="—"
                        value={score}
                        onChange={(e) =>
                          handleScoreChange(originalIndex, roundIndex, e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "10px",
                          fontSize: 20,
                          fontFamily: fonts.numbers,
                          border: "none",
                          borderBottom: `1px solid ${colors.ruleFaint}`,
                          textAlign: "right",
                          backgroundColor: colors.paper,
                          boxSizing: "border-box",
                          minHeight: 44,
                        }}
                      />
                      {cumulativeScore !== null && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 6,
                            fontFamily: fonts.franklin,
                            fontSize: 12,
                            color: colors.meta3,
                          }}
                        >
                          <span>Scores on the doors</span>
                          <span
                            style={{
                              fontFamily: fonts.numbers,
                              fontWeight: 700,
                              fontSize: 16,
                              color: colors.body,
                            }}
                          >
                            {cumulativeScore}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {hasAnyScores && (
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px solid ${colors.rule}`,
          }}
        >
          <div style={{ ...editorialStyles.eyebrow, marginBottom: 10 }}>Rankings</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8,
            }}
          >
            {["🟩", "🟦", "🟪", "🟨", "🟧", "🟥"].map((emoji, index) => (
              <div
                key={emoji}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: fonts.franklin,
                  fontSize: 13,
                  color: colors.meta,
                }}
              >
                <span>{emoji}</span>
                <span>
                  {index === 0
                    ? "Best"
                    : index === 5
                      ? "Worst"
                      : `${index + 1}${getOrdinalSuffix(index + 1)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button
          onClick={handleFinishGame}
          style={{ ...editorialStyles.btnPrimary, width: "100%" }}
        >
          Finish &amp; Log Game
        </button>
      </div>

      <GameHistorySection
        history={history}
        onDelete={(id) => setHistory(deleteHistory(HISTORY_KEY, id))}
        onClearHistory={() => setHistory(clearHistory(HISTORY_KEY))}
      />

      <div style={{ height: 32 }} />
    </div>
  );
}

export default RummyMobile;
