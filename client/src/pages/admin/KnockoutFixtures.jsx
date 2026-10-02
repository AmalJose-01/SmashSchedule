import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetKnockoutList } from "../../hooks/useGetKnockoutList";
import { createKnockoutScheduleAPI } from "../../services/admin/adminTeamServices";
import { useKnockoutUpdateScore } from "../../hooks/useKnockoutUpdateScore";
import { Calendar, CheckCircle, Clock, Flame, Save, Shuffle, Trophy } from "lucide-react";
import AppBackground from "../../components/AppBackground";
import PageHeader from "../../components/PageHeader";
import KnockoutBracket from "../../components/KnockoutBracket";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logOut } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { clearUnneededThirdSet, isThirdSetNeeded } from "../../../utils/helpers/matchUtils";

export function getRoundName(round) {
  switch (round) {
    case 0:
      return "Round of 32";
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
  const [view, setView] = useState("bracket"); // "bracket" | list view
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
    if (mutation.isPending) return;

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

        const updatedScores = clearUnneededThirdSet(
          match.scores.map((set, idx) => (idx === setIndex ? { ...set, [teamType]: value } : set))
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
    <AppBackground>
      <PageHeader
        title="Knockout Stage"
        subtitle={tournamentData?.tournamentName}
        onBack={() =>
          tournamentData?._id ? navigate(`/match/${tournamentData._id}`) : navigate("/setup-tournament")
        }
        actions={
          matches.length === 0 && (
            <button
              onClick={handleCreateKnockout}
              disabled={mutation.isPending}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white px-3 sm:px-4 h-10 rounded-xl font-semibold text-sm shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4" />
              <span className="hidden sm:inline">
                {mutation.isPending ? "Creating..." : "Shuffle Knockout Teams"}
              </span>
            </button>
          )
        }
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {matches.length > 0 && (
          <div className="inline-flex p-1 rounded-xl bg-slate-900/60 border border-slate-700/50">
            {[["bracket", "Bracket"], ["scores", "Enter Scores"]].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  view === key ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30" : "text-slate-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {matches.length > 0 && view === "bracket" ? (
          <KnockoutBracket matches={matches} variant="admin" onMatchClick={(m) => {
            setView("scores");
            setTimeout(() => document.getElementById(`ko-${m._id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
          }} />
        ) : matches.length > 0 ? (
          Object.keys(groupedMatches).map((round) => {
            const roundName = getRoundName(Number(round));
            const isFinal = roundName === "Final";
            return (
              <section
                key={round}
                className={`bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border overflow-hidden ${
                  isFinal ? "border-amber-400/40 shadow-amber-500/10" : "border-slate-700/50"
                }`}
              >
                {/* ROUND HEADER */}
                <div
                  className={`px-5 py-4 border-b border-slate-700/50 ${
                    isFinal
                      ? "bg-gradient-to-r from-amber-500/25 via-yellow-500/10 to-amber-500/25"
                      : "bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-emerald-500/20"
                  }`}
                >
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Trophy className={`w-5 h-5 ${isFinal ? "text-amber-300" : "text-cyan-400"}`} />
                    {roundName}
                    <span className="ml-auto text-xs font-normal text-slate-400">
                      {groupedMatches[round].length} match{groupedMatches[round].length !== 1 ? "es" : ""}
                    </span>
                  </h2>
                </div>

                <div className="p-4 sm:p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    Matches
                  </h3>
                  <div
                    className={`grid grid-cols-1 gap-3 ${
                      isFinal ? "max-w-2xl mx-auto" : "sm:grid-cols-2 lg:grid-cols-3"
                    }`}
                  >
                    {groupedMatches[round].map((match) => (
                      <KnockoutMatchCard
                        key={match._id}
                        match={match}
                        isFinal={isFinal}
                        onSetChange={handleSetChange}
                        onSave={updateScore}
                      />
                    ))}
                  </div>
                </div>
              </section>
            );
          })
        ) : (
          <div className="text-center py-16 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl">
            <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-medium mb-1">Knockout fixtures not available.</p>
            <p className="text-sm text-slate-400">Use “Shuffle Knockout Teams” to create them.</p>
          </div>
        )}
      </div>
    </AppBackground>
  );
};

// ── One knockout match (dark card). Final gets a gold style + winner banner.
const KnockoutMatchCard = ({ match, isFinal, onSetChange, onSave }) => {
  // Set 3 only opens when sets 1 & 2 are finished and split 1–1.
  const thirdSetOpen = isThirdSetNeeded(match.scores);
  const winnerName =
    match.status === "finished" && match.winner
      ? match.winner === "home"
        ? match.teamsHome.teamName
        : match.teamsAway.teamName
      : null;

  return (
    <div
      id={`ko-${match._id}`}
      className={`p-4 rounded-xl border transition-all flex flex-col ${
        isFinal
          ? "bg-slate-900/50 border-amber-400/30"
          : "bg-slate-900/40 border-slate-700/50 hover:border-cyan-500/40"
      }`}
    >
      {isFinal && winnerName && (
        <div className="mb-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border border-amber-400/40 p-4 text-center">
          <Trophy className="w-10 h-10 text-amber-300 mx-auto mb-2" />
          <div className="text-xs uppercase tracking-widest text-amber-300/80">Champion</div>
          <div className="text-2xl sm:text-4xl font-bold text-white mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>
            {winnerName}
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={`min-w-0 font-semibold text-white break-words ${isFinal ? "text-base sm:text-lg" : "text-sm"}`}>
          {match.teamsHome.teamName}
          <span className="text-slate-500 font-normal"> vs </span>
          {match.teamsAway.teamName}
        </div>
        <MatchStatus status={match.status} />
      </div>

      <div className="space-y-2">
        {match.scores.map((set, idx) => {
          const isSameScore = set.home === set.away && set.home > 0 && set.away > 0;
          const locked = idx === 2 && !thirdSetOpen;
          const scoreCls = `w-full min-w-0 bg-slate-900/60 border rounded-lg py-1.5 text-center text-sm text-white [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-40 ${
            isSameScore ? "border-red-500" : "border-slate-600"
          }`;
          const onScore = (side) => (e) =>
            onSetChange(match._id, idx, side, Math.min(21, Math.max(0, Number(e.target.value))));

          return (
            <div key={set._id} className="flex items-center gap-2">
              <span className="w-10 flex-shrink-0 text-[11px] uppercase tracking-wide text-slate-500">
                Set {idx + 1}
              </span>
              <input
                type="number"
                min={0}
                max={21}
                className={scoreCls}
                value={set.home === 0 ? "" : set.home}
                disabled={locked}
                onChange={onScore("home")}
              />
              <span className="text-slate-500">:</span>
              <input
                type="number"
                min={0}
                max={21}
                className={scoreCls}
                value={set.away === 0 ? "" : set.away}
                disabled={locked}
                onChange={onScore("away")}
              />
            </div>
          );
        })}
      </div>

      <button
        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-sm font-medium hover:bg-emerald-500/20 transition-all"
        onClick={() => onSave(match._id)}
      >
        <Save className="w-4 h-4" />
        Update Score
      </button>
    </div>
  );
};

// Dark status pill
const MatchStatus = ({ status }) => {
  const s = status?.toLowerCase();
  const [cls, Icon, label] =
    s === "finished"
      ? ["bg-emerald-500/15 border-emerald-500/30 text-emerald-300", CheckCircle, "Finished"]
      : s === "ongoing"
        ? ["bg-cyan-500/15 border-cyan-500/30 text-cyan-300", Flame, "Live"]
        : ["bg-slate-500/15 border-slate-500/30 text-slate-300", Clock, "Scheduled"];
  return (
    <span className={`flex-shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-medium flex items-center gap-1 ${cls}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
};

export default KnockoutFixtures;
