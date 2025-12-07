import React, { useState, useEffect, use } from "react";
import { toast } from "sonner";
import { useTournamentDetail } from "../../hooks/useTournamentDetail";

import { useParams } from "react-router-dom";
import { useUpdateScore } from "../../hooks/useUpdateScore";
import ButtonWithIcon from "../../components/ButtonWithIcon";
import { useLocation, useNavigate } from "react-router-dom";
import { useCreateKnockoutList } from "../../hooks/useCreateKnockoutList";
import { useSelector } from "react-redux";
import { FaSave } from "react-icons/fa";
import { Settings, Table } from "lucide-react";
import Logout from "../../components/Logout";

const MatchHome = () => {
  const location = useLocation();
  const state = location.state || {};
  const [groups, setGroups] = useState(null);
  const [matches, setMatches] = useState({});
  const [tickerIndex, setTickerIndex] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState("all"); // "all" = show all groups
  const { tournamentId } = useParams();
  const navigate = useNavigate();

  const { handleTournamentDetail, isLoading: isTournamentDetailLoading } =
    useTournamentDetail(tournamentId);

  const {
    handleScore,
    isLoading: isScoreLoading,
    isError: isScoreError,
    isSuccess: isScoreSuccess,
  } = useUpdateScore();

  const tournamentDetail = handleTournamentDetail();

  useEffect(() => {
    if (tournamentDetail?.groups && tournamentDetail?.matches) {
      setGroups(tournamentDetail.groups); // now groups = { A: [...], B: [...], ... }

      setMatches(tournamentDetail.matches); // now matches = { A: [...], B: [...], ... }
    }
  }, [tournamentDetail]);

  const resultsTicker = [
    "Team 1 def Team 2 (2-1)",
    "Team 4 def Team 3 (2-0)",
    "Team 1 def Team 3 (2-0)",
    "Team 2 def Team 4 (2-1)",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 3) % resultsTicker.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSetChange = (matchId, setIdx, teamKey, value) => {
    console.log("Handle Set Change Called:", matchId, setIdx, teamKey, value);
    setMatches((prev) =>
      prev.map((m) => {
        if (m._id === matchId) {
          const updatedScores = m.scores.map((scoreObj) => {
            const updatedSets = scoreObj.sets.map((set, idx) =>
              idx === setIdx ? { ...set, [teamKey]: Number(value) } : set
            );
            return { ...scoreObj, sets: updatedSets };
          });
          return { ...m, scores: updatedScores };
        }
        return m;
      })
    );
  };

  const updateScore = async (matchId) => {
    const match = matches.find((m) => m._id === matchId);
    console.log("updateScore called for match:", match);

    if (!match) {
      toast.error("Match not found");
      return;
    }

    // Check for any set where home and away scores are the same and > 0
    const hasSameScore = match.scores[0].sets.some(
      (set) => set.home === set.away && set.home > 0
    );

    if (hasSameScore) {
      toast.error("Cannot save: A set has the same score for both teams.");
      return; // block saving
    }

    try {
      const payload = {
        ...match,
        matchId: match._id,
      };
      delete payload._id; // remove _id to avoid confusion

      // Call API to update score
      handleScore(payload);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update match score"
      );
    }
  };

  const handleGotoKnockout = async () => {
    // Navigate to knockout page with top teams
    // You can use react-router's useNavigate for navigation
    try {
      const allFinished = groups.every((gp) => gp.status === "finished");

      // if (!allFinished) {
      //   toast.error("All groups must be finished before creating knockout stage.");
      //   return;
      // }

      navigate("/knockout", { state: { teams: topTeams, tournamentId } });
    } catch (error) {
      console.log("Navigation error:", error);
    }

    // navigate(`/knockout/${tournamentId}`, { state: { teams: topTeams } });
  };

  // Top teams for knockout
  const topTeams = groups
    ? Object.keys(groups).map((key) => groups[key][0])
    : [];

  if (!groups) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading tournament data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white ">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4  shadow-lg sticky top-0">
        <div className="flex items-center gap-4">
          <Table
            className="w-8 h-8 text-blue-600"
            onClick={() => navigate("/")}
          />

          <h2 className="text-xl font-semibold text-blue-800">Group Stage</h2>
        </div>

        <div className="flex gap-2">
          <ButtonWithIcon
            title="Go to Knockout"
            icon="go"
            buttonBGColor="bg-green-600"
            textColor="text-white"
            onClick={handleGotoKnockout}
          />
          <Logout />
        </div>
      </div>

      {/* Ticker */}
      {/* <div className="sticky top-0 z-50 bg-blue-700 text-white p-4 rounded-xl shadow-lg text-center text-lg font-semibold tracking-wide">
        <AnimatePresence>
          {resultsTicker.slice(tickerIndex, tickerIndex + 3).map((res, idx) => (
            <motion.div
              key={tickerIndex + idx}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.6 }}
              className="mb-1"
            >
              {res}
            </motion.div>
          ))}
        </AnimatePresence>
      </div> */}

      {/* Dropdown to select group */}
      <div className="mb-6 mt-4 ml-4 mr-4 flex items-center">
        <label className="mr-2 font-semibold text-gray-700">
          Select Group:
        </label>
        <select
          className="p-2 border rounded"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="all">All Groups</option>
          {groups.map((gp) => (
            <option key={gp._id} value={gp.groupName}>
              {gp.groupName}
            </option>
          ))}
        </select>
      </div>

      {/* Group Stage */}
      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-4 mr-4 mb-6">
          {groups
            .filter(
              (gp) => selectedGroup === "all" || selectedGroup === gp.groupName
            )
            .map((gp) => {
              const groupMatches = matches.filter((m) => m.group === gp._id);

              return (
                <div
                  key={gp._id}
                  className="bg-white rounded-3xl shadow-lg p-6 overflow-x-auto"
                >
                  <h2 className="text-2xl font-bold mb-4 text-blue-800">
                    {gp.groupName}
                  </h2>

                  {/* Matches */}
                  <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupMatches.map((m) => (
                      <div
                        key={m._id}
                        className="card p-4 border border-gray-200 rounded-xl bg-blue-50 hover:bg-blue-100 transition flex flex-col items-center justify-center"
                      >
                        <div className="font-semibold text-sm text-gray-800 text-center">
                          {m.matchName}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {/* {m.time} — {m.court} */}
                          10:00 AM — Court 1
                        </div>
                        <div className="mt-2 space-y-1 items-center justify-center">
                          {m.scores[0].sets.map((set, idx) => {
                            const isSameScore =
                              set.home === set.away &&
                              set.home > 0 &&
                              set.away > 0; // check if scores are equal

                            const disableHome =
                              m.status === "finished" && set.home === 0;
                            const disableAway =
                              m.status === "finished" && set.away === 0;

                            return (
                              <div
                                key={set._id}
                                className="flex space-x-2 items-center"
                              >
                                <div className="flex flex-row">
                                  <input
                                    type="number"
                                    min={0}
                                    max={21} // maximum score allowed
                                    className={`w-full p-1 border rounded text-center mr-2 ${
                                      isSameScore
                                        ? "border-red-500"
                                        : "border-gray-500"
                                    } `}
                                    value={set.home === 0 ? "" : set.home}
                                    disabled={disableHome}
                                    // onFocus={(e) => {
                                    //   if (Number(e.target.value) === 0) {
                                    //     e.target.value = "";
                                    //   }
                                    // }}
                                    onChange={(e) => {
                                      let value = Number(e.target.value);

                                      // Clamp value between 0 and 21
                                      if (isNaN(value) || value < 0) value = 0;
                                      if (value > 21) value = 21;
                                      handleSetChange(
                                        m._id,
                                        idx,
                                        "home",
                                        value
                                      );
                                    }}
                                  />
                                  <span>-</span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={21}
                                    className={`w-max-full p-1 border rounded text-center ml-2 ${
                                      isSameScore
                                        ? "border-red-500"
                                        : "border-gray-500"
                                    } `}
                                    value={set.away === 0 ? "" : set.away}
                                    disabled={disableAway}
                                    // onClick={(e) => {
                                    //   if (Number(e.target.value) === 0) {
                                    //     e.target.value = "";
                                    //   }
                                    // }}
                                    onChange={(e) => {
                                      let value = Number(e.target.value);
                                      if (isNaN(value) || value < 0) value = 0;
                                      if (value > 21) value = 21;
                                      handleSetChange(
                                        m._id,
                                        idx,
                                        "away",
                                        value
                                      );
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Update Score Button */}
                        <div className="w-full items-center justify-center mt-2 ">
                          <button
                            className="flex w-full items-center gap-1  justify-center px-4 py-2 bg-green-600 text-white rounded hover:bg-blue-700 text-sm"
                            onClick={() => updateScore(m._id)}
                          >
                            <FaSave size={18} />
                            Update Score
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Points Table */}
                  <table className="w-full min-w-max table-auto border border-gray-300 text-gray-800">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="p-3 border">Team</th>
                        <th className="p-3 border">M</th>
                        <th className="p-3 border">W</th>
                        <th className="p-3 border">L</th>
                        <th className="p-3 border">PF</th>
                        <th className="p-3 border">PA</th>
                        <th className="p-3 border">PD</th>
                        <th className="p-3 border font-bold text-green-600">
                          P
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {gp.standings
                        .slice()
                        .sort((a, b) => {
                          // Sort by totalPoints descending
                          if (b.totalPoints !== a.totalPoints) {
                            return b.totalPoints - a.totalPoints;
                          }
                          // If totalPoints are equal, sort by points difference descending
                          const diffA = a.pointsFor - a.pointsAgainst;
                          const diffB = b.pointsFor - b.pointsAgainst;
                          return diffB - diffA;
                        })

                        .map((t, idx) => {
                          // Find the team object that matches the teamId
                          const teamObj = gp.teams.find(
                            (team) => team.teamId === t.teamId
                          );

                          return (
                            <tr
                              key={idx}
                              className="even:bg-blue-50 hover:bg-blue-100 transition"
                            >
                              <td className="p-2 font-semibold">
                                {teamObj?.name || t.teamId}
                              </td>
                              <td className="p-2 text-center">
                                {t.matchesPlayed}
                              </td>
                              <td className="p-2 text-center">{t.wins}</td>
                              <td className="p-2 text-center">{t.losses}</td>
                              <td className="p-2 text-center">{t.pointsFor}</td>
                              <td className="p-2 text-center">
                                {t.pointsAgainst}
                              </td>
                              <td className="p-2 text-center font-bold text-blue-700">
                                {t.pointsFor - t.pointsAgainst}
                              </td>
                              <td className="p-2 text-center font-bold text-green-600">
                                {t.totalPoints}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              );
            })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg p-6 max-h-96 overflow-y-auto mt-4 ml-4 mr-4">
          <h2 className="text-xl font-semibold mb-4">No groups available.</h2>
        </div>
      )}
    </div>
  );
};

export default MatchHome;
