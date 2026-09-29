import { useNavigate } from "react-router-dom";
import { Shield, User, Trophy, ChevronRight } from "lucide-react";
import AppBackground from "../../components/AppBackground";

const OPTIONS = [
  {
    key: "admin",
    path: "/admin/login",
    title: "Admin Login",
    description: "Manage tournaments, players and schedules",
    icon: Shield,
    iconBg: "from-cyan-400 to-blue-500",
    glow: "shadow-cyan-500/40",
  },
  {
    key: "user",
    path: "/user/login",
    title: "User Login",
    description: "View your matches, results and standings",
    icon: User,
    iconBg: "from-emerald-400 to-teal-500",
    glow: "shadow-emerald-500/40",
  },
];

const LoginSelector = () => {
  const navigate = useNavigate();

  return (
    <AppBackground className="flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-500 mb-4 shadow-lg shadow-cyan-500/50">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
            Welcome to SmashSchedule
          </h1>
          <p className="text-slate-400">Choose your login type to continue</p>
        </div>

        {/* Selector Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          <div className="space-y-4">
            {OPTIONS.map(({ key, path, title, description, icon: Icon, iconBg, glow }) => (
              <button
                key={key}
                type="button"
                onClick={() => navigate(path)}
                className="group w-full flex items-center gap-4 text-left p-4 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-600 hover:border-cyan-500/60 rounded-xl transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <span className={`flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${iconBg} shadow-lg ${glow}`}>
                  <Icon className="w-6 h-6 text-white" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-white font-semibold">{title}</span>
                  <span className="block text-sm text-slate-400">{description}</span>
                </span>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-center text-slate-400 text-sm">
              Select your account type to access the appropriate dashboard
            </p>
          </div>
        </div>
      </div>
    </AppBackground>
  );
};

export default LoginSelector;
