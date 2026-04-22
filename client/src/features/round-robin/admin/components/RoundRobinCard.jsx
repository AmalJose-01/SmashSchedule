import React from "react";
import { Shuffle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RoundRobinCard = ({ isClubComplete }) => {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white rounded-3xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow duration-300 border border-gray-200"
      onClick={() =>
        isClubComplete
          ? navigate("/round-robin/dashboard")
          : navigate("/admin/club-profile")
      }
    >
      <div className="flex flex-col items-center text-center">
        <Shuffle
          className={`w-16 h-16 mb-4 ${
            isClubComplete ? "text-teal-600" : "text-gray-400"
          }`}
        />
        <h3
          className={`text-xl font-semibold mb-2 ${
            isClubComplete ? "text-teal-800" : "text-gray-500"
          }`}
        >
          Round Robin
        </h3>
        <p className="text-gray-600">
          Run dedicated round robin tournaments with player pools, auto-grouping,
          and live standings.
        </p>
        {!isClubComplete && (
          <span className="mt-3 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Complete club profile first
          </span>
        )}
      </div>
    </div>
  );
};

export default RoundRobinCard;
