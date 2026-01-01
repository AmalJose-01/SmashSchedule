import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTournament } from "../../hooks/useTournament";
import { setTournamentData } from "../../redux/slices/tournamentSlice";
import { useDispatch } from "react-redux";
import { Calendar, Settings, DollarSign } from "lucide-react";
import ButtonWithIcon from "../../components/ButtonWithIcon";
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

  useEffect(() => {
    console.log("Tournaments updated:", tournaments);
  }, [tournaments]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Create":
        return "bg-green-100 text-green-800";
      case "Scheduled":
        return "bg-blue-100 text-blue-800";
      case "Ongoing":
        return "bg-gray-100 text-gray-800";
    }
  };
  // ---------------------------
  // RENDER UI
  // ---------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white ">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4  shadow-lg sticky top-0">
        <div className="flex items-center gap-4">
          <Settings
            className="w-8 h-8 text-blue-600"
            onClick={() => navigate("/")}
          />

          <h2 className="text-xl font-semibold text-blue-800">
            Setup Tournament
          </h2>
        </div>
      </div>

      {/* Tournament List */}
      {tournaments?.length > 0 ? (
        <div className="bg-white rounded-3xl shadow-lg p-4 mt-4 ml-4 mr-4">
          <h2 className="text-xl font-semibold mb-4">Upcoming Tournaments</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tournaments.map((tournament) => (
              <div
                key={tournament._id}
                className="bg-gradient-to-b from-white to-gray-100 rounded-lg shadow-md p-3 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-200"
                onClick={() => {
                  console.log("tournament", tournament);

                  dispatch(setTournamentData(tournament));

                  //navigate(`/groupStageList/${tournament._id}`);
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl">{tournament.tournamentName}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                      tournament.status
                    )}`}
                  >
                    {tournament.status}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-6 h-6" />
                    <span>
                      {tournament.date} at {tournament.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600  bg-green-100 rounded-lg p-1">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <span>Registration Fee: {tournament.registrationFee}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        dispatch(setTournamentData(tournament));

                        navigate(`/tournamentInfo`);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </button>

                    {tournament.status === "Create" &&
                      tournament.registeredTeamsCount <
                        tournament.maximumParticipants && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(setTournamentData(tournament));
                            navigate(`/save-teams`);

                            // navigate("/teams", {
                            //   replace: true,
                            //   state: {
                            //     from: `/tournamentList`,
                            //   },
                            // });
                          }}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Register
                        </button>
                      )}
                    <button
                      // onClick={(e) => {
                      //   dispatch(setTournamentData(tournament));

                      //   navigate(`/groupStageList/${tournament._id}`);
                      // }}
                      onClick={() => {
                        dispatch(setTournamentData(tournament));
                        setVerificationOpen(true);
                      }}
                      className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                        tournament.status === "Create" ? "hidden" : ""
                      }`}
                    >
                      View Score
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg p-6 max-h-96 overflow-y-auto mt-4 ml-4 mr-4">
          <h2 className="text-xl font-semibold mb-4">
            No tournaments available.
          </h2>
        </div>
      )}
      <VerifyCodeModal
        open={openVerification}
        onClose={() => setVerificationOpen(false)}
      />
    </div>
  );
};

export default TournamentList;
