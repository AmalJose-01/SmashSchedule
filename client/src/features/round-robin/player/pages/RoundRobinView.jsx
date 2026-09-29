import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Trophy, Loader2, MapPin, Users } from "lucide-react";
import AppBackground from "../../../../components/AppBackground.jsx";
import PageHeader from "../../../../components/PageHeader.jsx";
import { useRoundRobinView } from "../services/playerRoundRobin.js";

const STATUS_LABELS = { Draft: "Upcoming", Scheduled: "Scheduled", Finalized: "Scheduled", Ongoing: "Live", Completed: "Completed", Active: "Active" };
const MATCH_STATUS = {
  scheduled: { label: "Scheduled", cls: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  ongoing: { label: "Live", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
  completed: { label: "Score", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  cancelled: { label: "Cancelled", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
};

const idOf = (x) => (x ? String(x._id ?? x) : null);
const teamName = (a, b) => (b ? `${a?.name ?? "—"} / ${b?.name ?? "—"}` : a?.name ?? "—");
const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl ${className}`}>{children}</div>
);

// ── Schedule ─────────────────────────────────────────────────────────────────
const MatchRow = ({ m }) => {
  const done = m.status === "completed";
  const homeWon = done && !m.isDraw && idOf(m.winner) === idOf(m.player1Id);
  const awayWon = done && !m.isDraw && !homeWon && !!m.winner;
  const st = MATCH_STATUS[m.status] ?? MATCH_STATUS.scheduled;
  const side = (won, lost) => (won ? "text-emerald-300 font-semibold" : lost ? "text-slate-500" : "text-white");

  if (m.isBye) {
    return (
      <div className="h-full flex items-center gap-3 px-4 py-3 bg-slate-900/40 border border-slate-700/50 rounded-xl">
        <span className="flex-1 text-sm text-white">{teamName(m.player1Id, m.player1PartnerId)}</span>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-yellow-500/15 text-yellow-300 border-yellow-500/30">Walkover</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-center px-4 py-3 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl">
      <div className="flex items-center justify-between gap-2 mb-1.5 text-[11px] text-slate-500">
        <span className="truncate">{m.court ? `Court ${String(m.court).replace(/^court\s*/i, "")}` : ""}{m.slot ? ` · Round ${m.slot}` : ""}</span>
        <span className={`flex-shrink-0 font-semibold px-2 py-0.5 rounded-full border ${st.cls}`}>{m.isDraw && done ? "Draw" : st.label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 space-y-1 text-sm">
          <p className={`truncate ${side(homeWon, awayWon)}`}>{teamName(m.player1Id, m.player1PartnerId)}</p>
          <p className={`truncate ${side(awayWon, homeWon)}`}>{teamName(m.player2Id, m.player2PartnerId)}</p>
        </div>
        {m.sets?.length > 0 && (
          <div className="flex gap-1.5 font-mono text-sm">
            {m.sets.map((s, i) => (
              <div key={i} className="flex flex-col items-center w-7 rounded-md bg-slate-800/80 py-0.5">
                <span className={Number(s.home) > Number(s.away) ? "text-white" : "text-slate-500"}>{s.home}</span>
                <span className={Number(s.away) > Number(s.home) ? "text-white" : "text-slate-500"}>{s.away}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ScheduleTab = ({ matches, matchType }) => {
  if (matches.length === 0)
    return <Card className="p-10 text-center text-slate-400 text-sm">The schedule will appear once the organiser finalises the matches.</Card>;

  const byGroup = matches.reduce((acc, m) => {
    let key;
    if (m.gradeGroupLabel) key = m.gradeGroupLabel;
    else if (matchType === "Doubles") {
      const parts = (m.matchName || "").split(" - Match ");
      key = parts.length > 1 ? parts[0] : m.groupId?.groupName ?? "Matches";
    } else key = m.groupId?.groupName ?? "Matches";
    (acc[key] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(byGroup).map(([name, list]) => {
        const done = list.filter((m) => m.status === "completed").length;
        return (
          <div key={name}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/50">
              <h3 className="text-sm sm:text-base font-semibold text-white">{name}</h3>
              <span className="text-xs text-slate-500">{done}/{list.length} played</span>
            </div>
            {/* 1 per row on phones, 2 on tablets, 3 on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {list.map((m) => <MatchRow key={m._id} m={m} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────
const RoundRobinView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading, isError } = useRoundRobinView(id);

  const tournament = data?.tournament;
  const matches = data?.matches ?? [];

  return (
    <AppBackground variant="user">
      <PageHeader
        variant="user"
        title={tournament?.tournamentName || "Round Robin"}
        subtitle={tournament ? `${tournament.matchType} · ${STATUS_LABELS[tournament.status] ?? tournament.status}` : undefined}
        onBack={() => navigate(-1)}
        profileMenu
      />

      <div className="w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>
        ) : isError || !tournament ? (
          <Card className="p-10 text-center text-slate-300">Couldn&apos;t load this round robin.</Card>
        ) : (
          <>
            {/* Summary */}
            <Card className="p-4 sm:p-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              {fmtDate(tournament.startDate) && (
                <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-emerald-400" />{fmtDate(tournament.startDate)}</span>
              )}
              {tournament.numberOfCourts != null && (
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-400" />{tournament.numberOfCourts} courts</span>
              )}
              {tournament.numberOfSlots != null && (
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-emerald-400" />{tournament.numberOfSlots} slots</span>
              )}
              <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4 text-emerald-400" />Best of {tournament.numberOfSets ?? 3} · to {tournament.setWinningPoint ?? 21}</span>
            </Card>

            <ScheduleTab matches={matches} matchType={tournament.matchType} />
          </>
        )}
      </div>
    </AppBackground>
  );
};

export default RoundRobinView;
