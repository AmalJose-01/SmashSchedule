import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Swords, MapPin, Layers, Trophy,
  Loader2, CheckCircle, Clock
} from "lucide-react";
import Logout from "../../../../components/Logout.jsx";
import ScoreEntry from "../components/ScoreEntry.jsx";
import {
  useGetMatches,
  useGetStandings,
  useGetRoundRobinTournament,
} from "../services/roundRobin.queries.js";

const STATUS_STYLES = {
  scheduled:  { cls: "bg-gray-100 text-gray-600",   icon: Clock },
  ongoing:    { cls: "bg-yellow-100 text-yellow-700", icon: Swords },
  completed:  { cls: "bg-green-100 text-green-700",  icon: CheckCircle },
  cancelled:  { cls: "bg-red-100 text-red-500",      icon: null },
};

const GRADE_COLORS = {
  A: "bg-red-100 text-red-700", B: "bg-orange-100 text-orange-700",
  C: "bg-yellow-100 text-yellow-700", D: "bg-green-100 text-green-700",
  E: "bg-blue-100 text-blue-700", Unrated: "bg-gray-100 text-gray-600",
};

const MatchManagement = () => {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get("tournament");
  const [scoredMatchId, setScoredMatchId] = useState(null);

  const { data: matchesData, isLoading: matchesLoading } = useGetMatches(tournamentId);
  const { data: tData } = useGetRoundRobinTournament(tournamentId);
  const { data: standingsData, isLoading: standingsLoading } = useGetStandings(tournamentId);

  const matches = matchesData?.data ?? [];
  const match = matches.find((m) => m._id === matchId);
  const tournament = tData?.data;
  const standings = standingsData?.data ?? [];

  // Find the group's standings for this match
  const groupStandings = standings.find(
    (g) => g._id === match?.groupId?._id || g._id === match?.groupId
  );

  const handleScoreRecorded = () => {
    setScoredMatchId(matchId);
  };

  if (matchesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-400">
        <Swords className="w-12 h-12 text-gray-300" />
        <p>Match not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-teal-600 font-medium text-sm hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_STYLES[match.status] ?? STATUS_STYLES.scheduled;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/round-robin/tournament/${tournamentId}`)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-teal-800 leading-tight">
              {match.matchName}
            </h2>
            {tournament && (
              <p className="text-xs text-gray-400">{tournament.tournamentName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${statusInfo.cls}`}>
            {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
            {match.status}
          </span>
          <Logout />
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-6">

        {/* Match info card */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-500 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>{match.groupId?.groupName ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{match.court || "—"}</span>
            </div>
          </div>

          {/* Players */}
          <div className="flex items-center gap-4">
            <PlayerCard player={match.player1Id} label="Home" winner={match.winner?._id === match.player1Id?._id || match.winner === match.player1Id?._id} />
            <span className="text-2xl text-gray-300 font-bold flex-shrink-0">VS</span>
            <PlayerCard player={match.player2Id} label="Away" winner={match.winner?._id === match.player2Id?._id || match.winner === match.player2Id?._id} />
          </div>

          {/* Existing scores summary */}
          {match.sets?.length > 0 && (
            <div className="flex justify-center gap-3 pt-2">
              {match.sets.map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Set {i + 1}</p>
                  <p className="font-mono font-bold text-gray-700">
                    {s.home} — {s.away}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Score entry */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Swords className="w-4 h-4 text-teal-600" />
            Score Entry
          </h3>
          <ScoreEntry
            match={match}
            tournamentId={tournamentId}
            onScoreRecorded={handleScoreRecorded}
          />
        </div>

        {/* Group standings for this match */}
        {groupStandings && (
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-teal-50 border-b border-teal-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-teal-600" />
              <h3 className="font-semibold text-teal-800 text-sm">
                {groupStandings.groupName} Standings
              </h3>
            </div>
            {standingsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">#</th>
                    <th className="px-4 py-2 text-left font-semibold">Player</th>
                    <th className="px-4 py-2 text-center font-semibold">W</th>
                    <th className="px-4 py-2 text-center font-semibold">L</th>
                    <th className="px-4 py-2 text-center font-semibold">+/-</th>
                    <th className="px-4 py-2 text-center font-semibold">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(groupStandings.standings ?? []).map((s, i) => {
                    const isInThisMatch =
                      s.playerId === match.player1Id?._id ||
                      s.playerId === match.player2Id?._id ||
                      s.playerId?._id === match.player1Id?._id ||
                      s.playerId?._id === match.player2Id?._id;
                    return (
                      <tr
                        key={i}
                        className={`${i === 0 ? "bg-yellow-50" : "hover:bg-gray-50"} ${isInThisMatch ? "font-semibold" : ""}`}
                      >
                        <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                        <td className="px-4 py-2.5 text-gray-800">{s.name ?? s.playerId?.name ?? "—"}</td>
                        <td className="px-4 py-2.5 text-center text-green-600">{s.wins}</td>
                        <td className="px-4 py-2.5 text-center text-red-400">{s.losses}</td>
                        <td className={`px-4 py-2.5 text-center ${s.pointsDiff >= 0 ? "text-green-600" : "text-red-400"}`}>
                          {s.pointsDiff >= 0 ? "+" : ""}{s.pointsDiff}
                        </td>
                        <td className="px-4 py-2.5 text-center font-bold text-teal-700">{s.totalPoints}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Other matches in same group */}
        <OtherMatches matches={matches} currentMatchId={matchId} groupId={match.groupId?._id ?? match.groupId} tournamentId={tournamentId} />
      </div>
    </div>
  );
};

// ── Player card ───────────────────────────────────────────────────────────────
const PlayerCard = ({ player, label, winner }) => (
  <div className={`flex-1 text-center p-4 rounded-xl transition-colors ${winner ? "bg-teal-50 border-2 border-teal-300" : "bg-gray-50"}`}>
    {winner && <Trophy className="w-4 h-4 text-teal-500 mx-auto mb-1" />}
    <p className="font-semibold text-gray-800 text-sm truncate">{player?.name ?? "—"}</p>
    {player?.grade && (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${GRADE_COLORS[player.grade] ?? GRADE_COLORS.Unrated}`}>
        {player.grade}
      </span>
    )}
    <p className="text-xs text-gray-400 mt-1">{label}</p>
  </div>
);

// ── Other matches in this group ───────────────────────────────────────────────
const OtherMatches = ({ matches, currentMatchId, groupId, tournamentId }) => {
  const navigate = useNavigate();
  const others = matches.filter(
    (m) =>
      m._id !== currentMatchId &&
      (m.groupId?._id === groupId || m.groupId === groupId)
  );

  if (others.length === 0) return null;

  const STATUS_STYLES_MATCH = {
    scheduled:  "bg-gray-100 text-gray-500",
    ongoing:    "bg-yellow-100 text-yellow-700",
    completed:  "bg-green-100 text-green-700",
    cancelled:  "bg-red-100 text-red-400",
  };

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-700 mb-3 text-sm">Other Matches in Group</h3>
      <div className="space-y-2">
        {others.map((m) => (
          <div
            key={m._id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
            onClick={() => navigate(`/round-robin/match/${m._id}?tournament=${tournamentId}`)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {m.player1Id?.name ?? "—"} vs {m.player2Id?.name ?? "—"}
              </p>
              <p className="text-xs text-gray-400">{m.court}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {m.sets?.length > 0 && (
                <span className="text-xs text-gray-400 font-mono">
                  {m.sets.map((s) => `${s.home}-${s.away}`).join(", ")}
                </span>
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES_MATCH[m.status] ?? ""}`}>
                {m.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchManagement;
