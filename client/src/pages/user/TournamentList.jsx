import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTournament } from "../../hooks/useTournament";
import { setTournamentData } from "../../redux/slices/tournamentSlice";
import { useDispatch } from "react-redux";
import {  Settings } from "lucide-react";
import ButtonWithIcon from "../../components/ButtonWithIcon";

const TournamentList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { handleTournamentList, isLoading: isTournamentLoading, tournamentListError } =
    useTournament("User");
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded((prev) => !prev);


  const tournaments = handleTournamentList();

  useEffect(() => {
    // console.log("Tournaments updated:", tournaments);
  }, [tournaments]);


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
        <div className="bg-white rounded-3xl shadow-lg p-6 mt-4 ml-4 mr-4">
          <h2 className="text-xl font-semibold mb-4">Existing Tournaments</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tournaments.map((tournament) => (
              <li
                key={tournament.tournamentId}
                className="p-4 bg-blue-50 rounded-lg border border-gray-200 text-bold"
                onClick={() => {
                  console.log("tournament", tournament);

                  dispatch(setTournamentData(tournament));

                  navigate(`/groupStageList/${tournament.tournamentId}`);
                }}
              >
                <div className="flex flex-row justify-between">
                  <h4>{tournament.name}</h4>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg p-6 max-h-96 overflow-y-auto mt-4 ml-4 mr-4">
          <h2 className="text-xl font-semibold mb-4">
            No tournaments available.
          </h2>
        </div>
      )}

    </div>
  );
};

export default TournamentList;
