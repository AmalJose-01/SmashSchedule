import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trophy, Trash2, ChevronRight, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import Logout from "../../../../components/Logout.jsx";
import {
  useGetRoundRobinTournaments,
  useDeleteRoundRobinTournament,
  rrKeys,
} from "../services/roundRobin.queries.js";
import { deleteRoundRobinTournamentAPI } from "../services/roundRobin.services.js";

const STATUS_STYLES = {
  Draft:      "bg-gray-100 text-gray-600",
  Active:     "bg-blue-100 text-blue-700",
  Scheduled:  "bg-yellow-100 text-yellow-700",
  Ongoing:    "bg-green-100 text-green-700",
  Completed:  "bg-purple-100 text-purple-700",
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
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/round-robin/dashboard")}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-teal-800">Round Robin Tournaments</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/round-robin/create-tournament")}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Tournament
          </button>
          <Logout />
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {/* Count + select all row */}
        {tournaments.length > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="w-4 h-4 rounded accent-teal-600 cursor-pointer"
            />
            <p className="text-sm text-gray-500">
              {tournaments.length} tournament{tournaments.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Bulk action bar */}
        {someSelected && (
          <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5 mb-4">
            <span className="text-sm font-medium text-teal-700">
              {selected.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={clearSelection}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
              >
                Deselect all
              </button>
              <button
                onClick={() => setConfirmBulk(true)}
                disabled={bulkDeleting}
                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {bulkDeleting ? "Deleting..." : `Delete ${selected.size}`}
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16 text-gray-400">Loading tournaments...</div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium mb-4">No tournaments yet.</p>
            <button
              onClick={() => navigate("/round-robin/create-tournament")}
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors"
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
                  className={`relative bg-white rounded-2xl shadow border p-5 cursor-pointer hover:shadow-md transition-shadow group ${isSelected ? "border-teal-300 ring-2 ring-teal-100" : "border-gray-100"}`}
                  onClick={() => navigate(`/round-robin/tournament/${t._id}`)}
                >
                  {/* Checkbox */}
                  <div
                    className="absolute top-3 left-3"
                    onClick={(e) => { e.stopPropagation(); toggleOne(t._id); }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(t._id)}
                      className="w-4 h-4 rounded accent-teal-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-start justify-between mb-3 pl-6">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[t.status] ?? STATUS_STYLES.Draft}`}>
                      {t.status}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingId(t._id); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-semibold text-gray-800 text-base mb-1 leading-snug">
                    {t.tournamentName}
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">
                    {t.matchType} · {t.numberOfGroups} group{t.numberOfGroups !== 1 ? "s" : ""} · {t.numberOfCourts} court{t.numberOfCourts !== 1 ? "s" : ""}
                  </p>

                  {(t.startDate || t.endDate) && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {formatDate(t.startDate)}
                      {t.endDate && <> → {formatDate(t.endDate)}</>}
                    </div>
                  )}

                  <div className="flex items-center justify-end text-teal-600 text-xs font-medium">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Tournament?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete the tournament, all its groups and matches. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm */}
      {confirmBulk && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Delete {selected.size} Tournament{selected.size !== 1 ? "s" : ""}?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete all selected tournaments, their groups and matches. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmBulk(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentList;
