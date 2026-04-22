import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Users, Layers, Swords, RefreshCw, CheckCircle,
  ChevronDown, ChevronUp, Trophy, Loader2
} from "lucide-react";
import Logout from "../../../../components/Logout.jsx";
import {
  useGetRoundRobinTournament,
  useGetTournamentPlayers,
  useGetGroups,
  useGetMatches,
  useGetStandings,
  useGenerateGroups,
  useFinalizeRoundRobinTournament,
  useRemovePlayerFromTournament,
} from "../services/roundRobin.queries.js";

const STATUS_STYLES = {
  Draft:     "bg-gray-100 text-gray-600",
  Active:    "bg-blue-100 text-blue-700",
  Scheduled: "bg-yellow-100 text-yellow-700",
  Ongoing:   "bg-green-100 text-green-700",
  Completed: "bg-purple-100 text-purple-700",
};

const MATCH_STATUS_STYLES = {
  scheduled:  "bg-gray-100 text-gray-600",
  ongoing:    "bg-yellow-100 text-yellow-700",
  completed:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-500",
};

const GRADE_COLORS = {
  A: "bg-red-100 text-red-700", B: "bg-orange-100 text-orange-700",
  C: "bg-yellow-100 text-yellow-700", D: "bg-green-100 text-green-700",
  E: "bg-blue-100 text-blue-700", Unrated: "bg-gray-100 text-gray-600",
};

const TABS = [
  { key: "players", label: "Players",  icon: Users },
  { key: "groups",  label: "Groups",   icon: Layers },
  { key: "matches", label: "Matches",  icon: Swords },
  { key: "standings", label: "Standings", icon: Trophy },
];

// ── Sub-sections ──────────────────────────────────────────────────────────────

