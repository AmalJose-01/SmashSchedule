import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CalendarDays, ChevronRight, Users } from "lucide-react";
import { setTournamentData } from "../../../redux/slices/tournamentSlice";

const statusCls = (s = "") => {
  const k = s.toLowerCase();
  if (["ongoing", "groupstage", "knockoutstage", "active"].includes(k)) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (["scheduled", "finalized", "create", "draft"].includes(k)) return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
  if (["finished", "completed"].includes(k)) return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
};

// Players see admin-side statuses in friendlier words.
const STATUS_LABELS = { Draft: "Upcoming", Create: "Upcoming", GroupStage: "Group stage", KnockoutStage: "Knockout", finished: "Finished" };

const StatusPill = ({ status }) =>
  status ? (
    <span className={`flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusCls(status)}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  ) : null;

const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : null);

export const TournamentRow = ({ t }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => {
        dispatch(setTournamentData(t));
        navigate("/tournamentInfo");
      }}
      className="group w-full flex items-center gap-3 text-left bg-slate-900/40 hover:bg-slate-900/70 border border-slate-700/50 hover:border-emerald-500/40 rounded-xl px-4 py-3 transition-all"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">{t.tournamentName}</p>
        <p className="flex flex-wrap items-center gap-x-3 text-xs text-slate-400 mt-0.5">
          {(t.date || t.time) && (
            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{[t.date, t.time].filter(Boolean).join(" · ")}</span>
          )}
          {t.maximumParticipants != null && (
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.registeredTeamsCount ?? 0}/{t.maximumParticipants}</span>
          )}
        </p>
      </div>
      <StatusPill status={t.status} />
      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
    </button>
  );
};

export const RoundRobinRow = ({ r }) => {
  const navigate = useNavigate();
  return (
  <button
    type="button"
    onClick={() => navigate(`/user/round-robin/${r._id}`)}
    className="group w-full flex items-center gap-3 text-left bg-slate-900/40 hover:bg-slate-900/70 border border-slate-700/50 hover:border-emerald-500/40 rounded-xl px-4 py-3 transition-all"
  >
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-white truncate">{r.tournamentName}</p>
      <p className="flex flex-wrap items-center gap-x-3 text-xs text-slate-400 mt-0.5">
        <span>{r.matchType}</span>
        {fmt(r.startDate) && (
          <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{fmt(r.startDate)}</span>
        )}
        {r.numberOfSlots != null && (
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.numberOfSlots} slots</span>
        )}
      </p>
    </div>
    <StatusPill status={r.status} />
    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
  </button>
  );
};
