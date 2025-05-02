import React, { useState, useEffect } from "react";

function Golf() {
  const [players, setPlayers] = useState<string[]>(Array(6).fill(""));
  const [scores, setScores] = useState<string[][]>([]);
  const [numRounds, setNumRounds] = useState<number>(1);

  useEffect(() => {
    const storedPlayers = localStorage.getItem("golfPlayers");
    const storedScores = localStorage.getItem("golfScores");

    if (storedPlayers) {
      setPlayers(JSON.parse(storedPlayers));
    }

    if (storedScores) {
      setScores(JSON.parse(storedScores));
      setNumRounds(JSON.parse(storedScores).length);
    }
  }, []);

  const handleNameChange = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = name;
    setPlayers(newPlayers);
    localStorage.setItem("golfPlayers", JSON.stringify(newPlayers));
  };

  const handleScoreChange = (
    playerIndex: number,
    roundIndex: number,
    score: string
  ) => {
    const updatedScores = [...scores];
    while (updatedScores.length <= roundIndex) {
      updatedScores.push(Array(6).fill(""));
    }
    updatedScores[roundIndex][playerIndex] = score;
    setScores(updatedScores);
    localStorage.setItem("golfScores", JSON.stringify(updatedScores));
  };

  const addRound = () => {
    setNumRounds(numRounds + 1);
  };

  const clearOnlyScores = () => {
    setScores([]);
    localStorage.removeItem("golfScores");
    setNumRounds(1);
  };

  const clearPlayersAndScores = () => {
    const emptyPlayers = Array(6).fill("");
    setPlayers(emptyPlayers);
    setScores([]);
    localStorage.removeItem("golfPlayers");
    localStorage.removeItem("golfScores");
    setNumRounds(1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={clearOnlyScores} style={{ marginRight: "1rem" }}>
          Clear Scores
        </button>
        <button onClick={clearPlayersAndScores}>
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
                            {scores
                              .slice(0, roundIndex + 1)
                              .reduce(
                                (acc, round) =>
                                  acc + (parseInt(round[playerIndex]) || 0),
                                0
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
