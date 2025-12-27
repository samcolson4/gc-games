import { useState, useEffect } from "react";
import React from "react";
import {
  updatePlayerName,
  updateScore,
  clearScores,
  calculateCumulativeScore,
  getStoredData,
  clearPlayersAndScores,
} from "../utils/scoreHelpers";

function RummyMobile() {
  const [players, setPlayers] = useState<string[]>(Array(6).fill(""));
  const [scores, setScores] = useState<string[][]>(
    Array(6)
      .fill(null)
      .map(() => Array(6).fill("")),
  );

  useEffect(() => {
    const { players: initialPlayers, scores: initialScores } = getStoredData(
      "rummyPlayers",
      "rummyScores",
    );
    setPlayers(initialPlayers);

    const validScores = Array(6)
      .fill(null)
      .map((_, i) =>
        Array(6)
          .fill("")
          .map((_, j) => initialScores?.[i]?.[j] || ""),
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
    const newScores = updateScore(
      scores,
      playerIndex,
      roundIndex,
      score,
      "rummyScores",
    );
    setScores(newScores);
  };

  const clearOnlyScores = () => {
    const emptyScores = clearScores("rummyScores");
    setScores(emptyScores);
  };

  // Get emoji for player ranking in a round
  const getPlayerEmoji = (playerIndex: number, roundIndex: number) => {
    const emojis = ["🟩", "🟦", "🟪", "🟨", "🟧", "🟥"];

    const playerScores = players
      .map((_, i) => ({
        index: i,
        score: calculateCumulativeScore(
          scores.map((row) => row[i]),
          roundIndex,
        ),
      }))
      .filter(({ score }) => !isNaN(score))
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
    round.some((score) => score.trim() !== ""),
  );

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100vw",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: "0.75rem",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "1rem",
          paddingTop: "0.5rem",
        }}
      >
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "1.75rem" }}>Rummy</h1>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={clearOnlyScores}
          style={{
            flex: "1",
            minWidth: "140px",
            padding: "0.75rem",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.9rem",
            fontWeight: "600",
            cursor: "pointer",
            minHeight: "44px",
          }}
        >
          Clear Scores
        </button>
        <button
          onClick={() => {
            const { emptyPlayers, emptyScores } = clearPlayersAndScores(
              "rummyPlayers",
              "rummyScores",
            );
            setPlayers(emptyPlayers);
            setScores(emptyScores);
          }}
          style={{
            flex: "1",
            minWidth: "140px",
            padding: "0.75rem",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.9rem",
            fontWeight: "600",
            cursor: "pointer",
            minHeight: "44px",
          }}
        >
          Clear All
        </button>
      </div>

      {/* Player Names Section */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "1rem",
          marginBottom: "1rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h2
          style={{
            margin: "0 0 0.75rem 0",
            fontSize: "1.25rem",
            fontWeight: "600",
          }}
        >
          Players
        </h2>
        {players.map((name, i) => {
          if (i === 0 || players[i - 1].trim() !== "") {
            return (
              <div key={i} style={{ marginBottom: "0.5rem" }}>
                <input
                  type="text"
                  placeholder={`Player ${i + 1}`}
                  value={name}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    fontSize: "1rem",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    minHeight: "44px",
                  }}
                />
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Rounds Section */}
      {activePlayers.length > 0 && (
        <div>
          <h2
            style={{
              margin: "0 0 0.75rem 0",
              fontSize: "1.25rem",
              fontWeight: "600",
              paddingLeft: "0.25rem",
            }}
          >
            Rounds
          </h2>

          {[...Array(6)].map((_, roundIndex) => {
            const roundScores = scores[roundIndex] || [];
            const hasScores = roundScores.some((score) => score.trim() !== "");

            // Find the last round with scores
            let lastRoundWithScores = -1;
            for (let i = 5; i >= 0; i--) {
              if (
                players.some(
                  (_, playerIndex) => scores[i]?.[playerIndex]?.trim() !== "",
                )
              ) {
                lastRoundWithScores = i;
                break;
              }
            }
            const isLastRound = roundIndex === lastRoundWithScores;

            return (
              <div
                key={roundIndex}
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "1rem",
                  marginBottom: "1rem",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  border:
                    isLastRound && hasScores
                      ? "2px solid #4CAF50"
                      : "1px solid #e0e0e0",
                }}
              >
                {/* Round Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                    paddingBottom: "0.5rem",
                    borderBottom: "2px solid #f0f0f0",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.1rem",
                      fontWeight: "600",
                    }}
                  >
                    Round {roundIndex + 1}
                  </h3>
                  {hasScores && (
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#666",
                        fontWeight: "500",
                      }}
                    >
                      {isLastRound && "Current"}
                    </span>
                  )}
                </div>

                {/* Players in Round */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {activePlayers.map((playerName, playerIndex) => {
                    const originalIndex = players.indexOf(playerName);
                    const score = roundScores[originalIndex] || "";
                    const cumulativeScore = hasScores
                      ? calculateCumulativeScore(
                          scores.map((row) => row[originalIndex]),
                          roundIndex,
                        )
                      : null;
                    const emoji = hasScores
                      ? getPlayerEmoji(originalIndex, roundIndex)
                      : "";

                    return (
                      <div
                        key={originalIndex}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                          padding: "0.75rem",
                          backgroundColor: "#fafafa",
                          borderRadius: "8px",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        {/* Player Name and Emoji */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.25rem",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "600",
                              fontSize: "0.95rem",
                              color: "#333",
                            }}
                          >
                            {playerName}
                          </span>
                          {emoji && (
                            <span style={{ fontSize: "1.2rem" }}>{emoji}</span>
                          )}
                        </div>

                        {/* Score Input */}
                        <input
                          type="number"
                          placeholder="Score"
                          value={score}
                          onChange={(e) =>
                            handleScoreChange(
                              originalIndex,
                              roundIndex,
                              e.target.value,
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "0.625rem",
                            fontSize: "1rem",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                            boxSizing: "border-box",
                            minHeight: "44px",
                            textAlign: "center",
                            backgroundColor: "white",
                          }}
                        />

                        {/* Cumulative Score */}
                        {cumulativeScore !== null && (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginTop: "0.25rem",
                              paddingTop: "0.5rem",
                              borderTop: "1px solid #e0e0e0",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.85rem",
                                color: "#666",
                                fontWeight: "500",
                              }}
                            >
                              Total:
                            </span>
                            <span
                              style={{
                                fontSize: "1rem",
                                fontWeight: "600",
                                color: "#333",
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
              </div>
            );
          })}
        </div>
      )}

      {/* Ranking Legend */}
      {hasAnyScores && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "1rem",
            marginTop: "1rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              margin: "0 0 0.75rem 0",
              fontSize: "1.1rem",
              fontWeight: "600",
            }}
          >
            Rankings
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.5rem",
            }}
          >
            {["🟩", "🟦", "🟪", "🟨", "🟧", "🟥"].map((emoji, index) => (
              <div
                key={emoji}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>{emoji}</span>
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

      {/* Bottom padding for scroll */}
      <div style={{ height: "2rem" }} />
    </div>
  );
}

export default RummyMobile;
