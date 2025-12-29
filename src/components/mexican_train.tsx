import { useState, useEffect } from "react";
import { calculateCumulativeScore } from "../utils/scoreHelpers";

interface Player {
  name: string;
  id: number;
}

const MAX_SCORE = 200; // Reasonable maximum score

function MexicanTrain() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [scores, setScores] = useState<string[][]>([]);
  const [numRounds, setNumRounds] = useState<number>(1);
  const [nextPlayerId, setNextPlayerId] = useState<number>(0);

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      padding: "1rem",
      maxWidth: "100%",
      margin: "0 auto",
      boxSizing: "border-box" as const,
    },
    button: {
      padding: "0.5rem 1rem",
      margin: "0.5rem",
      backgroundColor: "#4CAF50",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "background-color 0.3s",
      fontSize: "1rem",
      minHeight: "44px",
    },
    input: {
      padding: "0.75rem",
      margin: "0.5rem",
      backgroundColor: "white",
      color: "black",
      border: "1px solid #ccc",
      borderRadius: "4px",
      width: "100%",
      maxWidth: "200px",
      boxSizing: "border-box" as const,
      fontSize: "1rem",
      minHeight: "44px",
    },
    table: {
      borderCollapse: "collapse" as const,
      width: "100%",
      marginTop: "1rem",
      minWidth: "600px",
    },
    th: {
      padding: "0.75rem 0.5rem",
      backgroundColor: "#f5f5f5",
      border: "1px solid #ddd",
      wordBreak: "break-word" as const,
      position: "sticky" as const,
      top: 0,
      zIndex: 10,
      minWidth: "120px",
    },
    td: {
      padding: "0.75rem 0.5rem",
      border: "1px solid #ddd",
      textAlign: "center" as const,
      wordBreak: "break-word" as const,
      minWidth: "120px",
    },
    tdFirst: {
      padding: "0.75rem 0.5rem",
      border: "1px solid #ddd",
      textAlign: "center" as const,
      wordBreak: "break-word" as const,
      position: "sticky" as const,
      left: 0,
      backgroundColor: "white",
      zIndex: 5,
      minWidth: "100px",
      fontWeight: "bold" as const,
    },
    tdSticky: {
      padding: "0.75rem 0.5rem",
      border: "1px solid #ddd",
      textAlign: "center" as const,
      wordBreak: "break-word" as const,
      position: "sticky" as const,
      bottom: 0,
      backgroundColor: "#fff9c4",
      zIndex: 8,
      fontWeight: "bold" as const,
      minWidth: "120px",
    },
    tdFirstSticky: {
      padding: "0.75rem 0.5rem",
      border: "1px solid #ddd",
      textAlign: "center" as const,
      wordBreak: "break-word" as const,
      position: "sticky" as const,
      left: 0,
      bottom: 0,
      backgroundColor: "#fff9c4",
      zIndex: 9,
      fontWeight: "bold" as const,
      minWidth: "100px",
    },
    tableContainer: {
      width: "100%",
      maxWidth: "100%",
      margin: "0 auto",
      overflowX: "auto" as const,
      WebkitOverflowScrolling: "touch" as const,
      position: "relative" as const,
    },
    playerInputs: {
      width: "100%",
      maxWidth: "800px",
      margin: "0 auto",
    },
    buttonContainer: {
      width: "100%",
      maxWidth: "800px",
      margin: "0 auto 2rem auto",
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap" as const,
    },
    scoreInput: {
      padding: "0.75rem",
      margin: "0.25rem",
      backgroundColor: "white",
      color: "black",
      border: "1px solid #ccc",
      borderRadius: "4px",
      width: "100%",
      boxSizing: "border-box" as const,
      fontSize: "1rem",
      minHeight: "44px",
      textAlign: "center" as const,
    },
  };

  // Load from localStorage on mount
  useEffect(() => {
    const storedPlayers = JSON.parse(
      localStorage.getItem("mexicanTrainPlayers") || JSON.stringify([])
    );
    const storedScores = JSON.parse(
      localStorage.getItem("mexicanTrainScores") || JSON.stringify([])
    );

    if (storedPlayers.length > 0) {
      const playersWithIds = storedPlayers.map((name: string, i: number) => ({
        name,
        id: i,
      }));
      setPlayers(playersWithIds);
      setNextPlayerId(storedPlayers.length);
    } else {
      // Start with one empty player
      setPlayers([{ name: "", id: 0 }]);
      setNextPlayerId(1);
    }

    setScores(storedScores);
    setNumRounds(storedScores.length || 1);
  }, []);

  // Save players to localStorage whenever they change
  useEffect(() => {
    if (players.length > 0) {
      localStorage.setItem(
        "mexicanTrainPlayers",
        JSON.stringify(players.map((p) => p.name))
      );
    }
  }, [players]);

  const handleNameChange = (id: number, name: string) => {
    const newPlayers = players.map((p) => (p.id === id ? { ...p, name } : p));

    // If the last player now has content, add a new empty player
    const lastPlayer = newPlayers[newPlayers.length - 1];
    if (lastPlayer && lastPlayer.id === id && name.trim() !== "") {
      const newPlayer: Player = { name: "", id: nextPlayerId };
      newPlayers.push(newPlayer);
      setNextPlayerId(nextPlayerId + 1);
    }

    setPlayers(newPlayers);
  };

  const removePlayer = (id: number) => {
    const newPlayers = players.filter((p) => p.id !== id);
    setPlayers(newPlayers);

    // Remove player's scores from all rounds
    const playerIndex = players.findIndex((p) => p.id === id);
    if (playerIndex !== -1) {
      const newScores = scores.map((round) => {
        const updatedRound = [...round];
        updatedRound.splice(playerIndex, 1);
        return updatedRound;
      });
      setScores(newScores);
      localStorage.setItem("mexicanTrainScores", JSON.stringify(newScores));
    }
  };

  const handleScoreChange = (
    playerId: number,
    roundIndex: number,
    score: string
  ) => {
    const numScore = parseInt(score);
    if (score && (isNaN(numScore) || numScore > MAX_SCORE)) {
      return;
    }

    const playerIndex = players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    let updatedScores = [...scores];
    // Ensure we have enough rounds
    while (updatedScores.length <= roundIndex) {
      updatedScores.push(Array(players.length).fill(""));
    }
    // Ensure each round has enough columns for all players
    updatedScores = updatedScores.map((round) => {
      const newRound = [...round];
      while (newRound.length < players.length) {
        newRound.push("");
      }
      return newRound;
    });

    updatedScores[roundIndex][playerIndex] = score;
    setScores(updatedScores);
    localStorage.setItem("mexicanTrainScores", JSON.stringify(updatedScores));
  };

  const addRound = () => {
    setNumRounds(numRounds + 1);
  };

  const deleteRound = (roundIndex: number) => {
    const newScores = scores.filter((_, index) => index !== roundIndex);
    setScores(newScores);
    setNumRounds(numRounds - 1);
    localStorage.setItem("mexicanTrainScores", JSON.stringify(newScores));
  };

  const clearOnlyScores = () => {
    const emptyScores: string[][] = [];
    setScores(emptyScores);
    setNumRounds(1);
    localStorage.setItem("mexicanTrainScores", JSON.stringify(emptyScores));
  };

  const clearAll = () => {
    setPlayers([{ name: "", id: 0 }]);
    setNextPlayerId(1);
    setScores([]);
    setNumRounds(1);
    localStorage.setItem("mexicanTrainPlayers", JSON.stringify([""]));
    localStorage.setItem("mexicanTrainScores", JSON.stringify([]));
  };

  const activePlayers = players.filter((p) => p.name.trim() !== "");

  return (
    <div style={styles.container}>
      <div style={styles.buttonContainer}>
        <button onClick={clearOnlyScores} style={styles.button}>
          Clear Scores
        </button>
        <button onClick={clearAll} style={styles.button}>
          Clear Players & Scores
        </button>
      </div>

      <div style={styles.playerInputs}>
        <h2>Enter Player Names</h2>
        {players.map((player, i) => {
          if (i === 0 || players[i - 1].name.trim() !== "") {
            return (
              <div
                key={player.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                <input
                  type="text"
                  placeholder={`Player ${i + 1}`}
                  value={player.name}
                  onChange={(e) => handleNameChange(player.id, e.target.value)}
                  style={styles.input}
                />
                {players.length > 1 && (
                  <button
                    onClick={() => removePlayer(player.id)}
                    style={{
                      ...styles.button,
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "#f44336",
                      minWidth: "44px",
                    }}
                    title="Remove player"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>

      {activePlayers.length > 0 && (
        <div style={styles.tableContainer}>
          <h2>Enter Scores</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th
                  style={{
                    ...styles.th,
                    ...styles.tdFirst,
                    backgroundColor: "#f5f5f5",
                  }}
                ></th>
                {activePlayers.map((player) => (
                  <th key={player.id} style={styles.th}>
                    <h3 style={{ margin: 0, fontSize: "1rem" }}>
                      {player.name}
                    </h3>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(numRounds)].map((_, roundIndex) => {
                const hasScores = activePlayers.some((player) => {
                  const playerIndex = players.findIndex((p) => p.id === player.id);
                  return scores[roundIndex]?.[playerIndex]?.trim() !== "";
                });

                // Find the last round with scores
                let lastRoundWithScores = -1;
                for (let i = numRounds - 1; i >= 0; i--) {
                  if (
                    activePlayers.some((player) => {
                      const playerIndex = players.findIndex((p) => p.id === player.id);
                      return scores[i]?.[playerIndex]?.trim() !== "";
                    })
                  ) {
                    lastRoundWithScores = i;
                    break;
                  }
                }
                const isLastRound = roundIndex === lastRoundWithScores;

                return (
                  <>
                    <tr key={`round-${roundIndex}`}>
                      <td style={styles.tdFirst}>
                        Round {roundIndex + 1}
                        <button
                          onClick={() => deleteRound(roundIndex)}
                          style={{
                            ...styles.button,
                            padding: "0.25rem 0.5rem",
                            marginLeft: "0.5rem",
                            backgroundColor: "#f44336",
                            fontSize: "0.9rem",
                            minHeight: "auto",
                          }}
                        >
                          ×
                        </button>
                      </td>
                      {activePlayers.map((player) => {
                        const playerIndex = players.findIndex((p) => p.id === player.id);
                        return (
                          <td key={player.id} style={styles.td}>
                            <input
                              type="number"
                              max={MAX_SCORE}
                              value={scores[roundIndex]?.[playerIndex] || ""}
                              onChange={(e) =>
                                handleScoreChange(
                                  player.id,
                                  roundIndex,
                                  e.target.value
                                )
                              }
                              style={styles.scoreInput}
                            />
                          </td>
                        );
                      })}
                    </tr>
                    {hasScores && (
                      <tr key={`total-${roundIndex}`}>
                        <td
                          style={
                            isLastRound ? styles.tdFirstSticky : styles.tdFirst
                          }
                        >
                          Total Score
                        </td>
                        {activePlayers.map((player) => {
                          const playerIndex = players.findIndex(
                            (p) => p.id === player.id
                          );
                          return (
                            <td
                              key={player.id}
                              style={isLastRound ? styles.tdSticky : styles.td}
                            >
                              {calculateCumulativeScore(
                                scores.map((round) => round[playerIndex]),
                                roundIndex
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
          <button
            onClick={addRound}
            style={{ ...styles.button, marginTop: "1rem" }}
          >
            Add Round
          </button>
        </div>
      )}
    </div>
  );
}

export default MexicanTrain;
