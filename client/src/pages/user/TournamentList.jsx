import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTournament } from "../../hooks/useTournament";
import { setTournamentData } from "../../redux/slices/tournamentSlice";
import { useDispatch } from "react-redux";
import { Calendar, DollarSign, Trophy } from "lucide-react";
import AppBackground from "../../components/AppBackground";
import PageHeader from "../../components/PageHeader";
import VerifyCodeModal from "../../components/VerifyCodeModal";

const TournamentList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    handleTournamentList,
    isLoading: isTournamentLoading,
    tournamentListError,
  } = useTournament("User");
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded((prev) => !prev);
  const [openVerification, setVerificationOpen] = useState(false);

  const tournaments = handleTournamentList();


  const getStatusColor = (status) => {
    switch (status) {
      case "Create":
        return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
      case "Scheduled":
        return "bg-blue-500/15 border-blue-500/30 text-blue-300";
      default:
        return "bg-slate-500/15 border-slate-500/30 text-slate-300";
    }
  };

  // ---------------------------
  // RENDER UI
  // ---------------------------
  return (
    <AppBackground variant="user">
      <PageHeader
        variant="user"
        title="Tournaments"
        subtitle="Upcoming tournaments"
        onBack={() => navigate(-1)}
        profileMenu
      />

      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        {tournaments?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((tournament) => (
              <div
                key={tournament._id}
                className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 hover:border-emerald-500/40 p-5 transition-all flex flex-col"
              >
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-yellow-400 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-white truncate">{tournament.tournamentName}</h3>
                  </div>
                  <span className={`flex-shrink-0 px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusColor(tournament.status)}`}>
                    {tournament.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>
                      {tournament.date || "Date TBA"}
                      {tournament.time ? ` at ${tournament.time}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-yellow-400" />
                    <span>Registration Fee: {tournament.registrationFee || "Free"}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/50 flex gap-2">
                  <button
                    onClick={() => {
                      dispatch(setTournamentData(tournament));
                      navigate(`/tournamentInfo`);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 bg-white/5 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-all"
                  >
                    View Details
                  </button>
                  {tournament.status === "Create" &&
                    (tournament.registeredTeamsCount ?? 0) < (tournament.maximumParticipants || Infinity) && (
                      <button
                        onClick={() => {
                          dispatch(setTournamentData(tournament));
                          navigate(`/join-tournament`);
                        }}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-yellow-500 hover:from-emerald-600 hover:to-yellow-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/30 transition-all"
                      >
                        Join
                      </button>
                    )}
                  {tournament.status !== "Create" && (
                    <button
                      onClick={() => {
                        dispatch(setTournamentData(tournament));
                        setVerificationOpen(true);
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-yellow-500 hover:from-emerald-600 hover:to-yellow-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/30 transition-all"
                    >
                      View Score
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl">
            <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">No tournaments available.</p>
          </div>
        )}
      </div>

      <VerifyCodeModal open={openVerification} onClose={() => setVerificationOpen(false)} />
    </AppBackground>
  );
};

export default TournamentList;
