import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {  useQueryClient } from "@tanstack/react-query";
import { useTournament } from "../../hooks/useTournament";
import { setTournamentData } from "../../redux/slices/tournamentSlice";
import { useDispatch } from "react-redux";
import { Calendar, MapPin, Plus, Trash2, Trophy, Users } from "lucide-react";
import AppBackground from "../../components/AppBackground";
import PageHeader from "../../components/PageHeader";
import { useDeleteTournament } from "../../hooks/useDeleteTournament";
import ConfirmModal from "../../components/AlertView";

const AdminTournamentList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteTournamentId, setDeleteTournamentId] = useState(null);

  const {
    tournaments,
    isTournamentLoading,
    tournamentListError,
  } = useTournament("Admin");

  const {
    handleTournamentDelete,
    isLoading: isScoreLoading,
    isError: isScoreError,
    isSuccess: isScoreSuccess,
  } = useDeleteTournament();

  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded((prev) => !prev);


  const handleDeleteTournament = (tournamentId) => {
    if (!deleteTournamentId) return;

    handleTournamentDelete(deleteTournamentId);
    setShowConfirm(false);
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : null;

  // ---------------------------
  // RENDER UI
  // ---------------------------
  return (
    <AppBackground>
      <PageHeader
        title="Tournament List"
        subtitle="All your tournaments in one place"
        onBack={() => navigate("/dashboard")}
        actions={
          <button
            onClick={() => navigate("/create-tournament")}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white px-4 h-10 rounded-xl font-semibold text-sm shadow-lg shadow-cyan-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Tournament</span>
          </button>
        }
      />

      <div className="p-6 max-w-5xl mx-auto">
        {isTournamentLoading ? (
          <div className="text-center py-16 text-slate-400">Loading tournaments...</div>
        ) : tournaments?.length > 0 ? (
          <>
            <p className="text-sm text-slate-300 mb-4">
              {tournaments.length} tournament{tournaments.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map((tournament) => {
                const date = formatDate(tournament.date);
                return (
                  <div
                    key={tournament._id}
                    className="relative overflow-hidden bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 hover:border-cyan-500/40 p-5 cursor-pointer transition-all group hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-cyan-500/10"
                    onClick={() => {
                      dispatch(setTournamentData(tournament));
                      navigate(`/setup-tournament`);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-500 shadow-lg shadow-cyan-500/30 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                          {tournament.tournamentName}
                        </h4>
                      </div>
                      <button
                        aria-label="Delete tournament"
                        className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          setDeleteTournamentId(tournament._id);
                          setShowConfirm(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-4 space-y-1.5 text-sm text-slate-400">
                      {(tournament.matchType || tournament.playType) && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-cyan-400/80" />
                          {[tournament.matchType, tournament.playType].filter(Boolean).join(" · ")}
                        </div>
                      )}
                      {date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-cyan-400/80" />
                          {date}
                          {tournament.time ? ` · ${tournament.time}` : ""}
                        </div>
                      )}
                      {tournament.location && (
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-4 h-4 flex-shrink-0 text-cyan-400/80" />
                          <span className="truncate">{tournament.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl">
            <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-medium mb-4">No tournaments yet.</p>
            <button
              onClick={() => navigate("/create-tournament")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create First Tournament
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Tournament"
        message="This action cannot be undone. Do you want to proceed?"
        confirmText="Delete"
        cancelText="Cancel"
        danger
        loading={isScoreLoading}
        onConfirm={handleDeleteTournament} // call delete function here
        onCancel={() => setShowConfirm(false)} // close modal
      />
    </AppBackground>
  );
};

export default AdminTournamentList;
