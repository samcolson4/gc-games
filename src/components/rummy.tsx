import { useState, useEffect, Fragment } from "react";
import {
  updatePlayerName,
  updateScore,
  clearScores,
  calculateCumulativeScore,
  getStoredData,
  clearPlayersAndScores,
  getPlayerTotals,
  finishGame,
  getHistory,
  deleteHistory,
  clearHistory,
  GameHistoryRecord,
} from "../utils/scoreHelpers";
import { colors, fonts } from "../styles/tokens";
import { editorialStyles } from "../styles/editorialStyles";
import {
  StandingsRail,
  GameHistorySection,
  useNarrowLayout,
} from "./editorial/ScorecardShared";
import { useAuth } from "../contexts/AuthContext";
import { PlayerSelect } from "./PlayerSelect";
import { ApiUser, api } from "../utils/api";

const PLAYER_KEY = "rummyPlayers";
const SCORE_KEY = "rummyScores";
const HISTORY_KEY = "rummyHistory";
const ROUNDS = 6;

function Rummy() {
  const [players, setPlayers] = useState<string[]>(Array(6).fill(""));
  const [scores, setScores] = useState<string[][]>(
    Array(ROUNDS).fill(null).map(() => Array(6).fill(""))
  );
  const [history, setHistory] = useState<GameHistoryRecord[]>([]);
  const [draftPlayer, setDraftPlayer] = useState("");
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<ApiUser[] | null>(null);
  const isNarrow = useNarrowLayout();
  const { user } = useAuth();

  useEffect(() => {
    const { players: initialPlayers, scores: initialScores } = getStoredData(PLAYER_KEY, SCORE_KEY);
    setPlayers(initialPlayers);
    const validScores = Array(ROUNDS).fill(null).map((_, i) =>
      Array(6).fill("").map((_, j) => initialScores?.[i]?.[j] || "")
    );
    setScores(validScores);
    setHistory(getHistory(HISTORY_KEY));
  }, []);

  const activePlayers = players
    .map((name, index) => ({ name: name.trim(), index }))
    .filter((p) => p.name !== "");

  const activeCount = activePlayers.length;
  const roundsPlayed = scores.filter((round) =>
    round.some((s) => s.trim() !== "")
  ).length;

  const standings = getPlayerTotals(players, scores).map((p) => ({
    name: p.name,
    total: p.total,
  }));
  const leaderTotal = standings[0]?.total;

  const handleNameChange = (index: number, name: string) => {
    const newPlayers = updatePlayerName(players, index, name, PLAYER_KEY);
    setPlayers(newPlayers);
  };

  const handleScoreChange = (playerIndex: number, roundIndex: number, score: string) => {
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

  const removePlayer = (index: number) => {
    const newPlayers = [...players];
    newPlayers[index] = "";
    localStorage.setItem(PLAYER_KEY, JSON.stringify(newPlayers));
    const newScores = scores.map((row) => {
      const updated = [...row];
      updated[index] = "";
      return updated;
    });
    localStorage.setItem(SCORE_KEY, JSON.stringify(newScores));
    setPlayers(newPlayers);
    setScores(newScores);
  };

  const clearOnlyScores = () => {
    const emptyScores = clearScores(SCORE_KEY, ROUNDS, 6);
    setScores(emptyScores);
  };

  const handleClearAll = () => {
    const { emptyPlayers, emptyScores } = clearPlayersAndScores(PLAYER_KEY, SCORE_KEY);
    setPlayers(emptyPlayers);
    setScores(
      Array(ROUNDS).fill(null).map(() => Array(6).fill(""))
    );
    if (emptyScores.length === 0) {
      // clearPlayersAndScores returns empty array; restore rummy grid shape
      setScores(Array(ROUNDS).fill(null).map(() => Array(6).fill("")));
    }
  };

  const handleFinishGame = async () => {
    const { history: newHistory, clearedScores } = finishGame(
      HISTORY_KEY,
      SCORE_KEY,
      players,
      scores
    );
    setHistory(newHistory);
    setScores(clearedScores);

    if (user && selectedUsers) {
      try {
        const { id: gameId } = await api.createGame("rummy", selectedUsers.map((u) => u.id));
        const scoreRows: { user_id: number; round_number: number; value: number }[] = [];
        scores.forEach((round, roundIndex) => {
          selectedUsers.forEach((u, playerIndex) => {
            const val = parseInt(round[playerIndex] || "0", 10);
            if (!isNaN(val)) scoreRows.push({ user_id: u.id, round_number: roundIndex + 1, value: val });
          });
        });
        if (scoreRows.length > 0) await api.submitScores(gameId, scoreRows);
        await api.completeGame(gameId);
      } catch {
        // silent — localStorage already saved it
      }
      setSelectedUsers(null);
    }
  };

  const getEmojiRanking = (roundIndex: number): Record<number, string> => {
    const emojis = ["🟩", "🟦", "🟪", "🟨", "🟧", "🟥"];
    const playerScores = players
      .map((_, i) => ({
        index: i,
        score: calculateCumulativeScore(scores.map((row) => row[i]), roundIndex),
      }))
      .filter(({ index }) => players[index].trim() !== "")
      .sort((a, b) => a.score - b.score);

    const emojiMap: Record<number, string> = {};
    let currentScore = playerScores[0]?.score;
    let currentGroup: typeof playerScores = [];
    let emojiIndex = 0;

    playerScores.forEach((player) => {
      if (player.score === currentScore) {
        currentGroup.push(player);
      } else {
        const emoji = emojis[emojiIndex];
        currentGroup.forEach((p) => { emojiMap[p.index] = emoji; });
        currentGroup = [player];
        currentScore = player.score;
        emojiIndex++;
      }
    });
    if (currentGroup.length > 0) {
      const emoji = emojis[emojiIndex];
      currentGroup.forEach((p) => { emojiMap[p.index] = emoji; });
    }
    return emojiMap;
  };

  const gridCols = `minmax(58px, auto) repeat(${activeCount || 1}, minmax(80px, 1fr))`;

  return (
    <div style={editorialStyles.pageContainer}>
      <div style={editorialStyles.twoColumnGrid(isNarrow)}>
        <section>
          <div style={editorialStyles.eyebrow}>The Scorecard</div>
          <h2 style={editorialStyles.gameTitle}>Rummy</h2>
          <p style={editorialStyles.dek}>
            {activeCount} player{activeCount !== 1 ? "s" : ""} · {roundsPlayed} round{roundsPlayed !== 1 ? "s" : ""} played · lowest score wins
          </p>

          {activeCount === 0 ? (
            <div
              style={{
                marginTop: 36,
                borderTop: `2px solid ${colors.ink}`,
                paddingTop: 36,
              }}
            >
              <div style={editorialStyles.eyebrow}>No game in progress</div>
              <h3
                style={{
                  fontFamily: fonts.serif,
                  fontWeight: 700,
                  fontSize: 30,
                  margin: "12px 0 26px",
                  color: colors.ink,
                }}
              >
                {user ? "Select players to begin" : "Enter player names to begin"}
              </h3>
              {user ? (
                <PlayerSelect
                  maxPlayers={6}
                  onConfirm={(selected) => {
                    setSelectedUsers(selected);
                    const names = Array(6).fill("");
                    selected.forEach((u, i) => { names[i] = u.display_name; });
                    localStorage.setItem(PLAYER_KEY, JSON.stringify(names));
                    setPlayers(names);
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="text"
                    value={draftPlayer}
                    onChange={(e) => setDraftPlayer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                    placeholder="Player 1"
                    style={{
                      ...editorialStyles.addPlayerInput,
                      fontSize: 16,
                      width: 260,
                      textAlign: "center",
                      padding: "13px 16px",
                    }}
                  />
                  <button
                    onClick={addPlayer}
                    style={{ ...editorialStyles.btnPrimary, padding: "14px 22px" }}
                  >
                    Add Player
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 28, borderTop: `2px solid ${colors.ink}` }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: gridCols,
                  marginTop: 0,
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    fontFamily: fonts.franklin,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: colors.faintLabel,
                    padding: "12px 8px 11px 0",
                    borderBottom: `1px solid ${colors.ink}`,
                    alignSelf: "end",
                  }}
                >
                  Round
                </div>
                {activePlayers.map(({ name, index }) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: 6,
                      padding: "12px 6px 11px",
                      borderBottom: `1px solid ${colors.ink}`,
                    }}
                  >
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      style={editorialStyles.playerNameInput}
                    />
                    <button
                      onClick={() => removePlayer(index)}
                      style={{
                        border: "none",
                        background: "none",
                        color: colors.inputBorder,
                        cursor: "pointer",
                        fontSize: 15,
                        lineHeight: 1,
                        padding: 0,
                        flex: "none",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* Round rows */}
                {[...Array(ROUNDS)].map((_, roundIndex) => (
                  <Fragment key={roundIndex}>
                    <div
                      key={`label-${roundIndex}`}
                      style={{
                        fontFamily: fonts.franklin,
                        fontSize: 13,
                        color: "#8a8a8a",
                        padding: "0 8px 0 0",
                        display: "flex",
                        alignItems: "center",
                        borderBottom: `1px solid ${colors.ruleFaint}`,
                        minHeight: 48,
                      }}
                    >
                      {roundIndex + 1}
                    </div>
                    {activePlayers.map(({ index }) => {
                      const cellKey = `${roundIndex}-${index}`;
                      return (
                        <div
                          key={cellKey}
                          style={{
                            borderBottom: `1px solid ${colors.ruleFaint}`,
                            display: "flex",
                            backgroundColor:
                              focusedCell === cellKey ? colors.inputFocus : "transparent",
                          }}
                        >
                          <input
                            type="text"
                            inputMode="numeric"
                            value={scores[roundIndex]?.[index] || ""}
                            onChange={(e) =>
                              handleScoreChange(index, roundIndex, e.target.value)
                            }
                            onFocus={() => setFocusedCell(cellKey)}
                            onBlur={() => setFocusedCell(null)}
                            placeholder="—"
                            style={editorialStyles.scoreInput}
                          />
                        </div>
                      );
                    })}
                  </Fragment>
                ))}

                {/* Totals row */}
                <div
                  style={{
                    fontFamily: fonts.franklin,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: colors.ink,
                    padding: "14px 8px 0 0",
                    display: "flex",
                    alignItems: "center",
                    borderTop: `2px solid ${colors.ink}`,
                  }}
                >
                  Total
                </div>
                {activePlayers.map(({ index }) => {
                  const total = calculateCumulativeScore(
                    scores.map((row) => row[index]),
                    ROUNDS - 1
                  );
                  const isLeader = total === leaderTotal && activeCount > 0;
                  return (
                    <div
                      key={`total-${index}`}
                      style={{
                        fontFamily: fonts.numbers,
                        fontSize: 22,
                        fontWeight: 700,
                        textAlign: "right",
                        padding: "14px 6px 0",
                        borderTop: `2px solid ${colors.ink}`,
                        color: isLeader ? colors.accent : colors.body,
                      }}
                    >
                      {total}
                    </div>
                  );
                })}
              </div>

              {/* Scores on the doors + emoji ranking */}
              {[...Array(ROUNDS)].map((_, roundIndex) => {
                const hasScores = activePlayers.some(
                  ({ index }) => scores[roundIndex]?.[index]?.trim() !== ""
                );
                if (!hasScores) return null;
                const emojiMap = getEmojiRanking(roundIndex);
                return (
                  <div key={`doors-${roundIndex}`} style={{ marginTop: 24 }}>
                    <div
                      style={{
                        fontFamily: fonts.franklin,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: colors.faintLabel,
                        marginBottom: 8,
                      }}
                    >
                      Round {roundIndex + 1} · Scores on the doors
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: gridCols,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: fonts.franklin,
                          fontSize: 13,
                          color: "#8a8a8a",
                          padding: "8px 8px 8px 0",
                          borderBottom: `1px solid ${colors.ruleFaint}`,
                        }}
                      >
                        Cumulative
                      </div>
                      {activePlayers.map(({ index }) => (
                        <div
                          key={index}
                          style={{
                            fontFamily: fonts.numbers,
                            fontSize: 18,
                            textAlign: "right",
                            padding: "8px 6px",
                            borderBottom: `1px solid ${colors.ruleFaint}`,
                          }}
                        >
                          {calculateCumulativeScore(
                            scores.map((row) => row[index]),
                            roundIndex
                          )}
                        </div>
                      ))}
                      <div
                        style={{
                          fontFamily: fonts.franklin,
                          fontSize: 13,
                          color: "#8a8a8a",
                          padding: "8px 8px 8px 0",
                          borderBottom: `1px solid ${colors.ruleFaint}`,
                        }}
                      >
                        Rankings
                      </div>
                      {activePlayers.map(({ index }) => (
                        <div
                          key={index}
                          style={{
                            textAlign: "right",
                            padding: "8px 6px",
                            borderBottom: `1px solid ${colors.ruleFaint}`,
                            fontSize: 18,
                          }}
                        >
                          {emojiMap[index] || ""}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Ranking key */}
              <div
                style={{
                  marginTop: 20,
                  padding: "16px 0",
                  borderTop: `1px solid ${colors.rule}`,
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.franklin,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: colors.faintLabel,
                    marginBottom: 10,
                  }}
                >
                  Score Rankings
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {["🟩", "🟦", "🟪", "🟨", "🟧", "🟥"].map((emoji, i) => (
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
                        {i === 0 ? "Best" : i === 5 ? "Worst" : `${i + 1}${["th", "st", "nd", "rd"][(i + 1) % 10] || "th"}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Finish game */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 16,
                  marginTop: 18,
                }}
              >
                <button onClick={handleFinishGame} style={editorialStyles.btnPrimary}>
                  Finish &amp; Log Game
                </button>
                <span
                  style={{
                    fontFamily: fonts.franklin,
                    fontSize: 13,
                    color: "#8a8a8a",
                  }}
                >
                  Saves this result to the game&apos;s history and starts a fresh card.
                </span>
              </div>

              {/* Add player */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 26,
                }}
              >
                <input
                  type="text"
                  value={draftPlayer}
                  onChange={(e) => setDraftPlayer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                  placeholder="Add another player"
                  style={editorialStyles.addPlayerInput}
                />
                <button onClick={addPlayer} style={editorialStyles.btnOutline}>
                  Add
                </button>
              </div>

              {/* Clear buttons */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 30,
                  paddingTop: 20,
                  borderTop: `1px solid ${colors.rule}`,
                }}
              >
                <button onClick={clearOnlyScores} style={editorialStyles.btnClear}>
                  Clear Scores
                </button>
                <button
                  onClick={handleClearAll}
                  style={editorialStyles.btnDanger}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.accent;
                    e.currentTarget.style.color = colors.paper;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                    e.currentTarget.style.color = colors.accent;
                  }}
                >
                  Clear Players &amp; Scores
                </button>
              </div>
            </div>
          )}

          <GameHistorySection
            history={history}
            onDelete={(id) => setHistory(deleteHistory(HISTORY_KEY, id))}
            onClearHistory={() => setHistory(clearHistory(HISTORY_KEY))}
          />
        </section>

        <StandingsRail standings={standings} gameName="Rummy" history={history} isNarrow={isNarrow} />
      </div>
    </div>
  );
}

export default Rummy;
