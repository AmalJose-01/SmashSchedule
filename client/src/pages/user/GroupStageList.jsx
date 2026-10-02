import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTournamentDetail } from "../../hooks/useTournamentDetail";

import { useParams } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Award,
  Calendar,
  ChevronDown,
  Table,
  Target,
  Trophy,
  BarChart2,
  MapPin,
  Flame,
  CheckCircle,
  Clock,
} from "lucide-react";
import AppBackground from "../../components/AppBackground";
import PageHeader from "../../components/PageHeader";

const GroupStageList = () => {
  const location = useLocation();
  const state = location.state || {};
  const [groups, setGroups] = useState(null);
  const [matches, setMatches] = useState({});
  const [selectedGroup, setSelectedGroup] = useState("all"); // "all" = show all groups
  const { tournamentId } = useParams();
  const navigate = useNavigate();

  const [expandedGroupId, setExpandedGroupId] = useState(null);

  // const [isExpanded, setIsExpanded] = useState(false);
  // const toggleExpand = () => setIsExpanded((prev) => !prev);


const toggleExpand = (groupId) => {
  if (expandedGroupId === groupId) {
    setExpandedGroupId(null); // collapse if clicked again
  } else {
    setExpandedGroupId(groupId); // expand this group only
  }
};


  const { handleTournamentDetail, isLoading: isTournamentDetailLoading } =
    useTournamentDetail(tournamentId, "User");

  const tournamentDetail = handleTournamentDetail();

  useEffect(() => {
    if (tournamentDetail?.groups && tournamentDetail?.matches) {
      setGroups(tournamentDetail.groups); // now groups = { A: [...], B: [...], ... }

      setMatches(tournamentDetail.matches); // now matches = { A: [...], B: [...], ... }
    }
  }, [tournamentDetail]);

  const handleGotoKnockout = async () => {
    // Navigate to knockout page with top teams
    // You can use react-router's useNavigate for navigation
    try {
      const allFinished = groups.every((gp) => gp.status === "finished");

      // if (!allFinished) {
      //   toast.error("All groups must be finished before creating knockout stage.");
      //   return;
      // }

      navigate("/knockoutResult", { state: { teams: topTeams, tournamentId } });
    } catch (error) {
      console.log("Navigation error:", error);
    }
  };

  // Top teams for knockout
  const topTeams = groups
    ? Object.keys(groups).map((key) => groups[key][0])
    : [];

  const getStatusBadge = (status) => {
    switch (status) {
      case "finished":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
            Finished
          </span>
        );
      case "ongoing":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
            <Flame className="w-3 h-3" /> Live
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
            Scheduled
          </span>
        );
    }
  };

  if (!groups) {
    return (
      <AppBackground variant="user">
        <div className="min-h-screen flex items-center justify-center text-slate-400">Loading tournament data...</div>
      </AppBackground>
    );
  }

  return (
    <AppBackground variant="user">
      <PageHeader
        variant="user"
        title="Group Stage"
        subtitle="Matches, scores and standings"
        onBack={() => navigate(-1)}
        profileMenu
        actions={
          <button
            onClick={handleGotoKnockout}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-yellow-500 hover:from-emerald-600 hover:to-yellow-600 text-white px-3 sm:px-4 h-10 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/30 transition-all"
          >
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Knockout</span>
          </button>
        }
      />

      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Group Filter */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-3 sm:p-4 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 whitespace-nowrap">
            <Target className="w-4 h-4 text-emerald-400" />
            Group
          </label>
          <div className="relative flex-1 sm:flex-none">
            <select
              className="w-full sm:w-48 appearance-none bg-slate-900/50 border border-slate-600 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
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
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {groups.length > 0 ? (
          <div className={`grid grid-cols-1 ${groups.length > 1 && selectedGroup === "all" ? "xl:grid-cols-2" : ""} gap-6`}>
            {groups
              .filter((gp) => selectedGroup === "all" || selectedGroup === gp.groupName)
              .map((gp) => {
                const groupMatches = matches.filter((m) => m.group === gp._id);
                const wide = !(groups.length > 1 && selectedGroup === "all");

                return (
                  <div
                    key={gp._id}
                    className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden"
                  >
                    <div className="px-5 py-4 bg-gradient-to-r from-emerald-500/20 via-yellow-500/5 to-emerald-500/20 border-b border-slate-700/50">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-emerald-400" />
                        {gp.groupName}
                        <span className="ml-auto text-xs font-normal text-slate-400">
                          {groupMatches.length} match{groupMatches.length !== 1 ? "es" : ""}
                        </span>
                      </h2>
                    </div>

                    {/* Standings */}
                    <div className="p-4 sm:p-5">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
                        <BarChart2 className="w-4 h-4 text-emerald-400" />
                        Standings
                      </h3>
                      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wide">
                            <tr>
                              <th className="p-3 text-left">#</th>
                              <th className="p-3 text-left">Team</th>
                              <th className="p-3">M</th>
                              <th className="p-3">W</th>
                              <th className="p-3">L</th>
                              <th className="p-3">PF</th>
                              <th className="p-3">PA</th>
                              <th className="p-3">PD</th>
                              <th className="p-3 text-emerald-300">Pts</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/50">
                            {gp.standings
                              .slice()
                              .sort((a, b) =>
                                b.totalPoints !== a.totalPoints
                                  ? b.totalPoints - a.totalPoints
                                  : b.pointsFor - b.pointsAgainst - (a.pointsFor - a.pointsAgainst)
                              )
                              .map((t, idx) => {
                                const teamObj = gp.teams.find((team) => team.teamId === t.teamId);
                                const isQualified = idx < 2;
                                const pd = t.pointsFor - t.pointsAgainst;
                                return (
                                  <tr key={idx} className={`text-slate-200 ${isQualified ? "bg-emerald-500/5" : ""}`}>
                                    <td className="p-3">
                                      <span
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                                          isQualified ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300"
                                        }`}
                                      >
                                        {idx + 1}
                                      </span>
                                    </td>
                                    <td className="p-3 whitespace-nowrap">{teamObj?.name || t.teamId}</td>
                                    <td className="p-3 text-center">{t.matchesPlayed}</td>
                                    <td className="p-3 text-center">{t.wins}</td>
                                    <td className="p-3 text-center">{t.losses}</td>
                                    <td className="p-3 text-center">{t.pointsFor}</td>
                                    <td className="p-3 text-center">{t.pointsAgainst}</td>
                                    <td className="p-3 text-center">
                                      <span className={pd >= 0 ? "text-emerald-400" : "text-red-400"}>
                                        {pd > 0 ? "+" : ""}
                                        {pd}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 font-semibold">
                                        {t.totalPoints}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                      {gp.standings.length > 0 && (
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                          Top 2 qualify for the knockout stage
                        </p>
                      )}
                    </div>

                    {/* Matches + scores (read only) */}
                    <div className="px-4 sm:px-5 pb-5">
                      <button
                        type="button"
                        onClick={() => toggleExpand(gp._id)}
                        className="w-full flex items-center justify-between py-2 text-sm font-semibold text-slate-300 hover:text-white"
                      >
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          Matches & Scores
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${expandedGroupId === gp._id ? "rotate-180" : ""}`}
                        />
                      </button>

                      {expandedGroupId === gp._id && (
                        <div className={`mt-2 grid grid-cols-1 sm:grid-cols-2 ${wide ? "lg:grid-cols-3" : ""} gap-3`}>
                          {groupMatches.map((m) => {
                            const played = (m.scores?.[0]?.sets || []).filter((st) => st.home > 0 || st.away > 0);
                            return (
                              <div key={m._id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/50">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="min-w-0">
                                    <div className="font-semibold text-sm text-white break-words">{m.matchName}</div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {m.court || "Court TBA"}
                                    </div>
                                  </div>
                                  <MatchStatus status={m.status} />
                                </div>
                                {played.length > 0 ? (
                                  <div className="flex flex-wrap gap-2 mt-2">
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
                                  <p className="text-xs text-slate-500 mt-2">No score yet</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl">
            <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">No groups available.</p>
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

export default GroupStageList;
