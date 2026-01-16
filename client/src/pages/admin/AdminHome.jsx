import React from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, PlusCircle, BookOpen, Calendar, LogOut } from "lucide-react";
import Logout from "../../components/Logout";

const AdminHome = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Tournament List",
      description: "Manage existing tournaments and view details.",
      icon: <Trophy className="w-8 h-8 text-blue-600" />,
      action: () => navigate("/tournament-list"),
      color: "bg-blue-50 border-blue-200",
    },
    {
      title: "Add New Session",
      description: "Create a new training or game session.",
      icon: <PlusCircle className="w-8 h-8 text-green-600" />,
      action: () => navigate("/create-session"),
      color: "bg-green-50 border-green-200",
    },
    {
      title: "Scoring Rules & Format",
      description: "Define scoring rules and match formats.",
      icon: <BookOpen className="w-8 h-8 text-purple-600" />,
      action: () => navigate("/create-play-type"),
      color: "bg-purple-50 border-purple-200",
    },
    {
      title: "Venue Management",
      description: "Manage venues and courts.",
      icon: <Trophy className="w-8 h-8 text-orange-600" />,
      action: () => navigate("/venue-list"),
      color: "bg-orange-50 border-orange-200",
    },
    // Add more dashboard items here
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Admin Dashboard
          </h2>
        </div>

        <div className="flex gap-2">
          <Logout />
        </div>
      </div>

      {/* DASHBOARD CONTENT */}
      <div className="max-w-5xl mx-auto p-6 mt-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Welcome, Admin</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={item.action}
              className={`p-6 rounded-2xl border-2 ${item.color} hover:shadow-lg transition-all cursor-pointer flex flex-col items-start gap-4 hover:-translate-y-1`}
            >
              <div className="p-3 bg-white rounded-xl shadow-sm">
                {item.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{item.title}</h3>
                <p className="text-slate-600 mt-2 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
