import React, { useState, useEffect } from "react";
import {
  getDealerIndex,
  calculateCumulativeScore,
  getStoredData,
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
import { GameType, storageKeys, winConditionPhrase } from "../games/gameTypes";

// Whole numbers, optionally negative; "-" alone is allowed mid-typing.
const SCORE_PATTERN = /^-?\d*$/;

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Pads every round to one cell per player seat.
function padRounds(scores: string[][], seats: number): string[][] {
  return scores.map((row) => Array.from({ length: seats }, (_, i) => row[i] ?? ""));
}

function Scorecard({ game }: { game: GameType }) {
  const { playerKey, playerIdKey, scoreKey, historyKey } = storageKeys(game);
  // One seat per player; an empty name is a vacated seat. playerIds holds the
  // account behind each seat when players were picked from accounts.
  const [players, setPlayers] = useState<string[]>([]);
  const [playerIds, setPlayerIds] = useState<(string | null)[]>([]);
  const [scores, setScores] = useState<string[][]>([[]]);
  const [history, setHistory] = useState<GameHistoryRecord[]>([]);
  const [draftPlayer, setDraftPlayer] = useState("");
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const isNarrow = useNarrowLayout();
  const { user } = useAuth();

  useEffect(() => {
    const { players: storedPlayers, scores: storedScores } = getStoredData(playerKey, scoreKey);
    const storedIds: (string | null)[] = JSON.parse(localStorage.getItem(playerIdKey) || "[]");
    setPlayers(storedPlayers);
    setPlayerIds(storedPlayers.map((_, i) => storedIds[i] ?? null));
    setScores(storedScores.length ? padRounds(storedScores, storedPlayers.length) : [[]]);
    setHistory(getHistory(historyKey));
  }, [playerKey, playerIdKey, scoreKey, historyKey]);

  const numRounds = scores.length;

  const activePlayers = players
    .map((name, index) => ({ name: name.trim(), index }))
    .filter((p) => p.name !== "");

  const activeCount = activePlayers.length;
  const roundsPlayed = scores.filter((round) =>
    round.some((s) => s.trim() !== "")
  ).length;

  const standings = getPlayerTotals(players, scores, game.winCondition).map((p) => ({
    name: p.name,
    total: p.total,
  }));
  const leaderTotal = standings[0]?.total;

  const updatePlayers = (names: string[], ids: (string | null)[]) => {
    setPlayers(names);
    setPlayerIds(ids);
    save(playerKey, names);
    save(playerIdKey, ids);
  };

  const updateScores = (next: string[][]) => {
    setScores(next);
    save(scoreKey, next);
  };

  const handleNameChange = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = name;
    updatePlayers(newPlayers, playerIds);
  };

  const handleScoreChange = (playerIndex: number, roundIndex: number, score: string) => {
    if (!SCORE_PATTERN.test(score)) return;

    let updatedScores = padRounds(scores, players.length);
    updatedScores[roundIndex][playerIndex] = score;

    // Once the last round is filled in for everyone, open the next one.
    const lastRound = updatedScores[updatedScores.length - 1];
    if (
      roundIndex === updatedScores.length - 1 &&
      activePlayers.length > 0 &&
      activePlayers.every(({ index }) => lastRound[index].trim() !== "")
    ) {
      updatedScores = [...updatedScores, Array(players.length).fill("")];
    }
    updateScores(updatedScores);
  };

  const addPlayer = () => {
    const name = draftPlayer.trim();
    if (!name) return;
    const emptyIndex = players.findIndex((p) => p.trim() === "");
    if (emptyIndex === -1) {
      updatePlayers([...players, name], [...playerIds, null]);
      updateScores(padRounds(scores, players.length + 1));
    } else {
      const newIds = [...playerIds];
      newIds[emptyIndex] = null;
      const newPlayers = [...players];
      newPlayers[emptyIndex] = name;
      updatePlayers(newPlayers, newIds);
    }
    setDraftPlayer("");
  };

  const removePlayer = (index: number) => {
    const newPlayers = [...players];
    newPlayers[index] = "";
    const newIds = [...playerIds];
    newIds[index] = null;
    updatePlayers(newPlayers, newIds);
    updateScores(
      padRounds(scores, players.length).map((row) => {
        const updated = [...row];
        updated[index] = "";
        return updated;
      })
    );
  };

  const addRound = () => {
    updateScores([...scores, Array(players.length).fill("")]);
  };

  const removeLastRound = () => {
    if (numRounds <= 1) return;
    updateScores(scores.slice(0, -1));
  };

  const deleteRound = (roundIndex: number) => {
    if (numRounds <= 1) return;
    updateScores(scores.filter((_, i) => i !== roundIndex));
  };

  const clearOnlyScores = () => {
    updateScores([Array(players.length).fill("")]);
  };

  const handleClearAll = () => {
    updatePlayers([], []);
    updateScores([[]]);
  };

  const startWithAccounts = (selected: ApiUser[]) => {
    updatePlayers(
      selected.map((u) => u.display_name),
      selected.map((u) => u.id)
    );
    updateScores([Array(selected.length).fill("")]);
  };

  const handleFinishGame = async () => {
    const finishedPlayers = players;
    const finishedScores = scores;
    const { history: newHistory, clearedScores } = finishGame(
      historyKey,
      scoreKey,
      finishedPlayers,
      finishedScores,
      game.winCondition
    );
    setHistory(newHistory);
    setScores(clearedScores);

    // Also log to Firestore when every seated player is a known account.
    const accountSeats = activePlayers.map(({ index }) => ({ index, id: playerIds[index] }));
    if (!user || accountSeats.length < 2 || accountSeats.some((s) => !s.id)) return;
    try {
      const { id: gameId } = await api.createGame(game.id, accountSeats.map((s) => s.id!));
      const scoreRows: { user_id: string; round_number: number; value: number }[] = [];
      finishedScores.forEach((round, roundIndex) => {
        accountSeats.forEach(({ index, id }) => {
          const val = parseInt(round[index] ?? "", 10);
          if (!isNaN(val)) scoreRows.push({ user_id: id!, round_number: roundIndex + 1, value: val });
        });
      });
      if (scoreRows.length > 0) await api.submitScores(gameId, scoreRows);
      await api.completeGame(gameId);
    } catch {
      // silent — localStorage already saved it
    }
  };

  const gridCols = `minmax(58px, auto) repeat(${activeCount || 1}, minmax(80px, 1fr))`;

  return (
    <div style={editorialStyles.pageContainer}>
      <div style={editorialStyles.twoColumnGrid(isNarrow)}>
        <section>
          <div style={editorialStyles.eyebrow}>The Scorecard</div>
          <h2 style={editorialStyles.gameTitle}>{game.label}</h2>
          <p style={editorialStyles.dek}>
            {activeCount} player{activeCount !== 1 ? "s" : ""} · {roundsPlayed} round{roundsPlayed !== 1 ? "s" : ""} played · {winConditionPhrase(game.winCondition)}
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
                <PlayerSelect onConfirm={startWithAccounts} />
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
              <div style={{ overflowX: "auto" }}>
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
                    {activePlayers.map(({ index }) => {
                      const cellKey = `${roundIndex}-${index}`;
                      return (
                        <div
                          key={cellKey}
                          style={{
                            borderBottom: `1px solid ${colors.ruleFaint}`,
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
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
                            style={{ ...editorialStyles.scoreInput, width: "5ch", flex: "none" }}
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
                {activePlayers.map(({ index }) => {
                  const total = calculateCumulativeScore(
                    scores.map((row) => row[index]),
                    numRounds - 1
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
              </div>

              {/* Next dealer */}
              <div
                style={{
                  marginTop: 12,
                  fontFamily: fonts.franklin,
                  fontSize: 13,
                  color: colors.meta,
                  textAlign: "right",
                }}
              >
                Next dealer:{" "}
                <strong style={{ color: colors.ink }}>
                  {players[getDealerIndex(activePlayers.map((p) => p.index), roundsPlayed)]}
                </strong>
              </div>

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
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                  placeholder="Add another player"
                  style={editorialStyles.addPlayerInput}
                />
                <button onClick={addPlayer} style={editorialStyles.btnOutline}>
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
            onDelete={(id) => setHistory(deleteHistory(historyKey, id))}
            onClearHistory={() => setHistory(clearHistory(historyKey))}
          />
        </section>

        <StandingsRail
          standings={standings}
          gameName={game.label}
          winCondition={game.winCondition}
          history={history}
          isNarrow={isNarrow}
        />
      </div>
    </div>
  );
}

export default Scorecard;
