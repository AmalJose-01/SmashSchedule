import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trophy, Trash2, ChevronRight, CalendarDays } from "lucide-react";
import Logout from "../../../../components/Logout.jsx";
import {
  useGetRoundRobinTournaments,
  useDeleteRoundRobinTournament,
} from "../services/roundRobin.queries.js";

const STATUS_STYLES = {
  Draft:      "bg-gray-100 text-gray-600",
  Active:     "bg-blue-100 text-blue-700",
  Scheduled:  "bg-yellow-100 text-yellow-700",
  Ongoing:    "bg-green-100 text-green-700",
  Completed:  "bg-purple-100 text-purple-700",
};

const TournamentList = () => {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);

  const { data, isLoading } = useGetRoundRobinTournaments();
  const { mutate: deleteTournament, isPending: isDeleting } = useDeleteRoundRobinTournament();

  const tournaments = data?.data ?? [];

  const handleDeleteConfirm = () => {
    deleteTournament(deletingId, { onSettled: () => setDeletingId(null) });
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—";

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
        <p className="text-sm text-gray-500 mb-6">
          {tournaments.length} tournament{tournaments.length !== 1 ? "s" : ""}
        </p>

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
            {tournaments.map((t) => (
              <div
                key={t._id}
                className="bg-white rounded-2xl shadow border border-gray-100 p-5 cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => navigate(`/round-robin/tournament/${t._id}`)}
              >
                <div className="flex items-start justify-between mb-3">
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
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm */}
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
    </div>
  );
};

export default TournamentList;
