import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useGetKnockoutList } from "../../hooks/useGetKnockoutList";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Clock, Flame, Trophy } from "lucide-react";
import AppBackground from "../../components/AppBackground";
import PageHeader from "../../components/PageHeader";

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

const KnockoutResult = () => {
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();

  const tournamentData = useSelector(
    (state) => state.tournament.tournamentData
  );

  const { handleKnockoutList } = useGetKnockoutList(
    tournamentData?._id,
    "User"
  );

  const knockoutList = handleKnockoutList();

  useEffect(() => {
    if (knockoutList?.matches) {
      setMatches(knockoutList.matches);
    }
  }, [knockoutList]);

  // GROUP MATCHES BY ROUND
  const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {});

  return (
    <AppBackground variant="user">
      <PageHeader
        variant="user"
        title="Knockout Stage"
        subtitle={tournamentData?.tournamentName}
        onBack={() => navigate(-1)}
        profileMenu
      />

      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6">
        {matches.length > 0 ? (
          Object.keys(groupedMatches)
            .sort((a, b) => Number(a) - Number(b))
            .map((round) => {
              const roundName = getRoundName(Number(round));
              const isFinal = roundName === "Final";
              return (
                <section
                  key={round}
                  className={`bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border overflow-hidden ${
                    isFinal ? "border-yellow-400/40" : "border-slate-700/50"
                  }`}
                >
                  <div
                    className={`px-5 py-4 border-b border-slate-700/50 ${
                      isFinal
                        ? "bg-gradient-to-r from-yellow-500/25 via-amber-500/10 to-yellow-500/25"
                        : "bg-gradient-to-r from-emerald-500/20 via-yellow-500/5 to-emerald-500/20"
                    }`}
                  >
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Trophy className={`w-5 h-5 ${isFinal ? "text-yellow-300" : "text-emerald-400"}`} />
                      {roundName}
                      <span className="ml-auto text-xs font-normal text-slate-400">
                        {groupedMatches[round].length} match{groupedMatches[round].length !== 1 ? "es" : ""}
                      </span>
                    </h2>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className={`grid grid-cols-1 gap-3 ${isFinal ? "max-w-2xl mx-auto" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                      {groupedMatches[round].map((match) => {
                        const winnerName =
                          match.status === "finished" && match.winner
                            ? match.winner === "home"
                              ? match.teamsHome.teamName
                              : match.teamsAway.teamName
                            : null;
                        const played = (match.scores || []).filter((st) => st.home > 0 || st.away > 0);
                        return (
                          <div
                            key={match._id}
                            className={`p-4 rounded-xl border ${
                              isFinal ? "bg-slate-900/50 border-yellow-400/30" : "bg-slate-900/40 border-slate-700/50"
                            }`}
                          >
                            {isFinal && winnerName && (
                              <div className="mb-4 rounded-xl bg-gradient-to-r from-yellow-500/20 via-amber-400/20 to-yellow-500/20 border border-yellow-400/40 p-4 text-center">
                                <Trophy className="w-10 h-10 text-yellow-300 mx-auto mb-2" />
                                <div className="text-xs uppercase tracking-widest text-yellow-300/80">Champion</div>
                                <div className="text-2xl sm:text-4xl font-bold text-white mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                                  {winnerName}
                                </div>
                              </div>
                            )}

                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 text-sm font-semibold break-words">
                                <span className={match.winner === "home" ? "text-emerald-300" : "text-white"}>
                                  {match.teamsHome.teamName}
                                </span>
                                <span className="text-slate-500 font-normal"> vs </span>
                                <span className={match.winner === "away" ? "text-emerald-300" : "text-white"}>
                                  {match.teamsAway.teamName}
                                </span>
                              </div>
                              <MatchStatus status={match.status} />
                            </div>

                            {played.length > 0 ? (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {played.map((st, i) => (
                                  <span
                                    key={st._id || i}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 tabular-nums"
                                  >
                                    <span className="text-slate-500 mr-1">S{i + 1}</span>
                                    {st.home} – {st.away}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 mt-3">No score yet</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            })
        ) : (
          <div className="text-center py-16 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl">
            <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">Knockout fixtures not available yet.</p>
          </div>
        )}
      </div>
    </AppBackground>
  );
};

// Dark status pill
const MatchStatus = ({ status }) => {
  const s = status?.toLowerCase();
  const [cls, Icon, label] =
    s === "finished"
      ? ["bg-emerald-500/15 border-emerald-500/30 text-emerald-300", CheckCircle, "Finished"]
      : s === "ongoing"
        ? ["bg-yellow-500/15 border-yellow-500/30 text-yellow-300", Flame, "Live"]
        : ["bg-slate-500/15 border-slate-500/30 text-slate-300", Clock, "Scheduled"];
  return (
    <span className={`flex-shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-medium flex items-center gap-1 ${cls}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
};

export default KnockoutResult;
