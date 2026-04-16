import React from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, User, Settings } from "lucide-react";
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
      title: "Membership",
      description: "Check your membership status and renewals",
      icon: Settings,
      path: "/user/memberships",
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

        </div>
      </div>
    </div>
  );
};

export default UserDashboard;