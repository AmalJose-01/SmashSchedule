import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ListChecks } from "lucide-react"; // CreditCard was only used by the now-hidden Square Payments tile below
import { useGetRoundRobinTournaments, useGetRoundRobinMembers } from "../services/roundRobin.queries.js";
import AppBackground from "../../../../components/AppBackground.jsx";
import PageHeader from "../../../../components/PageHeader.jsx";
import DashboardTile from "../../../../components/DashboardTile.jsx";

const actionCards = [
  {
    icon: Plus,
    gradient: "from-cyan-400 to-blue-500",
    title: "New Tournament",
    description: "Create a new round robin tournament, configure groups, and generate matches.",
    path: "/round-robin/create-tournament",
  },
  {
    icon: ListChecks,
    gradient: "from-emerald-400 to-teal-500",
    title: "Manage Tournaments",
    description: "View, edit, and manage all your round robin tournaments and their standings.",
    path: "/round-robin/tournaments",
  },
  // "Manage Members" now lives on the main admin Dashboard (/members).
  // Square Payments tile hidden for now (not currently used) — the
  // /admin/square-settings page and its route are left intact, so this
  // can be re-added by just restoring this entry if Square payments come
  // back into use later.
  // {
  //   icon: CreditCard,
  //   color: "text-amber-600",
  //   bg: "bg-amber-50",
  //   border: "border-amber-200",
  //   title: "Square Payments",
  //   description: "Connect your Square account and Terminal device to collect entry fees.",
  //   path: "/admin/square-settings",
  // },
];

const RoundRobinDashboard = () => {
  const navigate = useNavigate();
  const { data: tournamentsData } = useGetRoundRobinTournaments();
  const { data: membersData } = useGetRoundRobinMembers();

  const totalTournaments = tournamentsData?.data?.length ?? 0;
  const totalMembers = membersData?.data?.length ?? 0;

  return (
    <AppBackground>
      <PageHeader
        title="Round Robin"
        subtitle="Tournaments, players and standings"
        onBack={() => navigate("/dashboard")}
      />

      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center mb-8 pt-4">
          <h1 className="text-3xl font-semibold text-white mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
            Round Robin Tournaments
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-cyan-500 to-emerald-500 mx-auto rounded-full mb-4" />
          <p className="text-slate-400 text-sm">
            Manage your player bank, create tournaments, track groups and standings.
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex justify-center gap-4 mb-10">
          {[
            { label: "Tournaments", value: totalTournaments, cls: "from-cyan-400 to-blue-400" },
            { label: "Members", value: totalMembers, cls: "from-purple-400 to-indigo-400" },
          ].map(({ label, value, cls }) => (
            <div
              key={label}
              className="min-w-[140px] text-center bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-6 py-4"
            >
              <p className={`text-3xl font-bold bg-gradient-to-r ${cls} bg-clip-text text-transparent`}>{value}</p>
              <p className="text-xs uppercase tracking-wider text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Action cards — flex-wrap + justify-center instead of a fixed
        4-column grid, so the cards stay centered no matter how many tiles
        actionCards has (it dropped to 3 once the Square Payments tile was
        hidden above; a 4-column grid would leave a lopsided empty slot on
        wide screens instead of centering the row). Each card gets a fixed
        width so wrapping and spacing stay consistent at every count. */}
        <div className="flex flex-wrap justify-center gap-6">
          {actionCards.map(({ icon, gradient, title, description, path }) => (
            <DashboardTile
              key={path}
              icon={icon}
              gradient={gradient}
              title={title}
              description={description}
              onClick={() => navigate(path)}
            />
          ))}
        </div>
      </div>
    </AppBackground>
  );
};

export default RoundRobinDashboard;
