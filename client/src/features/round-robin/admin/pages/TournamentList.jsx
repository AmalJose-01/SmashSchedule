import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trophy, Trash2, ChevronRight, CalendarDays, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetRoundRobinTournaments,
  useDeleteRoundRobinTournament,
  rrKeys,
} from "../services/roundRobin.queries.js";
import { deleteRoundRobinTournamentAPI } from "../services/roundRobin.services.js";
import AppBackground from "../../../../components/AppBackground.jsx";
import PageHeader from "../../../../components/PageHeader.jsx";

const STATUS_STYLES = {
  Draft:      "bg-slate-500/15 text-slate-300 border border-slate-500/30",
  Active:     "bg-blue-500/15 text-blue-300 border border-blue-500/30",
  Scheduled:  "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30",
  Finalized:  "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30",
  Ongoing:    "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  Completed:  "bg-purple-500/15 text-purple-300 border border-purple-500/30",
};

const TournamentList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId]     = useState(null);
  const [selected, setSelected]         = useState(new Set());
  const [confirmBulk, setConfirmBulk]   = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const { data, isLoading } = useGetRoundRobinTournaments();
  const { mutate: deleteTournament, isPending: isDeleting } = useDeleteRoundRobinTournament();

  const tournaments = data?.data ?? [];

  const allSelected = tournaments.length > 0 && tournaments.every((t) => selected.has(t._id));
  const someSelected = selected.size > 0;

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(tournaments.map((t) => t._id)));
    }
  };

  const clearSelection = () => setSelected(new Set());

  const handleDeleteConfirm = () => {
    deleteTournament(deletingId, { onSettled: () => setDeletingId(null) });
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    setConfirmBulk(false);
    const ids = [...selected];
    try {
      await Promise.all(ids.map((id) => deleteRoundRobinTournamentAPI(id)));
      toast.success(`${ids.length} tournament${ids.length !== 1 ? "s" : ""} deleted`);
      clearSelection();
      queryClient.invalidateQueries({ queryKey: rrKeys.tournaments });
    } catch {
      toast.error("Some tournaments could not be deleted");
      queryClient.invalidateQueries({ queryKey: rrKeys.tournaments });
    } finally {
      setBulkDeleting(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <AppBackground>
      <PageHeader
        title="Round Robin Tournaments"
        subtitle="All your tournaments in one place"
        onBack={() => navigate("/round-robin/dashboard")}
        actions={
          <button
            onClick={() => navigate("/round-robin/create-tournament")}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white px-4 h-10 rounded-xl font-semibold text-sm shadow-lg shadow-cyan-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Tournament</span>
          </button>
        }
      />

      <div className="p-6 max-w-5xl mx-auto">
        {/* Count + select all row */}
        {tournaments.length > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
            />
            <p className="text-sm text-slate-300">
              {tournaments.length} tournament{tournaments.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Bulk action bar */}
        {someSelected && (
          <div className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-xl rounded-xl px-4 py-2.5 mb-4">
            <span className="text-sm font-medium text-cyan-300">
              {selected.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={clearSelection}
                className="text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                Deselect all
              </button>
              <button
                onClick={() => setConfirmBulk(true)}
                disabled={bulkDeleting}
                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {bulkDeleting ? "Deleting..." : `Delete ${selected.size}`}
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16 text-slate-400">Loading tournaments...</div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl">
            <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-medium mb-4">No tournaments yet.</p>
            <button
              onClick={() => navigate("/round-robin/create-tournament")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create First Tournament
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((t) => {
              const isSelected = selected.has(t._id);
              return (
                <div
                  key={t._id}
                  className={`relative overflow-hidden bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border p-5 cursor-pointer transition-all group hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-cyan-500/10 ${isSelected ? "border-cyan-400/60 ring-2 ring-cyan-400/20" : "border-slate-700/50 hover:border-cyan-500/40"}`}
                  onClick={() => navigate(`/round-robin/tournament/${t._id}`)}
                >
                  {/* Checkbox */}
                  <div
                    className="absolute top-3 left-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(t._id)}
                      className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-start justify-between mb-3 pl-6">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[t.status] ?? STATUS_STYLES.Draft}`}>
                      {t.status}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingId(t._id); }}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 hover:text-red-300 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-semibold text-white text-base mb-1 leading-snug">
                    {t.tournamentName}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    {t.matchType} · {t.numberOfGroups} group{t.numberOfGroups !== 1 ? "s" : ""} · {t.numberOfCourts} court{t.numberOfCourts !== 1 ? "s" : ""}
                  </p>

                  {(t.startDate || t.endDate) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {formatDate(t.startDate)}
                      {t.endDate && <> → {formatDate(t.endDate)}</>}
                    </div>
                  )}

                  {(t.numberOfSlots || t.registrationDeadline) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {t.numberOfSlots ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-slate-900/50 border border-slate-700/60 rounded-full px-2 py-0.5">
                          <Users className="w-3 h-3" /> {t.numberOfSlots} slots
                        </span>
                      ) : null}
                      {t.registrationDeadline && (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 border ${
                            new Date(t.registrationDeadline) <= new Date()
                              ? "text-slate-400 bg-slate-900/50 border-slate-700/60"
                              : "text-amber-300 bg-amber-500/10 border-amber-500/30"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {new Date(t.registrationDeadline) <= new Date() ? "Registration closed" : `Register by ${formatDate(t.registrationDeadline)}`}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end text-cyan-400 group-hover:text-cyan-300 text-xs font-medium">
                    View <ChevronRight className="w-4 h-4 ml-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Single Delete Confirm */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Tournament?</h3>
            <p className="text-sm text-slate-400 mb-6">
              This will permanently delete the tournament, all its groups and matches. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-600 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 shadow-lg shadow-red-500/30 disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm */}
      {confirmBulk && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-2">
              Delete {selected.size} Tournament{selected.size !== 1 ? "s" : ""}?
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              This will permanently delete all selected tournaments, their groups and matches. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmBulk(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-600 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 shadow-lg shadow-red-500/30"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </AppBackground>
  );
};

export default TournamentList;
