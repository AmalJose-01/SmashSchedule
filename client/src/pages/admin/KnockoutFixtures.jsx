import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useGetKnockoutList } from "../../hooks/useGetKnockoutList";
import ButtonWithIcon from "../../components/ButtonWithIcon";
import { createKnockoutScheduleAPI } from "../../services/teamServices";
import { useKnockoutUpdateScore } from "../../hooks/useKnockoutUpdateScore";

export function getRoundName(round) {
  switch (round) {
    case 1:
      return "Round of 16";
    case 2:
      return "Quarterfinals";
    case 3:
      return "Semifinals";
    case 4:
      return "Final";
    case 5:
      return "Champion";
    default:
      return `Round ${round}`;
  }
}

const KnockoutFixtures = () => {
  const [matches, setMatches] = useState([]);

  const tournamentData = useSelector(
    (state) => state.tournament.tournamentData
  );

  const { handleKnockoutList } = useGetKnockoutList(
    tournamentData?.tournamentId
  );

  const knockoutList = handleKnockoutList();

  const { handleKnockoutScore, isLoading, isError, isSuccess } =
    useKnockoutUpdateScore();

  useEffect(() => {
    if (knockoutList?.matches) {
      setMatches(knockoutList.matches);
    }
  }, [knockoutList]);

  const handleCreateKnockout = async () => {
    try {
      await createKnockoutScheduleAPI(tournamentData);
    } catch (error) {
      console.error("Failed to create knockout schedule:", error);
    }
  };

  // GROUP MATCHES BY ROUND
  const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {});

  // HANDLE SCORE CHANGE
  const handleSetChange = (matchId, setIndex, teamType, value) => {
    setMatches((prev) =>
      prev.map((match) => {
        if (match._id !== matchId) return match;

        const updatedScores = match.scores.map((set, idx) =>
          idx === setIndex ? { ...set, [teamType]: value } : set
        );

        return { ...match, scores: updatedScores };
      })
    );
  };
  const updateScore = async (matchId) => {
    const match = matches.find((m) => m._id === matchId);
    if (!match) return;

    const scoreData = {
      matchId: match._id,
      tournamentId: tournamentData.tournamentId,
      scores: match.scores,
    };

    try {
      // Call your API to update the score
      console.log("scoreData to be sent:", scoreData);

      handleKnockoutScore(scoreData);
      console.log("Score updated successfully");
    } catch (error) {
      console.error("Failed to update score:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 space-y-6">
      {/* CREATE KNOCKOUT BUTTON */}
      <ButtonWithIcon
        title="Knockout Team"
        icon="plus"
        buttonBGColor="bg-green-600"
        textColor="text-white"
        onClick={handleCreateKnockout}
      />

      {/* ROUNDS + MATCHES */}
      {matches.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 bg-white p-6 rounded-3xl shadow-lg">
          {Object.keys(groupedMatches).map((round) => (
            <div key={round} className="space-y-4">
              {/* ROUND HEADER */}
              <h2 className="text-3xl font-extrabold text-blue-800 border-b pb-2">
                {getRoundName(Number(round))}
              </h2>

              {/* MATCH CARDS */}
              <div className="grid md:grid-cols-2 gap-4">
                {groupedMatches[round].map((match) => (
                  <div
                    key={match._id}
                    className="w-full p-4 bg-gradient-to-r from-gray-400 via-blue-300 to-purple-200 shadow rounded-xl border text-white"
                  >
                    <h3 className="text-xl font-bold text-center mb-4">
                      {match.teamsHome.teamName} vs {match.teamsAway.teamName}
                    </h3>

                    {/* SCORES INPUT */}
                    <div className="flex flex-col gap-3 items-center">
                      {match.scores.map((set, idx) => {
                        const isSameScore =
                          set.home === set.away && set.home > 0 && set.away > 0;
                        return (
                          <div
                            key={set._id}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="number"
                              min={0}
                              max={21}
                              className="w-20 md:w-40 p-1 border rounded text-center text-black"
                              value={set.home === 0 ? "" :  set.home}
                              // onFocus={(e) => {
                              //   if (Number(e.target.value) === 0) {
                              //     e.target.value = "";
                              //   }
                              // }}
                              onChange={(e) => {
                                let value = Math.min(
                                  21,
                                  Math.max(0, Number(e.target.value))
                                );
                                handleSetChange(match._id, idx, "home", value);
                              }}
                            />
                            <span>-</span>
                            <input
                              type="number"
                              min={0}
                              max={21}
                              className="w-20 md:w-40 p-1 border rounded text-center text-black"
                              value={set.away ===0 ? "" : set.away}
                              // onFocus={(e) => {
                              //   if (Number(e.target.value) === 0) {
                              //     e.target.value = "";
                              //   }
                              // }}
                              onChange={(e) => {
                                let value = Math.min(
                                  21,
                                  Math.max(0, Number(e.target.value))
                                );
                                handleSetChange(match._id, idx, "away", value);
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Update Score Button */}
                    <div className="mt-2 items-center flex justify-center">
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        onClick={() => updateScore(match._id)}
                      >
                        Update Score
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg p-6 max-h-96 overflow-y-auto mt-4 ml-4 mr-4">
          <h2 className="text-xl font-semibold mb-4">
            Knockout fixtures not available.
          </h2>
        </div>
      )}
    </div>
  );
};

export default KnockoutFixtures;
