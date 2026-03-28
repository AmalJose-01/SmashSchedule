import React from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Users, Building2 } from "lucide-react";
import { useGetMyClubProfile } from "../../features/club-profile/admin/services/clubProfile.queries.js";
import Logout from "../../components/Logout";

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: clubData } = useGetMyClubProfile();
  const isClubComplete = clubData?.isProfileComplete || clubData?.club?.isProfileComplete || false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 shadow-lg sticky top-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-blue-800">Dashboard</h2>
        </div>
        <Logout />
      </div>

      {/* Club Profile Incomplete Banner */}
      {!isClubComplete && (
        <div
          className="mx-6 mt-4 flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-5 py-4 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => navigate("/admin/club-profile")}
        >
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">Club profile is incomplete</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Complete your club profile before creating tournaments or membership types.
            </p>
          </div>
          <span className="text-amber-600 font-semibold text-sm whitespace-nowrap">Set up →</span>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-center mb-8 text-blue-800">
          Welcome to SmashSchedule Admin
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">

          {/* Club Profile Module */}
          <div
            className="bg-white rounded-3xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow duration-300 border border-gray-200 relative"
            onClick={() => navigate("/admin/club-profile")}
          >
            {!isClubComplete && (
              <span className="absolute top-4 right-4 w-3 h-3 bg-amber-400 rounded-full" />
            )}
            <div className="flex flex-col items-center text-center">
              <Building2 className="w-16 h-16 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold text-purple-800 mb-2">Club Profile</h3>
              <p className="text-gray-600">
                Set up your club details — name, logo, location, and registration info.
              </p>
              {!isClubComplete && (
                <span className="mt-3 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  Setup required
                </span>
              )}
            </div>
          </div>

          {/* Tournament Module */}
          <div
            className="bg-white rounded-3xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow duration-300 border border-gray-200"
            onClick={() => isClubComplete ? navigate("/tournament-list") : navigate("/admin/club-profile")}
          >
            <div className="flex flex-col items-center text-center">
              <Trophy className={`w-16 h-16 mb-4 ${isClubComplete ? "text-blue-600" : "text-gray-400"}`} />
              <h3 className={`text-xl font-semibold mb-2 ${isClubComplete ? "text-blue-800" : "text-gray-500"}`}>
                Tournament Management
              </h3>
              <p className="text-gray-600">
                Create, manage, and oversee tournaments. Set up teams, fixtures, and track results.
              </p>
              {!isClubComplete && (
                <span className="mt-3 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Complete club profile first
                </span>
              )}
            </div>
          </div>

          {/* Membership Module */}
          <div
            className="bg-white rounded-3xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow duration-300 border border-gray-200"
            onClick={() => isClubComplete ? navigate("/admin-membership") : navigate("/admin/club-profile")}
          >
            <div className="flex flex-col items-center text-center">
              <Users className={`w-16 h-16 mb-4 ${isClubComplete ? "text-green-600" : "text-gray-400"}`} />
              <h3 className={`text-xl font-semibold mb-2 ${isClubComplete ? "text-green-800" : "text-gray-500"}`}>
                Membership Management
              </h3>
              <p className="text-gray-600">
                Manage member registrations, verify documents, and handle membership renewals.
              </p>
              {!isClubComplete && (
                <span className="mt-3 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Complete club profile first
                </span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;