import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetKnockoutList } from "../../hooks/useGetKnockoutList";
import ButtonWithIcon from "../../components/ButtonWithIcon";
import { createKnockoutScheduleAPI } from "../../services/admin/adminTeamServices";
import { useKnockoutUpdateScore } from "../../hooks/useKnockoutUpdateScore";
import { Calendar, Table, Trophy } from "lucide-react";
import Logout from "../../components/Logout";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logOut } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { isMatchDecided } from "../../../utils/helpers/matchUtils";
import StatusBadge from "../../components/StatusBadge";
import { motion } from "framer-motion";
import winnerGif from "../../assets/fireworks.gif";

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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const tournamentData = useSelector(
    (state) => state.tournament.tournamentData
  );

  const { handleKnockoutList } = useGetKnockoutList(
    tournamentData?._id,
    "Admin"
  );

  const knockoutList = handleKnockoutList();

  const { handleKnockoutScore, isLoading, isError, isSuccess } =
    useKnockoutUpdateScore();

  useEffect(() => {
    if (knockoutList?.matches) {
      setMatches(knockoutList.matches);
    }
  }, [knockoutList]);

  const mutation = useMutation({
    mutationKey: ["createKnockout"],
    mutationFn: createKnockoutScheduleAPI,

    onSuccess: (data) => {
      toast.success("Knockout schedule created successfully!");
      console.log("Knockout created:", data);
      queryClient.invalidateQueries({ queryKey: ["knockoutSchedule"] });
    },

    onError: (error) => {
      if (error?.response?.status === 401) {
        toast.error(error.response.data.message || "Session expired");

        dispatch(logOut());
        navigate("/");

        return;
      }

      toast.error(
        error?.response?.data?.message || "Failed to create knockout schedule"
      );
    },
  });

  const handleCreateKnockout = async () => {
    if (mutation.isLoading) return;

    try {
      const data = await mutation.mutateAsync(tournamentData);
      console.log("Knockout created:", data);
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
    if (!match) {
      toast.error("Match not found");
      return;
    }

    console.log("match", match);

    // Check for any set where home and away scores are the same and > 0
    const hasSameScore = match.scores.some(
      (set) => set.home === set.away && set.home > 0
    );

    if (hasSameScore) {
      toast.error("Cannot save: A set has the same score for both teams.");
      return; // block saving
    }

    // Check that every set has at least one team scoring 21 or more
    const isValidSetScore = match.scores.every((set) => {
      const bothZero = set.home === 0 && set.away === 0;
      const oneReached21 = set.home >= 21 || set.away >= 21;

      return bothZero || oneReached21;
    });

    if (!isValidSetScore) {
      toast.error("Each set must have at least one team scoring 21 points.");
      return; // block saving
    }

    const scoreData = {
      matchId: match._id,
      tournamentId: tournamentData._id,
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white ">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4  shadow-lg sticky top-0">
        <div className="flex items-center gap-4">
          <Table
            className="w-8 h-8 text-blue-600"
            onClick={() => navigate("/")}
          />

          <h2 className="text-xl font-semibold text-blue-800">
            Knockout Stage
          </h2>
        </div>

        <div className={`flex gap-2`}>
          <div className={`${matches.length > 0 ? "hidden" : ""}`}>
            <ButtonWithIcon
              title="Shuffle Knockout Team"
              icon="shuffle"
              buttonBGColor="bg-green-600"
              textColor="text-white"
              onClick={handleCreateKnockout}
            />
          </div>

          <Logout />
        </div>
      </div>

      {/* ROUNDS + MATCHES */}
      {matches.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 bg-white p-6 rounded-3xl shadow-lg">
          {Object.keys(groupedMatches).map((round) => (
            <div key={round} className="space rounded-3xl shadow-lg ">
              {/* ROUND HEADER */}
           
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-3xl">
                               <h2 className="text-2xl text-white flex items-center gap-2">
                               <Trophy className="w-6 h-6" />
                              {getRoundName(Number(round))}
                            </h2>
                            </div>

                             <h3 className="mb-4 flex items-center gap-2 text-gray-700 m-4">
                      <Calendar className="w-5 h-5" />
                      Matches
                    </h3>

              {getRoundName(Number(round)) === "Final" ? (
                <div className="grid md:grid-cols-1 gap-4 p-6">
                  {groupedMatches[round].map((match) => (
                    <div
                      key={match._id}
                                            className="card p-4 border border-gray-200 rounded-xl bg-blue-50 hover:bg-blue-100 transition flex flex-col items-center justify-center"

                      // className={`w-full p-4 shadow rounded-xl border text-white ${
                      //   match.status === "finished"
                      //     ? "bg-gradient-to-r from-red-400 via-green-300 to-purple-200 "
                      //     : "bg-slate-200"
                      // }`}
                      // style={{
                      //   backgroundImage:
                      //     match.status === "finished"
                      //       ? `url(${winnerGif})`
                      //       : "none",
                      // }}
                    >
                      {match.status === "finished" && match.winner && (
                        <div className="flex items-center gap-2 justify-center mb-10">
                          <Trophy className="w-10 h-10 text-green-600" />
                          <h1 className="text-6xl font-bold">
                            Winner:{" "}
                            {match.winner === "home"
                              ? match.teamsHome.teamName
                              : match.teamsAway.teamName}
                          </h1>
                        </div>
                      )}

                     <div className="w-full flex items-center justify-center mb-3 gap-5">
                        <div className="flex items-center justify-center ">
                          <div
                            className={`font-bold ${
                              match.status === "finished"
                                ? "text-gray-800"
                                : "text-gray-800"
                            } text-center text-lg`}
                          >
                            {match.teamsHome.teamName} vs{" "}
                            {match.teamsAway.teamName}
                          </div>
                        </div>
                        <StatusBadge status={match.status} />
                      </div>

                      {/* SCORES INPUT */}
                      <div className="flex flex-col gap-3 items-center">
                        {match.scores.map((set, idx) => {
                          const matchFinished = isMatchDecided(
                            match.scores.slice(0, 2)
                          );

                          let disableHome = true;
                          let disableAway = true;

                          const isSameScore =
                            set.home === set.away &&
                            set.home > 0 &&
                            set.away > 0;

                          // Determine winner
                          const homeScoreTotal = match.scores.reduce(
                            (sum, set) => sum + set.home,
                            0
                          );
                          const awayScoreTotal = match.scores.reduce(
                            (sum, set) => sum + set.away,
                            0
                          );

                          const winner =
                            matchFinished && homeScoreTotal > awayScoreTotal
                              ? "home"
                              : matchFinished && awayScoreTotal > homeScoreTotal
                              ? "away"
                              : null;

                          return (
                            <div
                              key={set._id}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="number"
                                min={0}
                                max={21}
                                className={`w-20 md:w-40 p-1 border rounded text-center text-black ${
                                  isSameScore
                                    ? "border-red-500"
                                    : "border-gray-500"
                                }`}
                                value={set.home === 0 ? "" : set.home}
                                disabled={
                                  idx === 2 && matchFinished
                                    ? disableHome
                                    : false
                                }
                                onChange={(e) => {
                                  let value = Math.min(
                                    21,
                                    Math.max(0, Number(e.target.value))
                                  );
                                  handleSetChange(
                                    match._id,
                                    idx,
                                    "home",
                                    value
                                  );
                                }}
                              />
                              <span>:</span>
                              <input
                                type="number"
                                min={0}
                                max={21}
                                className={`w-20 md:w-40 p-1 border rounded text-center text-black ${
                                  isSameScore
                                    ? "border-red-500"
                                    : "border-gray-500"
                                }`}
                                value={set.away === 0 ? "" : set.away}
                                disabled={
                                  idx === 2 && matchFinished
                                    ? disableAway
                                    : false
                                }
                                onChange={(e) => {
                                  let value = Math.min(
                                    21,
                                    Math.max(0, Number(e.target.value))
                                  );
                                  handleSetChange(
                                    match._id,
                                    idx,
                                    "away",
                                    value
                                  );
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
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {groupedMatches[round].map((match) => (
                    <div
                      key={match._id}
                      className="card p-4 border border-gray-200 rounded-xl bg-blue-50 hover:bg-blue-100 transition flex flex-col items-center justify-center"
                    >
                     <div className="w-full flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">
                            {match.teamsHome.teamName} vs{" "}
                            {match.teamsAway.teamName}
                          </div>
                        </div>
                        <StatusBadge status={match.status} />
                      </div>

                      {/* SCORES INPUT */}
                      <div className="flex flex-col gap-3 items-center">
                        {match.scores.map((set, idx) => {
                          const matchFinished = isMatchDecided(
                            match.scores.slice(0, 2)
                          );

                          let disableHome = true;
                          let disableAway = true;

                          const isSameScore =
                            set.home === set.away &&
                            set.home > 0 &&
                            set.away > 0;

                          return (
                            <div
                              key={set._id}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="number"
                                min={0}
                                max={21}
                                className={`w-20 md:w-40 p-1 border rounded text-center text-black ${
                                  isSameScore
                                    ? "border-red-500"
                                    : "border-gray-500"
                                }`}
                                value={set.home === 0 ? "" : set.home}
                                disabled={
                                  idx === 2 && matchFinished
                                    ? disableHome
                                    : false
                                }
                                onChange={(e) => {
                                  let value = Math.min(
                                    21,
                                    Math.max(0, Number(e.target.value))
                                  );
                                  handleSetChange(
                                    match._id,
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
                                className={`w-20 md:w-40 p-1 border rounded text-center text-black ${
                                  isSameScore
                                    ? "border-red-500"
                                    : "border-gray-500"
                                }`}
                                value={set.away === 0 ? "" : set.away}
                                disabled={
                                  idx === 2 && matchFinished
                                    ? disableAway
                                    : false
                                }
                                onChange={(e) => {
                                  let value = Math.min(
                                    21,
                                    Math.max(0, Number(e.target.value))
                                  );
                                  handleSetChange(
                                    match._id,
                                    idx,
                                    "away",
                                    value
                                  );
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
              )}

              {/* MATCH CARDS */}
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
