import React, { useState, useEffect } from "react";
import { calculateCumulativeScore, clearPlayersAndScores, clearScores, getStoredData, updatePlayerName, updateScore } from "../utils/scoreHelpers";

interface Player {
  name: string;
  id: number;
}

const MAX_PLAYERS = 6;
const MAX_SCORE = 200; // Reasonable maximum golf score

function Golf() {
  const [players, setPlayers] = useState<Player[]>(Array(MAX_PLAYERS).fill(null).map((_, i) => ({ name: "", id: i })));
  const [scores, setScores] = useState<string[][]>([]);
  const [numRounds, setNumRounds] = useState<number>(1);

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
      minHeight: "44px", // Better touch target
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
      minHeight: "44px", // Better touch target
    },
    table: {
      borderCollapse: "collapse" as const,
      width: "100%",
      marginTop: "1rem",
      minWidth: "600px", // Minimum width for table
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
    header: {
      marginBottom: "2rem",
      textAlign: "center" as const,
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

  useEffect(() => {
    const { players: storedPlayers, scores: storedScores } = getStoredData("golfPlayers", "golfScores");
    setPlayers(storedPlayers.map((name: string, i: number) => ({ name, id: i })));
    setScores(storedScores);
    setNumRounds(storedScores.length || 1);
  }, []);

  const handleNameChange = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], name };
    updatePlayerName(newPlayers.map(p => p.name), index, name, "golfPlayers");
    setPlayers(newPlayers);
  };

  const handleScoreChange = (
    playerIndex: number,
    roundIndex: number,
    score: string
  ) => {
    // Validate score (allow negative scores)
    const numScore = parseInt(score);
    if (score && (isNaN(numScore) || numScore > MAX_SCORE)) {
      return;
    }

    let updatedScores = [...scores];
    while (updatedScores.length <= roundIndex) {
      updatedScores.push(Array(MAX_PLAYERS).fill(""));
    }
    updatedScores = updateScore(updatedScores, playerIndex, roundIndex, score, "golfScores");
    setScores(updatedScores);
  };

  const addRound = () => {
    setNumRounds(numRounds + 1);
  };

  const deleteRound = (roundIndex: number) => {
    const newScores = scores.filter((_, index) => index !== roundIndex);
    setScores(newScores);
    setNumRounds(numRounds - 1);
  };

  const clearOnlyScores = () => {
    const emptyScores = clearScores("golfScores");
    setScores(emptyScores);
    setNumRounds(1);
  };

  return (
    <div style={styles.container}>
      <div style={styles.buttonContainer}>
        <button onClick={clearOnlyScores} style={styles.button}>
          Clear Scores
        </button>
        <button
          onClick={() => {
            const { emptyPlayers, emptyScores } = clearPlayersAndScores("golfPlayers", "golfScores");
            setPlayers(emptyPlayers.map((name, i) => ({ name, id: i })));
            setScores(emptyScores);
            setNumRounds(1);
          }}
          style={styles.button}
        >
          Clear Players & Scores
        </button>
      </div>

      <div style={styles.playerInputs}>
        <h2>Enter Player Names</h2>
        {players.map((player, i) => {
          if (i === 0 || players[i - 1].name.trim() !== "") {
            return (
              <div key={player.id}>
                <input
                  type="text"
                  placeholder={`Player ${i + 1}`}
                  value={player.name}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  style={styles.input}
                />
              </div>
            );
          }
          return null;
        })}
      </div>

      {players[0].name && (
        <div style={styles.tableContainer}>
          <h2>Enter Scores</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, ...styles.tdFirst, backgroundColor: "#f5f5f5" }}></th>
                {players.map((player) =>
                  player.name ? (
                    <th key={player.id} style={styles.th}>
                      <h3 style={{ margin: 0, fontSize: "1rem" }}>{player.name}</h3>
                    </th>
                  ) : null
                )}
              </tr>
            </thead>
            <tbody>
              {[...Array(numRounds)].map((_, roundIndex) => {
                const hasScores = players.some(
                  (player) =>
                    scores[roundIndex]?.[player.id]?.trim() !== ""
                );
                // Find the last round with scores
                let lastRoundWithScores = -1;
                for (let i = numRounds - 1; i >= 0; i--) {
                  if (players.some((player) => scores[i]?.[player.id]?.trim() !== "")) {
                    lastRoundWithScores = i;
                    break;
                  }
                }
                const isLastRound = roundIndex === lastRoundWithScores;

                return (
                  <React.Fragment key={roundIndex}>
                    <tr>
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
                      {players.map((player) =>
                        player.name ? (
                          <td key={player.id} style={styles.td}>
                            <input
                              type="number"
                              max={MAX_SCORE}
                              value={scores[roundIndex]?.[player.id] || ""}
                              onChange={(e) =>
                                handleScoreChange(player.id, roundIndex, e.target.value)
                              }
                              style={styles.scoreInput}
                            />
                          </td>
                        ) : null
                      )}
                    </tr>
                    {hasScores && (
                      <tr>
                        <td style={isLastRound ? styles.tdFirstSticky : styles.tdFirst}>
                          Total Score
                        </td>
                        {players.map((player) =>
                          player.name ? (
                            <td key={player.id} style={isLastRound ? styles.tdSticky : styles.td}>
                              {calculateCumulativeScore(
                                scores.map(round => round[player.id]),
                                roundIndex
                              )}
                            </td>
                          ) : null
                        )}
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          <button onClick={addRound} style={{ ...styles.button, marginTop: "1rem" }}>
            Add Round
          </button>
        </div>
      )}
    </div>
  );
}

export default Golf;
