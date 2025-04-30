import { useState } from "react";
import React from "react";

function Rummy() {
  const [players, setPlayers] = useState<string[]>(Array(6).fill(""));
  const [scores, setScores] = useState<string[][]>(
    Array(6)
      .fill(null)
      .map(() => Array(6).fill("")),
  );

  const handleNameChange = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = name;
    setPlayers(newPlayers);
  };

  const handleScoreChange = (
    playerIndex: number,
    roundIndex: number,
    score: string,
  ) => {
    const newScores = scores.map((row) => [...row]);
    newScores[playerIndex][roundIndex] = score;
    setScores(newScores);
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
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
                    <td>Round {roundIndex + 1}</td>
                    {players.map((name, playerIndex) =>
                      name ? (
                        <td key={playerIndex}>
                          <input
                            type="number"
                            value={scores[playerIndex][roundIndex]}
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
                  {players.some((_, playerIndex) => scores[playerIndex][roundIndex].trim() !== "") && (
                    <tr>
                      <td>Scores on the doors</td>
                      {players.map((name, playerIndex) =>
                        name ? (
                          <td key={playerIndex}>
                            {
                              scores[playerIndex]
                                .slice(0, roundIndex + 1)
                                .reduce((acc, val) => acc + (parseInt(val) || 0), 0)
                            }
                          </td>
                        ) : null
                      )}
                    </tr>
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
