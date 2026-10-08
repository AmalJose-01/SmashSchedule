import React from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Building2, AlertTriangle, Users } from "lucide-react";
import { useGetMyClubProfile } from "../../features/club-profile/admin/services/clubProfile.queries.js";
import AppBackground from "../../components/AppBackground";
import PageHeader from "../../components/PageHeader";
import DashboardTile from "../../components/DashboardTile";
import RoundRobinCard from "../../features/round-robin/admin/components/RoundRobinCard.jsx";

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: clubData } = useGetMyClubProfile();
  const isClubComplete = clubData?.isProfileComplete || clubData?.club?.isProfileComplete || false;

  return (
    <AppBackground>
      <PageHeader title="Dashboard" subtitle="Admin control centre" />

      <div className="px-4 sm:px-6 py-10 max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
            Welcome to Rallix Admin
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-cyan-500 to-emerald-500 mx-auto rounded-full mb-4" />
          <p className="text-slate-400">
            {clubData?.club?.name ? `Managing ${clubData.club.name}` : "Pick a module to get started."}
          </p>
        </div>

        {/* Club Profile Incomplete Banner */}
        {!isClubComplete && (
          <button
            type="button"
            className="w-full max-w-3xl mx-auto mb-10 flex items-center gap-4 text-left bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl rounded-2xl px-5 py-4 hover:bg-amber-500/15 transition-colors"
            onClick={() => navigate("/admin/club-profile")}
          >
            <span className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-amber-200 text-sm">Club profile is incomplete</p>
              <p className="text-amber-300/80 text-xs mt-0.5">
                Complete your club profile before creating tournaments or membership types.
              </p>
            </div>
            <span className="text-amber-300 font-semibold text-sm whitespace-nowrap">Set up →</span>
          </button>
        )}

        {/* Cards stay centred however many modules are active. */}
        <div className="flex flex-wrap justify-center gap-6">
          <DashboardTile
            icon={Building2}
            gradient="from-purple-400 to-indigo-500"
            title="Club Profile"
            description="Set up your club details — name, logo, location, and registration info."
            dot={!isClubComplete}
            badge={!isClubComplete ? "Setup required" : undefined}
            onClick={() => navigate("/admin/club-profile")}
          />

          <DashboardTile
            icon={Trophy}
            gradient="from-cyan-400 to-blue-500"
            title="Tournament Management"
            description="Create, manage, and oversee tournaments. Set up teams, fixtures, and track results."
            locked={!isClubComplete}
            onClick={() => (isClubComplete ? navigate("/tournament-list") : navigate("/admin/club-profile"))}
          />

          <RoundRobinCard isClubComplete={isClubComplete} />

          <DashboardTile
            icon={Users}
            gradient="from-purple-400 to-indigo-500"
            title="Manage Members"
            description="Maintain your global player bank. Add, edit, or bulk import members."
            onClick={() => navigate("/members")}
          />

          {/* Membership Module — hidden for now (not currently used). The
          /admin-membership route is left intact, so this card can be restored later if membership
          management comes back into use.
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
          */}
        </div>
      </div>
    </AppBackground>
  );
};

export default Dashboard;