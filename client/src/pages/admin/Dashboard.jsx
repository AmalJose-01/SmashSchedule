import React from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Users } from "lucide-react";
import Logout from "../../components/Logout";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 shadow-lg sticky top-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-blue-800">Dashboard</h2>
        </div>
        <Logout />
      </div>

      {/* Dashboard Content */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-center mb-8 text-blue-800">
          Welcome to SmashSchedule Admin
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Tournament Module */}
          <div
            className="bg-white rounded-3xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow duration-300 border border-gray-200"
            onClick={() => navigate("/tournament-list")}
          >
            <div className="flex flex-col items-center text-center">
              <Trophy className="w-16 h-16 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-blue-800 mb-2">
                Tournament Management
              </h3>
              <p className="text-gray-600">
                Create, manage, and oversee tournaments. Set up teams, fixtures, and track results.
              </p>
            </div>
          </div>

          {/* Membership Module */}
          <div
            className="bg-white rounded-3xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow duration-300 border border-gray-200"
            onClick={() => navigate("/admin-membership")}
          >
            <div className="flex flex-col items-center text-center">
              <Users className="w-16 h-16 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Membership Management
              </h3>
              <p className="text-gray-600">
                Manage member registrations, verify documents, and handle membership renewals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;