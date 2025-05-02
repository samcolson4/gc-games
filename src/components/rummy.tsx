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
    const fullEmojis = ["🟩", "🟦", "🟪", "🟨", "🟧", "🟥"];
    const activePlayersCount = players.filter(name => name).length;
    const emojis = fullEmojis.slice(0, activePlayersCount);
    const cumulativeScores: { index: number; score: number }[] = players
      .map((_, i) => ({
        index: i,
        score: calculateCumulativeScore(scores.map(row => row[i]), roundIndex),
      }))
      .filter(({ score }) => !isNaN(score))
      .sort((a, b) => a.score - b.score);

    const emojiMap: Record<number, string> = {};
    let rank = 0;
    for (let i = 0; i < cumulativeScores.length;) {
      const currentScore = cumulativeScores[i].score;
      const scoreGroup = cumulativeScores.slice(i).filter(r => r.score === currentScore);
      const emoji = emojis[rank] || emojis[emojis.length - 1];
      scoreGroup.forEach(entry => {
        emojiMap[entry.index] = emoji;
      });
      i += scoreGroup.length;
      rank++;
    }

    return (
      <tr>
        <td style={{ textAlign: "right", paddingLeft: "0.5rem" }}>Rankings</td>
        {players.map((name, i) =>
          name ? (
            <td key={i}>{emojiMap[i] || ""}</td>
          ) : null
        )}
      </tr>
    );
  };
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={clearOnlyScores} style={{ marginRight: "1rem" }}>
          Clear Scores
        </button>
        <button
          onClick={() => {
            const { emptyPlayers, emptyScores } = clearPlayersAndScores("rummyPlayers", "rummyScores");
            setPlayers(emptyPlayers);
            setScores(emptyScores);
          }}
        >
          Clear Players &amp; Scores
        </button>
      </div>
      <div>
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
                  style={{
                    backgroundColor: "white",
                    color: "black",
                    border: "1px solid black",
                  }}
                />
              </div>
            );
          }
          return null;
        })}
      </div>

      {players[0] && (
        <div>
          <h2>Enter Scores</h2>
          <table>
            <thead>
              <tr>
                <th></th>
                {players.map((name, i) =>
                  name ? (
                    <th key={i}>
                      <h3>{name}</h3>
                    </th>
                  ) : null,
                )}
              </tr>
            </thead>
            <tbody>
              {[...Array(6)].map((_, roundIndex) => (
                <React.Fragment key={roundIndex}>
                  <tr>
                    <td style={{ textAlign: "right", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}>
                      <strong>Round {roundIndex + 1}</strong>
                    </td>
                    {players.map((name, playerIndex) =>
                      name ? (
                        <td key={playerIndex}>
                          <input
                            type="number"
                            value={scores[roundIndex]?.[playerIndex] || ""}
                            onChange={(e) =>
                              handleScoreChange(playerIndex, roundIndex, e.target.value)
                            }
                            style={{
                              backgroundColor: "white",
                              color: "black",
                              border: "1px solid black",
                            }}
                          />
                        </td>
                      ) : null
                    )}
                  </tr>
                  {players.some((_, playerIndex) => scores[roundIndex][playerIndex].trim() !== "") && (
                    <>
                      <tr>
                        <td style={{ textAlign: "right", paddingLeft: "0.5rem" }} colSpan={1}>Scores on the doors</td>
                        {players.map((name, playerIndex) =>
                          name ? (
                            <td key={playerIndex}>
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
        </div>
      )}
    </div>
  );
}

export default Rummy;
