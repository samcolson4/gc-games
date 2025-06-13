import { useState, useEffect } from "react";
import React from "react";
import { updatePlayerName,
  updateScore,
  clearScores,
  calculateCumulativeScore,
  getStoredData,
  clearPlayersAndScores} from "../utils/scoreHelpers";

function Rummy() {
  const [players, setPlayers] = useState<string[]>(Array(6).fill(""));
  const [scores, setScores] = useState<string[][]>(
    Array(6)
      .fill(null)
      .map(() => Array(6).fill("")),
  );

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
    const { players: initialPlayers, scores: initialScores } = getStoredData("rummyPlayers", "rummyScores");
    setPlayers(initialPlayers);

    const validScores = Array(6).fill(null).map((_, i) =>
      Array(6).fill("").map((_, j) => initialScores?.[i]?.[j] || "")
    );
    setScores(validScores);
  }, []);

  const handleNameChange = (index: number, name: string) => {
    const newPlayers = updatePlayerName(players, index, name, "rummyPlayers");
    setPlayers(newPlayers);
  };

  const handleScoreChange = (
    playerIndex: number,
    roundIndex: number,
    score: string,
  ) => {
    const newScores = updateScore(scores, playerIndex, roundIndex, score, "rummyScores");
    setScores(newScores);
  };

  const clearOnlyScores = () => {
    const emptyScores = clearScores("rummyScores");
    setScores(emptyScores);
  };

  // Emoji ranking row for each round
  const getEmojiRankingRow = (roundIndex: number) => {
    const emojis = ["🟩", "🟦", "🟪", "🟨", "🟧", "🟥"];

    // Get scores for each player and sort them
    const playerScores = players
      .map((_, i) => ({
        index: i,
        score: calculateCumulativeScore(scores.map(row => row[i]), roundIndex),
      }))
      .filter(({ score }) => !isNaN(score))
      .sort((a, b) => a.score - b.score);

    // Create a map of player index to emoji
    const emojiMap: Record<number, string> = {};

    // Group players by score
    let currentScore = playerScores[0]?.score;
    let currentGroup: typeof playerScores = [];
    let emojiIndex = 0;

    playerScores.forEach((player) => {
      if (player.score === currentScore) {
        currentGroup.push(player);
      } else {
        // Assign the same emoji to all players in the group
        const emoji = emojis[emojiIndex];
        currentGroup.forEach(p => {
          emojiMap[p.index] = emoji;
        });

        // Move to next group
        currentGroup = [player];
        currentScore = player.score;
        emojiIndex++;
      }
    });

    // Handle the last group
    if (currentGroup.length > 0) {
      const emoji = emojis[emojiIndex];
      currentGroup.forEach(p => {
        emojiMap[p.index] = emoji;
      });
    }

    return (
      <tr>
        <td style={styles.td}>Rankings</td>
        {players.map((name, i) =>
          name ? (
            <td key={i} style={styles.td}>{emojiMap[i] || ""}</td>
          ) : null
        )}
      </tr>
    );
  };

  const RankingKey = () => (
    <div style={{
      marginTop: "1rem",
      padding: "1rem",
      backgroundColor: "#f5f5f5",
      borderRadius: "4px",
      border: "1px solid #ddd",
      width: "100%",
      maxWidth: "800px",
      marginLeft: "auto",
      marginRight: "auto",
    }}>
      <h3 style={{ margin: "0 0 0.5rem 0" }}>Score Rankings</h3>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {["🟩", "🟦", "🟪", "🟨", "🟧", "🟥"].map((emoji, index) => (
          <div key={emoji} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>{emoji}</span>
            <span>{index === 0 ? "Best" : index === 5 ? "Worst" : `${index + 1}${getOrdinalSuffix(index + 1)}`}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <div style={styles.container}>
      <div style={styles.buttonContainer}>
        <button onClick={clearOnlyScores} style={styles.button}>
          Clear Scores
        </button>
        <button
          onClick={() => {
            const { emptyPlayers, emptyScores } = clearPlayersAndScores("rummyPlayers", "rummyScores");
            setPlayers(emptyPlayers);
            setScores(emptyScores);
          }}
          style={styles.button}
        >
          Clear Players & Scores
        </button>
      </div>
      <div style={styles.playerInputs}>
        <h2>Enter Player Names</h2>
        {players.map((name, i) => {
          if (i === 0 || players[i - 1].trim() !== "") {
            return (
              <div key={i}>
                <input
                  type="text"
                  placeholder={`Player ${i + 1}`}
                  value={name}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  style={styles.input}
                />
              </div>
            );
          }
          return null;
        })}
      </div>

      {players[0] && (
        <div style={styles.tableContainer}>
          <h2>Enter Scores</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "100px" }}></th>
                {players.map((name, i) =>
                  name ? (
                    <th key={i} style={styles.th}>
                      <h3 style={{ margin: 0 }}>{name}</h3>
                    </th>
                  ) : null,
                )}
              </tr>
            </thead>
            <tbody>
              {[...Array(6)].map((_, roundIndex) => (
                <React.Fragment key={roundIndex}>
                  <tr>
                    <td style={styles.td}>
                      <strong>Round {roundIndex + 1}</strong>
                    </td>
                    {players.map((name, playerIndex) =>
                      name ? (
                        <td key={playerIndex} style={styles.td}>
                          <input
                            type="number"
                            value={scores[roundIndex]?.[playerIndex] || ""}
                            onChange={(e) =>
                              handleScoreChange(playerIndex, roundIndex, e.target.value)
                            }
                            style={styles.input}
                          />
                        </td>
                      ) : null
                    )}
                  </tr>
                  {players.some((_, playerIndex) => scores[roundIndex][playerIndex].trim() !== "") && (
                    <>
                      <tr>
                        <td style={styles.td}>Scores on the doors</td>
                        {players.map((name, playerIndex) =>
                          name ? (
                            <td key={playerIndex} style={styles.td}>
                              {
                                calculateCumulativeScore(scores.map(row => row[playerIndex]), roundIndex)
                              }
                            </td>
                          ) : null
                        )}
                      </tr>
                      {getEmojiRankingRow(roundIndex)}
                    </>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <RankingKey />
        </div>
      )}
    </div>
  );
}

export default Rummy;
