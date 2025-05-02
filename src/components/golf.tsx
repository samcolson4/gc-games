import React, { useState, useEffect } from "react";
import { calculateCumulativeScore, clearPlayersAndScores, clearScores, getStoredData, updatePlayerName, updateScore } from "../utils/scoreHelpers";

function Golf() {
  const [players, setPlayers] = useState<string[]>(Array(6).fill(""));
  const [scores, setScores] = useState<string[][]>([]);
  const [numRounds, setNumRounds] = useState<number>(1);

  useEffect(() => {
    const { players: storedPlayers, scores: storedScores } = getStoredData("golfPlayers", "golfScores");
    setPlayers(storedPlayers);
    setScores(storedScores);
    setNumRounds(storedScores.length || 1);
  }, []);

  const handleNameChange = (index: number, name: string) => {
    const newPlayers = updatePlayerName(players, index, name, "golfPlayers");
    setPlayers(newPlayers);
  };

  const handleScoreChange = (
    playerIndex: number,
    roundIndex: number,
    score: string
  ) => {
    // Ensure scores array has enough rounds
    let updatedScores = [...scores];
    while (updatedScores.length <= roundIndex) {
      updatedScores.push(Array(6).fill(""));
    }
    updatedScores = updateScore(updatedScores, playerIndex, roundIndex, score, "golfScores");
    setScores(updatedScores);
  };

  const addRound = () => {
    setNumRounds(numRounds + 1);
  };

  const clearOnlyScores = () => {
    const emptyScores = clearScores("golfScores");
    setScores(emptyScores);
    setNumRounds(1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={clearOnlyScores} style={{ marginRight: "1rem" }}>
          Clear Scores
        </button>
        <button
          onClick={() => {
            const { emptyPlayers, emptyScores } = clearPlayersAndScores("golfPlayers", "golfScores");
            setPlayers(emptyPlayers);
            setScores(emptyScores);
            setNumRounds(1);
          }}
        >
          Clear Players & Scores
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
                  name ? <th key={i}><h3>{name}</h3></th> : null
                )}
              </tr>
            </thead>
            <tbody>
              {[...Array(numRounds)].map((_, roundIndex) => (
                <React.Fragment key={roundIndex}>
                  <tr>
                    <td>Round {roundIndex + 1}</td>
                    {players.map((name, playerIndex) =>
                      name ? (
                        <td key={playerIndex}>
                          <input
                            type="number"
                            value={
                              scores[roundIndex]?.[playerIndex] || ""
                            }
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
                  {players.some(
                    (_, playerIndex) =>
                      scores[roundIndex]?.[playerIndex]?.trim() !== ""
                  ) && (
                    <tr>
                      <td>Scores on the doors</td>
                      {players.map((name, playerIndex) =>
                        name ? (
                          <td key={playerIndex}>
                            {calculateCumulativeScore(
                              scores.map(round => round[playerIndex]),
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
          <button onClick={addRound} style={{ marginTop: "1rem" }}>
            Add Round
          </button>
        </div>
      )}
    </div>
  );
}

export default Golf;
