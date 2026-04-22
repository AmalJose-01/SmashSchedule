import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ListChecks, Users, ArrowLeft } from "lucide-react";
import { useGetRoundRobinTournaments, useGetRoundRobinMembers } from "../services/roundRobin.queries.js";
import Logout from "../../../../components/Logout.jsx";

const actionCards = [
  {
    icon: Plus,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    title: "New Tournament",
    description: "Create a new round robin tournament, configure groups, and generate matches.",
    path: "/round-robin/create-tournament",
  },
  {
    icon: ListChecks,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    title: "Manage Tournaments",
    description: "View, edit, and manage all your round robin tournaments and their standings.",
    path: "/round-robin/tournaments",
  },
  {
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    title: "Manage Members",
    description: "Maintain your global player bank. Add, edit, or bulk import members.",
    path: "/round-robin/members",
  },
];

const RoundRobinDashboard = () => {
  const navigate = useNavigate();
  const { data: tournamentsData } = useGetRoundRobinTournaments();
  const { data: membersData } = useGetRoundRobinMembers();

  const totalTournaments = tournamentsData?.data?.length ?? 0;
  const totalMembers = membersData?.data?.length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 shadow-lg sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-teal-800">Round Robin</h2>
        </div>
        <Logout />
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-2 text-teal-800">
          Round Robin Tournaments
        </h1>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Manage your player bank, create tournaments, track groups and standings.
        </p>

        {/* Stats strip */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-teal-700">{totalTournaments}</p>
            <p className="text-xs text-gray-500 mt-1">Tournaments</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-700">{totalMembers}</p>
            <p className="text-xs text-gray-500 mt-1">Members</p>
          </div>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {actionCards.map(({ icon: Icon, color, bg, border, title, description, path }) => (
            <div
              key={path}
              className={`rounded-3xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow duration-300 border ${border} ${bg}`}
              onClick={() => navigate(path)}
            >
              <div className="flex flex-col items-center text-center">
                <Icon className={`w-14 h-14 mb-4 ${color}`} />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoundRobinDashboard;