const PlayersTab = ({ tournamentId }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetTournamentPlayers(tournamentId);
  const { mutate: removePlayer, isPending } = useRemovePlayerFromTournament();
  const players = data?.data ?? [];

  if (isLoading) return <Spinner />;

  if (players.length === 0)
    return (
      <div className="text-center py-14">
        <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-400 text-sm mb-4">No players registered yet.</p>
        <button
          onClick={() => navigate("/round-robin/members")}
          className="inline-flex items-center gap-2 text-sm text-teal-600 font-semibold hover:underline"
        >
          Go to Member Bank →
        </button>
      </div>
    );

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 font-medium">{players.length} player{players.length !== 1 ? "s" : ""} registered</p>
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-teal-50 text-teal-700 text-left">
          <tr>
            <th className="px-5 py-3 font-semibold">Name</th>
            <th className="px-5 py-3 font-semibold">Grade</th>
            <th className="px-5 py-3 font-semibold">Email</th>
            <th className="px-5 py-3 font-semibold">Contact</th>
            <th className="px-5 py-3 font-semibold text-right">Remove</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {players.map((p) => (
            <tr key={p._id} className="hover:bg-gray-50">
              <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
              <td className="px-5 py-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GRADE_COLORS[p.grade] ?? GRADE_COLORS.Unrated}`}>
                  {p.grade}
                </span>
              </td>
              <td className="px-5 py-3 text-gray-500">{p.email}</td>
              <td className="px-5 py-3 text-gray-500">{p.contact}</td>
              <td className="px-5 py-3 text-right">
                <button
                  onClick={() => removePlayer({ tournamentId, playerId: p._id })}
                  disabled={isPending}
                  className="text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-50"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
};

const GroupsTab = ({ tournamentId }) => {
  const { data, isLoading } = useGetGroups(tournamentId);
  const [expanded, setExpanded] = useState({});
  const groups = data?.data ?? [];

  if (isLoading) return <Spinner />;
  if (groups.length === 0)
    return <Empty text="No groups yet. Use 'Generate Groups' above." />;

  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const open = expanded[g._id] !== false; // open by default
        return (
          <div key={g._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded((prev) => ({ ...prev, [g._id]: !open }))}
            >
              <span className="font-semibold text-gray-800">{g.groupName}</span>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span>{g.players?.length ?? 0} players</span>
                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>
            {open && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {(g.players ?? []).map((p) => (
                  <div key={p.playerId?._id ?? p.playerId} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="text-sm font-medium text-gray-700 flex-1">{p.name}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GRADE_COLORS[p.playerId?.grade] ?? GRADE_COLORS.Unrated}`}>
                      {p.playerId?.grade ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const MatchesTab = ({ tournamentId }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetMatches(tournamentId);
  const matches = data?.data ?? [];

  if (isLoading) return <Spinner />;
  if (matches.length === 0)
    return <Empty text="No matches yet. Generate groups to create matches automatically." />;

  const byGroup = matches.reduce((acc, m) => {
    const key = m.groupId?.groupName ?? "Ungrouped";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(byGroup).map(([groupName, groupMatches]) => (
        <div key={groupName}>
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">{groupName}</h3>
          <div className="space-y-2">
            {groupMatches.map((m) => (
              <div
                key={m._id}
                className="bg-white rounded-xl border border-gray-100 px-5 py-3 flex items-center gap-4 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => navigate(`/round-robin/match/${m._id}?tournament=${tournamentId}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.matchName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {m.player1Id?.name ?? "—"} vs {m.player2Id?.name ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {m.sets?.length > 0 && (
                    <span className="text-xs text-gray-500 font-mono">
                      {m.sets.map((s) => `${s.home}-${s.away}`).join(", ")}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{m.court}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MATCH_STATUS_STYLES[m.status] ?? ""}`}>
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const StandingsTab = ({ tournamentId }) => {
  const { data, isLoading } = useGetStandings(tournamentId);
  const groups = data?.data ?? [];

  if (isLoading) return <Spinner />;
  if (groups.length === 0)
    return <Empty text="Standings will appear after matches are played." />;

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-teal-50 border-b border-teal-100">
            <h3 className="font-semibold text-teal-800 text-sm">{g.groupName}</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left text-xs">
              <tr>
                <th className="px-5 py-2 font-semibold">#</th>
                <th className="px-5 py-2 font-semibold">Player</th>
                <th className="px-4 py-2 font-semibold text-center">P</th>
                <th className="px-4 py-2 font-semibold text-center">W</th>
                <th className="px-4 py-2 font-semibold text-center">L</th>
                <th className="px-4 py-2 font-semibold text-center">PF</th>
                <th className="px-4 py-2 font-semibold text-center">PA</th>
                <th className="px-4 py-2 font-semibold text-center">+/-</th>
                <th className="px-4 py-2 font-semibold text-center">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(g.standings ?? []).map((s, i) => (
                <tr key={s.playerId?._id ?? i} className={i === 0 ? "bg-yellow-50" : "hover:bg-gray-50"}>
                  <td className="px-5 py-2.5 font-bold text-gray-500">{i + 1}</td>
                  <td className="px-5 py-2.5 font-medium text-gray-800">{s.name ?? s.playerId?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{s.matchesPlayed}</td>
                  <td className="px-4 py-2.5 text-center text-green-600 font-semibold">{s.wins}</td>
                  <td className="px-4 py-2.5 text-center text-red-400">{s.losses}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{s.pointsFor}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{s.pointsAgainst}</td>
                  <td className={`px-4 py-2.5 text-center font-medium ${s.pointsDiff >= 0 ? "text-green-600" : "text-red-400"}`}>
                    {s.pointsDiff >= 0 ? "+" : ""}{s.pointsDiff}
                  </td>
                  <td className="px-4 py-2.5 text-center font-bold text-teal-700">{s.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex justify-center py-12">
    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
  </div>
);

const Empty = ({ text }) => (
  <div className="text-center py-14 text-gray-400 text-sm">{text}</div>
);

// ── Main component ────────────────────────────────────────────────────────────
const TournamentDetail = () => {
  const navigate = useNavigate();
  const { id: tournamentId } = useParams();
  const [tab, setTab] = useState("players");

  const { data: tData, isLoading: tLoading } = useGetRoundRobinTournament(tournamentId);
  const { mutate: generateGroups, isPending: isGenerating } = useGenerateGroups();
  const { mutate: finalize, isPending: isFinalizing } = useFinalizeRoundRobinTournament();

  const tournament = tData?.data;

  if (tLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
    </div>
  );

  if (!tournament) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Tournament not found.
    </div>
  );

  const canGenerate = ["Draft", "Active", "Scheduled"].includes(tournament.status);
  const canFinalize = tournament.status === "Scheduled";

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/round-robin/tournaments")}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-teal-800 leading-tight">{tournament.tournamentName}</h2>
            <p className="text-xs text-gray-400">{tournament.matchType} · {tournament.numberOfGroups} groups · {tournament.numberOfCourts} courts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[tournament.status] ?? ""}`}>
            {tournament.status}
          </span>
          <Logout />
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          {canGenerate && (
            <button
              onClick={() => generateGroups(tournamentId)}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {isGenerating ? "Generating..." : tournament.groups?.length > 0 ? "Regenerate Groups & Matches" : "Generate Groups & Matches"}
            </button>
          )}
          {canFinalize && (
            <button
              onClick={() => finalize(tournamentId)}
              disabled={isFinalizing}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {isFinalizing ? "Finalizing..." : "Finalize Tournament"}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === key
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "players"   && <PlayersTab tournamentId={tournamentId} />}
        {tab === "groups"    && <GroupsTab  tournamentId={tournamentId} />}
        {tab === "matches"   && <MatchesTab tournamentId={tournamentId} />}
        {tab === "standings" && <StandingsTab tournamentId={tournamentId} />}
      </div>
    </div>
  );
};

export default TournamentDetail;
