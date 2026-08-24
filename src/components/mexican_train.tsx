import React, { useState, useEffect } from "react";
import {
  calculateCumulativeScore,
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

const PLAYER_KEY = "mexicanTrainPlayers";
const SCORE_KEY = "mexicanTrainScores";
const HISTORY_KEY = "mexicanTrainHistory";
const MAX_SCORE = 200;

interface Player {
  name: string;
  id: number;
}

function MexicanTrain() {
  const [players, setPlayers] = useState<Player[]>([{ name: "", id: 0 }]);
  const [scores, setScores] = useState<string[][]>([]);
  const [numRounds, setNumRounds] = useState(1);
  const [nextPlayerId, setNextPlayerId] = useState(1);
  const [history, setHistory] = useState<GameHistoryRecord[]>([]);
  const [draftPlayer, setDraftPlayer] = useState("");
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<ApiUser[] | null>(null);
  const isNarrow = useNarrowLayout();
  const { user } = useAuth();

  useEffect(() => {
    const storedPlayers = JSON.parse(
      localStorage.getItem(PLAYER_KEY) || JSON.stringify([])
    );
    const storedScores = JSON.parse(
      localStorage.getItem(SCORE_KEY) || JSON.stringify([])
    );

    if (storedPlayers.length > 0) {
      const playersWithIds = storedPlayers.map((name: string, i: number) => ({
        name,
        id: i,
      }));
      setPlayers(playersWithIds);
      setNextPlayerId(storedPlayers.length);
    } else {
      setPlayers([{ name: "", id: 0 }]);
      setNextPlayerId(1);
    }

    setScores(storedScores.length ? storedScores : [[]]);
    setNumRounds(storedScores.length || 1);
    setHistory(getHistory(HISTORY_KEY));
  }, []);

  useEffect(() => {
    if (players.length > 0) {
      localStorage.setItem(
        PLAYER_KEY,
        JSON.stringify(players.map((p) => p.name))
      );
    }
  }, [players]);

  const activePlayers = players.filter((p) => p.name.trim() !== "");
  const activeCount = activePlayers.length;
  const roundsPlayed = scores.filter((round) =>
    round.some((s) => s.trim() !== "")
  ).length;

  const playerNames = players.map((p) => p.name);
  const standings = getPlayerTotals(playerNames, scores).map((p) => ({
    name: p.name,
    total: p.total,
  }));
  const leaderTotal = standings[0]?.total;

  const handleNameChange = (id: number, name: string) => {
    const newPlayers = players.map((p) => (p.id === id ? { ...p, name } : p));
    const lastPlayer = newPlayers[newPlayers.length - 1];
    if (lastPlayer && lastPlayer.id === id && name.trim() !== "") {
      newPlayers.push({ name: "", id: nextPlayerId });
      setNextPlayerId(nextPlayerId + 1);
    }
    setPlayers(newPlayers);
  };

  const addPlayerFromDraft = () => {
    const name = draftPlayer.trim();
    if (!name) return;
    const emptyPlayer = players.find((p) => p.name.trim() === "");
    if (emptyPlayer) {
      handleNameChange(emptyPlayer.id, name);
    } else {
      const newId = nextPlayerId;
      setPlayers([...players.filter((p) => p.name.trim() !== ""), { name, id: newId }, { name: "", id: newId + 1 }]);
      setNextPlayerId(newId + 2);
    }
    setDraftPlayer("");
  };

  const removePlayer = (id: number) => {
    const playerIndex = players.findIndex((p) => p.id === id);
    if (playerIndex === -1) return;
    const newPlayers = players.filter((p) => p.id !== id);
    if (newPlayers.length === 0 || newPlayers.every((p) => p.name.trim() !== "")) {
      newPlayers.push({ name: "", id: nextPlayerId });
      setNextPlayerId((n) => n + 1);
    }
    setPlayers(newPlayers);

    const newScores = scores.map((round) => {
      const updatedRound = [...round];
      updatedRound.splice(playerIndex, 1);
      return updatedRound;
    });
    setScores(newScores);
    localStorage.setItem(SCORE_KEY, JSON.stringify(newScores));
  };

  const handleScoreChange = (playerId: number, roundIndex: number, score: string) => {
    const numScore = parseInt(score);
    if (score && (isNaN(numScore) || numScore > MAX_SCORE)) return;

    const playerIndex = players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    let updatedScores = [...scores];
    while (updatedScores.length <= roundIndex) {
      updatedScores.push(Array(players.length).fill(""));
    }
    updatedScores = updatedScores.map((round) => {
      const newRound = [...round];
      while (newRound.length < players.length) {
        newRound.push("");
      }
      return newRound;
    });

    updatedScores[roundIndex][playerIndex] = score;
    setScores(updatedScores);
    localStorage.setItem(SCORE_KEY, JSON.stringify(updatedScores));
  };

  const addRound = () => {
    setNumRounds((n) => n + 1);
    setScores((prev) => [...prev, Array(players.length).fill("")]);
  };

  const removeLastRound = () => {
    if (numRounds <= 1) return;
    const newScores = scores.slice(0, -1);
    setScores(newScores);
    setNumRounds(numRounds - 1);
    localStorage.setItem(SCORE_KEY, JSON.stringify(newScores));
  };

  const deleteRound = (roundIndex: number) => {
    if (numRounds <= 1) return;
    const newScores = scores.filter((_, i) => i !== roundIndex);
    setScores(newScores);
    setNumRounds(numRounds - 1);
    localStorage.setItem(SCORE_KEY, JSON.stringify(newScores));
  };

  const clearOnlyScores = () => {
    setScores([]);
    setNumRounds(1);
    localStorage.setItem(SCORE_KEY, JSON.stringify([]));
  };

  const clearAll = () => {
    setPlayers([{ name: "", id: 0 }]);
    setNextPlayerId(1);
    setScores([]);
    setNumRounds(1);
    localStorage.setItem(PLAYER_KEY, JSON.stringify([""]));
    localStorage.setItem(SCORE_KEY, JSON.stringify([]));
  };

  const handleFinishGame = async () => {
    const { history: newHistory, clearedScores } = finishGame(
      HISTORY_KEY,
      SCORE_KEY,
      playerNames,
      scores
    );
    setHistory(newHistory);
    setScores(clearedScores.length ? clearedScores : [Array(players.length).fill("")]);
    setNumRounds(clearedScores.length || 1);

    if (user && selectedUsers) {
      try {
        const { id: gameId } = await api.createGame("mexican_train", selectedUsers.map((u) => u.id));
        const scoreRows: { user_id: string; round_number: number; value: number }[] = [];
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

  const gridCols = `minmax(58px, auto) repeat(${activeCount || 1}, minmax(80px, 1fr))`;

  return (
    <div style={editorialStyles.pageContainer}>
      <div style={editorialStyles.twoColumnGrid(isNarrow)}>
        <section>
          <div style={editorialStyles.eyebrow}>The Scorecard</div>
          <h2 style={editorialStyles.gameTitle}>Mexican Train</h2>
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
                  onConfirm={(selected) => {
                    setSelectedUsers(selected);
                    const newPlayers = selected.map((u, i) => ({ name: u.display_name, id: i }));
                    newPlayers.push({ name: "", id: selected.length });
                    setPlayers(newPlayers);
                    setNextPlayerId(selected.length + 1);
                    localStorage.setItem(PLAYER_KEY, JSON.stringify(newPlayers.map((p) => p.name)));
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
                  onKeyDown={(e) => e.key === "Enter" && addPlayerFromDraft()}
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
                  onClick={addPlayerFromDraft}
                  style={{ ...editorialStyles.btnPrimary, padding: "14px 22px" }}
                >
                  Add Player
                </button>
              </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 28, borderTop: `2px solid ${colors.ink}` }}>
              <div style={{ display: "grid", gridTemplateColumns: gridCols }}>
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
                {activePlayers.map((player) => (
                  <div
                    key={player.id}
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
                      value={player.name}
                      onChange={(e) => handleNameChange(player.id, e.target.value)}
                      style={editorialStyles.playerNameInput}
                    />
                    <button
                      onClick={() => removePlayer(player.id)}
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

                {[...Array(numRounds)].map((_, roundIndex) => (
                  <React.Fragment key={roundIndex}>
                    <div
                      style={{
                        fontFamily: fonts.franklin,
                        fontSize: 13,
                        color: "#8a8a8a",
                        padding: "0 8px 0 0",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        borderBottom: `1px solid ${colors.ruleFaint}`,
                        minHeight: 48,
                      }}
                    >
                      {roundIndex + 1}
                      {numRounds > 1 && (
                        <button
                          onClick={() => deleteRound(roundIndex)}
                          style={{
                            border: "none",
                            background: "none",
                            color: colors.inputBorder,
                            cursor: "pointer",
                            fontSize: 15,
                            padding: 0,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {activePlayers.map((player) => {
                      const cellKey = `${roundIndex}-${player.id}`;
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
                            value={
                              scores[roundIndex]?.[
                                players.findIndex((p) => p.id === player.id)
                              ] || ""
                            }
                            onChange={(e) =>
                              handleScoreChange(player.id, roundIndex, e.target.value)
                            }
                            onFocus={() => setFocusedCell(cellKey)}
                            onBlur={() => setFocusedCell(null)}
                            placeholder="—"
                            style={editorialStyles.scoreInput}
                          />
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}

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
                {activePlayers.map((player) => {
                  const playerIndex = players.findIndex((p) => p.id === player.id);
                  const total = calculateCumulativeScore(
                    scores.map((row) => row[playerIndex]),
                    numRounds - 1
                  );
                  const isLeader = total === leaderTotal && activeCount > 0;
                  return (
                    <div
                      key={`total-${player.id}`}
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

              {[...Array(numRounds)].map((_, roundIndex) => {
                const hasScores = activePlayers.some((player) => {
                  const playerIndex = players.findIndex((p) => p.id === player.id);
                  return scores[roundIndex]?.[playerIndex]?.trim() !== "";
                });
                if (!hasScores) return null;
                return (
                  <div key={`cumulative-${roundIndex}`} style={{ marginTop: 16 }}>
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
                      Round {roundIndex + 1} · Total Score
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: gridCols }}>
                      <div style={{ padding: "8px 8px 8px 0", borderBottom: `1px solid ${colors.ruleFaint}`, fontFamily: fonts.franklin, fontSize: 13, color: "#8a8a8a" }}>
                        Cumulative
                      </div>
                      {activePlayers.map((player) => {
                        const playerIndex = players.findIndex((p) => p.id === player.id);
                        return (
                          <div
                            key={player.id}
                            style={{
                              fontFamily: fonts.numbers,
                              fontSize: 18,
                              textAlign: "right",
                              padding: "8px 6px",
                              borderBottom: `1px solid ${colors.ruleFaint}`,
                            }}
                          >
                            {calculateCumulativeScore(
                              scores.map((row) => row[playerIndex]),
                              roundIndex
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 24,
                }}
              >
                <button onClick={addRound} style={editorialStyles.btnPrimary}>
                  + Add Round
                </button>
                <button onClick={removeLastRound} style={editorialStyles.btnOutline}>
                  Remove Last Round
                </button>
              </div>

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
                <span style={{ fontFamily: fonts.franklin, fontSize: 13, color: "#8a8a8a" }}>
                  Saves this result to the game&apos;s history and starts a fresh card.
                </span>
              </div>

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
                  onKeyDown={(e) => e.key === "Enter" && addPlayerFromDraft()}
                  placeholder="Add another player"
                  style={editorialStyles.addPlayerInput}
                />
                <button onClick={addPlayerFromDraft} style={editorialStyles.btnOutline}>
                  Add
                </button>
              </div>

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
                  onClick={clearAll}
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

        <StandingsRail standings={standings} gameName="Mexican Train" history={history} isNarrow={isNarrow} />
      </div>
    </div>
  );
}

export default MexicanTrain;
