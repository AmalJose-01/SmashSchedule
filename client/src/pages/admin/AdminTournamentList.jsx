import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {  useQueryClient } from "@tanstack/react-query";
import { useTournament } from "../../hooks/useTournament";
import { setTournamentData } from "../../redux/slices/tournamentSlice";
import { useDispatch } from "react-redux";
import { FaTrash } from "react-icons/fa"; // import the trash icon
import { ListChecks } from "lucide-react";
import ButtonWithIcon from "../../components/ButtonWithIcon";
import { useDeleteTournament } from "../../hooks/useDeleteTournament";
import Logout from "../../components/Logout";
import ConfirmModal from "../../components/AlertView";

const AdminTournamentList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteTournamentId, setDeleteTournamentId] = useState(null);

  const {
    handleTournamentList,
    isLoading: isTournamentLoading,
    error: tournamentListError,
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

  const tournaments = handleTournamentList();

  useEffect(() => {}, [tournaments]);

  const handleDeleteTournament = (tournamentId) => {
    if (!deleteTournamentId) return;

    handleTournamentDelete(deleteTournamentId);
    setShowConfirm(false);
  };

  // ---------------------------
  // RENDER UI
  // ---------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white ">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4  shadow-lg sticky top-0">
        <div className="flex items-center gap-4">
          <ListChecks
            className="w-8 h-8 text-blue-600"
            onClick={() => navigate("/")}
          />

          <h2 className="text-xl font-semibold text-blue-800">
            Tournament List
          </h2>
        </div>

        <div className="flex gap-2">
          {" "}
          <ButtonWithIcon
            title="Create Tournament"
            icon="plus"
            buttonBGColor="bg-green-600"
            textColor="text-white"
            // onClick={() => navigate("/teams")}
            onClick={() => navigate("/create-tournament")}
          />
          <Logout />
        </div>
      </div>

      {/* Tournament List */}
      {tournaments?.length > 0 ? (
        <div className="bg-white rounded-3xl shadow-lg p-6 mt-4 ml-4 mr-4">
          <h2 className="text-xl font-semibold mb-4">Existing Tournaments</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((tournament) => (
              <li
                key={tournament._id}
                className="p-4 bg-blue-50 rounded-lg border border-gray-200 text-bold"
                onClick={() => {
                  console.log("tournament", tournament);

                  dispatch(setTournamentData(tournament));

                  navigate(`/setup-tournament`);
                }}
              >
                <div className="flex flex-row justify-between">
                  <h4>{tournament.tournamentName}</h4>
                  <button
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent li click
                      setDeleteTournamentId(tournament._id);
                      setShowConfirm(true);
                    }}
                  >
                    <FaTrash />
                  </button>
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

      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Tournament"
        message="This action cannot be undone. Do you want to proceed?"
        confirmText="YES"
        cancelText="NO"
        danger
        loading={isScoreLoading}
        onConfirm={handleDeleteTournament} // call delete function here
        onCancel={() => setShowConfirm(false)} // close modal
      />
    </div>
  );
};

export default AdminTournamentList;
