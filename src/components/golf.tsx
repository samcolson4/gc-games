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
    },
    input: {
      padding: "0.5rem",
      margin: "0.5rem",
      backgroundColor: "white",
      color: "black",
      border: "1px solid #ccc",
      borderRadius: "4px",
      width: "100%",
      maxWidth: "200px",
      boxSizing: "border-box" as const,
    },
    table: {
      borderCollapse: "collapse" as const,
      width: "100%",
      marginTop: "1rem",
      tableLayout: "fixed" as const,
    },
    th: {
      padding: "0.5rem",
      backgroundColor: "#f5f5f5",
      border: "1px solid #ddd",
      wordBreak: "break-word" as const,
    },
    td: {
      padding: "0.5rem",
      border: "1px solid #ddd",
      textAlign: "center" as const,
      wordBreak: "break-word" as const,
    },
    header: {
      marginBottom: "2rem",
      textAlign: "center" as const,
    },
    tableContainer: {
      width: "100%",
      maxWidth: "800px",
      margin: "0 auto",
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
    // Validate score
    const numScore = parseInt(score);
    if (score && (isNaN(numScore) || numScore < 0 || numScore > MAX_SCORE)) {
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
                <th style={{ ...styles.th, width: "100px" }}></th>
                {players.map((player) =>
                  player.name ? (
                    <th key={player.id} style={styles.th}>
                      <h3 style={{ margin: 0 }}>{player.name}</h3>
                    </th>
                  ) : null
                )}
              </tr>
            </thead>
            <tbody>
              {[...Array(numRounds)].map((_, roundIndex) => (
                <React.Fragment key={roundIndex}>
                  <tr>
                    <td style={styles.td}>
                      Round {roundIndex + 1}
                      <button
                        onClick={() => deleteRound(roundIndex)}
                        style={{
                          ...styles.button,
                          padding: "0.25rem 0.5rem",
                          marginLeft: "0.5rem",
                          backgroundColor: "#f44336",
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
                            min="0"
                            max={MAX_SCORE}
                            value={scores[roundIndex]?.[player.id] || ""}
                            onChange={(e) =>
                              handleScoreChange(player.id, roundIndex, e.target.value)
                            }
                            style={styles.input}
                          />
                        </td>
                      ) : null
                    )}
                  </tr>
                  {players.some(
                    (player) =>
                      scores[roundIndex]?.[player.id]?.trim() !== ""
                  ) && (
                    <tr>
                      <td style={styles.td}>Total Score</td>
                      {players.map((player) =>
                        player.name ? (
                          <td key={player.id} style={styles.td}>
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
              ))}
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
