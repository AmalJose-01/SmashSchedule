import React, { useMemo, useState } from "react";
import { X, CalendarDays, Repeat, CopyPlus } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkCreateRoundRobinTournamentsAPI } from "../services/roundRobin.services.js";
import { rrKeys } from "../services/roundRobin.queries.js";

// Bulk-create recurring round robin tournaments from an existing one.
// Only the configuration (format, courts, slots, scoring, fees…) is copied —
// never players, groups or matches. Dates are computed here, in the admin's
// local timezone, so "every Monday at 6pm" means 6pm on the admin's clock.

const REPEAT_OPTIONS = [
  { value: "daily", label: "Every day" },
  { value: "1", label: "Every Monday" },
  { value: "2", label: "Every Tuesday" },
  { value: "3", label: "Every Wednesday" },
  { value: "4", label: "Every Thursday" },
  { value: "5", label: "Every Friday" },
  { value: "6", label: "Every Saturday" },
  { value: "0", label: "Every Sunday" },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MAX_OCCURRENCES = 400;
const DEFAULT_START_HOUR = 18; // used when the template has no start date
const DEFAULT_DEADLINE_OFFSET_MS = 2 * 60 * 60 * 1000; // deadline 2h before start when the template has none

const fmtDay = (d) => d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const fmtDateTime = (d) =>
  d.toLocaleString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const buildOccurrences = ({ source, baseName, repeat, endMonth, endYear }) => {
  if (!source) return [];
  const now = new Date();
  const srcStart = source.startDate ? new Date(source.startDate) : null;
  const srcDeadline = source.registrationDeadline ? new Date(source.registrationDeadline) : null;
  const srcEnd = source.endDate ? new Date(source.endDate) : null;

  const hour = srcStart ? srcStart.getHours() : DEFAULT_START_HOUR;
  const minute = srcStart ? srcStart.getMinutes() : 0;
  const deadlineOffset =
    srcStart && srcDeadline && srcStart - srcDeadline >= 0 ? srcStart - srcDeadline : DEFAULT_DEADLINE_OFFSET_MS;
  const duration = srcStart && srcEnd && srcEnd - srcStart > 0 ? srcEnd - srcStart : null;

  const lastDay = new Date(endYear, endMonth + 1, 0); // last day of the chosen month
  const out = [];
  for (
    let day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    day <= lastDay && out.length <= MAX_OCCURRENCES;
    day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
  ) {
    if (repeat !== "daily" && day.getDay() !== Number(repeat)) continue;
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
    const deadline = new Date(start.getTime() - deadlineOffset);
    if (deadline <= now) continue; // registration would already be closed
    out.push({
      tournamentName: `${baseName.trim()} – ${fmtDay(start)}`,
      startDate: start.toISOString(),
      endDate: duration ? new Date(start.getTime() + duration).toISOString() : undefined,
      registrationDeadline: deadline.toISOString(),
    });
  }
  return out;
};

const selectCls =
  "w-full px-3 py-2.5 bg-slate-900/60 border border-slate-600 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent";

const BulkCreateTournamentsModal = ({ tournaments, onClose }) => {
  const queryClient = useQueryClient();
  const now = new Date();
  const [sourceId, setSourceId] = useState(tournaments[0]?._id ?? "");
  const source = tournaments.find((t) => t._id === sourceId);
  const [baseName, setBaseName] = useState(tournaments[0]?.tournamentName ?? "");
  const [repeat, setRepeat] = useState("1");
  const [endMonth, setEndMonth] = useState(now.getMonth());
  const [endYear, setEndYear] = useState(now.getFullYear());

  const years = [0, 1, 2].map((n) => now.getFullYear() + n);
  const monthDisabled = (m) => endYear === now.getFullYear() && m < now.getMonth();

  const occurrences = useMemo(
    () => buildOccurrences({ source, baseName: baseName || source?.tournamentName || "", repeat, endMonth, endYear }),
    [source, baseName, repeat, endMonth, endYear]
  );
  const tooMany = occurrences.length > MAX_OCCURRENCES;

  const { mutate, isPending } = useMutation({
    mutationFn: bulkCreateRoundRobinTournamentsAPI,
    onSuccess: (res) => {
      toast.success(res?.message || "Tournaments created");
      queryClient.invalidateQueries({ queryKey: rrKeys.tournaments });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to create tournaments"),
  });

  const handleSource = (id) => {
    setSourceId(id);
    const t = tournaments.find((x) => x._id === id);
    if (t) setBaseName(t.tournamentName);
  };

  const handleYear = (y) => {
    setEndYear(y);
    if (y === now.getFullYear() && endMonth < now.getMonth()) setEndMonth(now.getMonth());
  };

  const handleSubmit = () => {
    if (!source || occurrences.length === 0 || tooMany || !baseName.trim()) return;
    mutate({ sourceTournamentId: source._id, occurrences });
  };

  const first = occurrences[0];
  const last = occurrences[occurrences.length - 1];

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <CopyPlus className="w-5 h-5 text-cyan-300" />
            <h3 className="text-lg font-semibold text-white">Bulk Create Tournaments</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Copy configuration from</label>
            <select value={sourceId} onChange={(e) => handleSource(e.target.value)} className={selectCls}>
              {tournaments.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.tournamentName} ({t.matchType}{t.format ? ` · ${t.format}` : ""})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1.5">
              Only settings are copied (format, courts, slots, scoring, fees). Players, groups and matches are not.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Tournament name</label>
            <input
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              className={selectCls}
              placeholder="e.g. Monday Night Round Robin"
            />
            <p className="text-xs text-slate-500 mt-1.5">The date is added to each name automatically.</p>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              <Repeat className="w-3.5 h-3.5" /> Repeat
            </label>
            <select value={repeat} onChange={(e) => setRepeat(e.target.value)} className={selectCls}>
              {REPEAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Repeat until (end of)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select value={endMonth} onChange={(e) => setEndMonth(Number(e.target.value))} className={selectCls}>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i} disabled={monthDisabled(i)}>{m}</option>
                ))}
              </select>
              <select value={endYear} onChange={(e) => handleYear(Number(e.target.value))} className={selectCls}>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className={`rounded-xl border px-4 py-3 text-sm ${tooMany ? "border-red-500/40 bg-red-500/10" : "border-cyan-500/30 bg-cyan-500/5"}`}>
            {occurrences.length === 0 ? (
              <p className="text-slate-300">No upcoming dates in this range.</p>
            ) : tooMany ? (
              <p className="text-red-300">That's more than {MAX_OCCURRENCES} tournaments — pick an earlier end month.</p>
            ) : (
              <>
                <p className="text-cyan-200 font-semibold">
                  {occurrences.length} tournament{occurrences.length !== 1 ? "s" : ""} will be created
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  First: {fmtDateTime(new Date(first.startDate))}
                  {occurrences.length > 1 && <> · Last: {fmtDateTime(new Date(last.startDate))}</>}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Start time and registration deadline follow the template
                  {source?.startDate ? "" : " (no start date on template — defaults to 6:00 pm, deadline 2 h before)"}.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end px-6 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-600 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !source || occurrences.length === 0 || tooMany || !baseName.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-semibold shadow-lg shadow-cyan-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Creating..." : `Create ${tooMany ? "" : occurrences.length || ""} Tournament${occurrences.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkCreateTournamentsModal;
