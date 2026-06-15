import React, { useState, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Swords, Trophy,
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

  const isDoubles = !!(match?.player1PartnerId);

  // Singles: find the one group standings for this match
  const groupStandings = !isDoubles
    ? standings.find(
        (g) => g._id === match?.groupId?._id || g._id === match?.groupId
      )
    : null;

  // Doubles: aggregate player-level stats into group-level standings.
  // Each doubles match credits 2 players per side, so sum / 2 = group total.
  const doublesGroupStandings = useMemo(() => {
    if (!isDoubles || !standings.length) return null;

    const homeGroupId = (match?.groupId?._id ?? match?.groupId)?.toString();
    const awayGroupId = standings
      .find((g) =>
        g.standings?.some(
          (s) =>
            s.playerId?.toString() === match?.player2Id?._id?.toString() ||
            s.playerId?.toString() === match?.player2Id?.toString()
        )
      )
      ?._id?.toString();

    const rows = standings.map((group) => {
      const players = group.standings ?? [];
      const sum = players.reduce(
        (acc, p) => ({
          wins:          acc.wins          + (p.wins          || 0),
          losses:        acc.losses        + (p.losses        || 0),
          matchesPlayed: acc.matchesPlayed + (p.matchesPlayed || 0),
          totalPoints:   acc.totalPoints   + (p.totalPoints   || 0),
          pointsFor:     acc.pointsFor     + (p.pointsFor     || 0),
          pointsAgainst: acc.pointsAgainst + (p.pointsAgainst || 0),
        }),
        { wins: 0, losses: 0, matchesPlayed: 0, totalPoints: 0, pointsFor: 0, pointsAgainst: 0 }
      );
      const gid = group._id?.toString();
      return {
        _id:           gid,
        groupName:     group.groupName,
        wins:          sum.wins / 2,
        losses:        sum.losses / 2,
        matchesPlayed: sum.matchesPlayed / 2,
        totalPoints:   sum.totalPoints / 2,
        pointsDiff:    (sum.pointsFor - sum.pointsAgainst) / 2,
        isHomeGroup:   gid === homeGroupId,
        isAwayGroup:   gid === awayGroupId,
      };
    });

    // Sort: totalPoints → pointsDiff
    rows.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.pointsDiff - a.pointsDiff;
    });

    return rows;
  }, [isDoubles, standings, match]);

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

      {/* ── Sticky standings (always visible below header) ────────────────────── */}
      {(groupStandings || doublesGroupStandings) && (
        <div className="sticky top-[64px] z-[5] bg-white shadow border-b border-gray-100 overflow-hidden">
          <div className="px-5 py-2 bg-teal-50 border-b border-teal-100 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-teal-600" />
            <h3 className="font-semibold text-teal-800 text-sm">
              {groupStandings ? `${groupStandings.groupName} Standings` : "Group Standings"}
            </h3>
            {standingsLoading && <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin ml-auto" />}
          </div>

          {/* Singles standings */}
          {groupStandings && !standingsLoading && (
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs sticky top-0">
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
                    const sid = s.playerId?.toString?.() ?? s.playerId;
                    const isInThisMatch =
                      sid === match.player1Id?._id?.toString() ||
                      sid === match.player1Id?.toString() ||
                      sid === match.player2Id?._id?.toString() ||
                      sid === match.player2Id?.toString();
                    return (
                      <tr key={i} className={`${i === 0 ? "bg-yellow-50" : "hover:bg-gray-50"} ${isInThisMatch ? "font-semibold" : ""}`}>
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
            </div>
          )}

          {/* Doubles group standings */}
          {doublesGroupStandings && !standingsLoading && (
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">#</th>
                    <th className="px-4 py-2 text-left font-semibold">Group</th>
                    <th className="px-4 py-2 text-center font-semibold">W</th>
                    <th className="px-4 py-2 text-center font-semibold">L</th>
                    <th className="px-4 py-2 text-center font-semibold">+/-</th>
                    <th className="px-4 py-2 text-center font-semibold">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {doublesGroupStandings.map((g, i) => (
                    <tr
                      key={g._id}
                      className={`${i === 0 ? "bg-yellow-50" : "hover:bg-gray-50"} ${g.isHomeGroup || g.isAwayGroup ? "font-semibold" : ""}`}
                    >
                      <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-2.5 text-gray-800">
                        <span className="flex items-center gap-1.5">
                          {g.groupName}
                          {g.isHomeGroup && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">HOME</span>}
                          {g.isAwayGroup && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">AWAY</span>}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-green-600">{g.wins}</td>
                      <td className="px-4 py-2.5 text-center text-red-400">{g.losses}</td>
                      <td className={`px-4 py-2.5 text-center ${g.pointsDiff >= 0 ? "text-green-600" : "text-red-400"}`}>
                        {g.pointsDiff >= 0 ? "+" : ""}{g.pointsDiff}
                      </td>
                      <td className="px-4 py-2.5 text-center font-bold text-teal-700">{g.totalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="px-[10px] py-6 w-full space-y-6">


        {/* Score entry */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
          <ScoreEntry
            match={match}
            tournamentId={tournamentId}
            tournament={tournament}
            onScoreRecorded={handleScoreRecorded}
          />
        </div>

        {/* Other matches in same fixture */}
        <OtherMatches
          matches={matches}
          currentMatchId={matchId}
          match={match}
          isDoubles={isDoubles}
          groupId={match.groupId?._id ?? match.groupId}
          tournamentId={tournamentId}
        />
      </div>
    </div>
  );
};

// ── Player card ───────────────────────────────────────────────────────────────
const PlayerCard = ({ player, partner, label, winner }) => (
  <div className={`flex-1 text-center p-4 rounded-xl transition-colors ${winner ? "bg-teal-50 border-2 border-teal-300" : "bg-gray-50"}`}>
    {winner && <Trophy className="w-4 h-4 text-teal-500 mx-auto mb-1" />}
    <p className="font-semibold text-gray-800 text-sm truncate">{player?.name ?? "—"}</p>
    {partner && (
      <p className="font-semibold text-gray-600 text-sm truncate">/ {partner.name}</p>
    )}
    {player?.grade && (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${GRADE_COLORS[player.grade] ?? GRADE_COLORS.Unrated}`}>
        {player.grade}
      </span>
    )}
    <p className="text-xs text-gray-400 mt-1">{label}</p>
  </div>
);

// ── Other matches in this fixture ────────────────────────────────────────────
const OtherMatches = ({ matches, currentMatchId, match, isDoubles, groupId, tournamentId }) => {
  const navigate = useNavigate();

  // For doubles, group by fixture name prefix ("Group A vs Group B")
  // For singles, group by groupId
  const fixtureName = isDoubles
    ? (() => { const parts = match?.matchName?.split(" - Match "); return parts?.length > 1 ? parts[0] : null; })()
    : null;

  const others = matches.filter((m) => {
    if (m._id === currentMatchId) return false;
    if (isDoubles && fixtureName) {
      return m.matchName?.startsWith(fixtureName + " - Match ");
    }
    return m.groupId?._id === groupId || m.groupId === groupId;
  });

  if (others.length === 0) return null;

  const STATUS_STYLES_MATCH = {
    scheduled:  "bg-gray-100 text-gray-500",
    ongoing:    "bg-yellow-100 text-yellow-700",
    completed:  "bg-green-100 text-green-700",
    cancelled:  "bg-red-100 text-red-400",
  };

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-700 mb-3 text-sm">
        {isDoubles ? `Other Matches — ${fixtureName ?? "Fixture"}` : "Other Matches in Group"}
      </h3>
      <div className="space-y-2">
        {others.map((m) => {
          const isCompleted = m.status === "completed";
          const winnerId = m.winner?._id?.toString() ?? m.winner?.toString();
          const p1Id     = m.player1Id?._id?.toString() ?? m.player1Id?.toString();
          const homeWon  = isCompleted && !!winnerId && winnerId === p1Id;
          const awayWon  = isCompleted && !!winnerId && winnerId !== p1Id;

          const team1Name = m.player1PartnerId
            ? `${m.player1Id?.name ?? "—"} / ${m.player1PartnerId?.name ?? "—"}`
            : (m.player1Id?.name ?? "—");
          const team2Name = m.player2PartnerId
            ? `${m.player2Id?.name ?? "—"} / ${m.player2PartnerId?.name ?? "—"}`
            : (m.player2Id?.name ?? "—");

          return (
            <div
              key={m._id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
              onClick={() => navigate(`/round-robin/match/${m._id}?tournament=${tournamentId}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded-lg ${
                    homeWon ? "bg-green-100 text-green-700" :
                    awayWon ? "text-red-400" :
                    "text-gray-700"
                  }`}>{team1Name}</span>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold flex-shrink-0">VS</span>
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded-lg ${
                    awayWon ? "bg-green-100 text-green-700" :
                    homeWon ? "text-red-400" :
                    "text-gray-700"
                  }`}>{team2Name}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{m.court}</p>
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
          );
        })}
      </div>
    </div>
  );
};

export default MatchManagement;
