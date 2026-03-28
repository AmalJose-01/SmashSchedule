import React from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, User, Calendar, Settings } from "lucide-react";
import Navbar from "../../components/Navbar";
import Logout from "../../components/Logout";

const UserDashboard = () => {
  const navigate = useNavigate();

  const dashboardItems = [
    {
      title: "Tournaments",
      description: "View and participate in available tournaments",
      icon: Trophy,
      path: "/tournamentList",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "My Profile",
      description: "Manage your account and membership details",
      icon: User,
      path: "/user/profile",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "My Teams",
      description: "View and manage your registered teams",
      icon: Calendar,
      path: "/my-teams", // We'll need to create this
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Membership",
      description: "Check your membership status and renewals",
      icon: Settings,
      path: "/user/membership",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-white shadow">
        <Navbar />
      </div>

      {/* Dashboard Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2 text-blue-800">
            Welcome to Your Dashboard
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Manage your tournaments, teams, and membership from here
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {dashboardItems.map((item, index) => (
              <div
                key={index}
                className={`${item.bgColor} rounded-3xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300 border border-gray-200`}
                onClick={() => navigate(item.path)}
              >
                <div className="flex flex-col items-center text-center">
                  <item.icon className={`w-16 h-16 ${item.color} mb-4`} />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/tournamentList")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Tournaments
              </button>
              <button
                onClick={() => navigate("/teams")}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Register Team
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;