import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Building2, ScanSearch, Star, Loader2, ArrowRight } from "lucide-react";
import AppBackground from "../../components/AppBackground";
import PageHeader from "../../components/PageHeader";
import ClubCard from "../../features/my-clubs/components/ClubCard.jsx";
import { useMyClubs } from "../../features/my-clubs/services/myClubs.queries.js";

// Membership is hidden for now; the /user/memberships route still exists.
// Tournaments are reached through each club's expandable card below.

const ActionButton = ({ icon: Icon, title, subtitle, gradient, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative overflow-hidden flex items-center gap-4 text-left bg-slate-800/50 hover:bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 hover:border-emerald-400/40 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-500/10"
  >
    <span className={`pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl group-hover:opacity-25 transition-opacity`} />
    <span className={`relative flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} shadow-lg shadow-black/30`}>
      <Icon className="w-6 h-6 text-white" />
    </span>
    <span className="relative flex-1 min-w-0">
      <span className="block text-base font-semibold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>{title}</span>
      <span className="block text-xs text-slate-400">{subtitle}</span>
    </span>
    <ArrowRight className="relative w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
  </button>
);

const UserDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);
  const firstName = user?.firstName || user?.name?.split(" ")[0];
  const { data: clubs = [], isLoading } = useMyClubs();
  const favourites = clubs.filter((c) => c.isFavourite);

  return (
    <AppBackground variant="user">
      <PageHeader variant="user" title="My Dashboard" subtitle="Player area" profileMenu />

      <div className="px-4 sm:px-6 py-10 max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
            {firstName ? `Welcome back, ${firstName}` : "Welcome to Your Dashboard"}
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-emerald-400 to-yellow-400 mx-auto rounded-full" />
        </div>

        {/* Top actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <ActionButton
            icon={Building2}
            title="My Clubs"
            subtitle={clubs.length ? `${clubs.length} club${clubs.length !== 1 ? "s" : ""} saved` : "Clubs you've added"}
            gradient="from-emerald-400 to-green-500"
            onClick={() => navigate("/user/my-clubs")}
          />
          <ActionButton
            icon={ScanSearch}
            title="Find a Club"
            subtitle="Club key or QR code"
            gradient="from-yellow-300 to-amber-500"
            onClick={() => navigate("/user/find-club")}
          />
        </div>

        {/* Favourite clubs */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Star className="w-5 h-5 text-yellow-300" fill="currentColor" /> Favourite Clubs
          </h2>
          {favourites.length > 0 && (
            <button type="button" onClick={() => navigate("/user/my-clubs")} className="text-sm text-emerald-400 hover:text-emerald-300">
              Manage
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
          </div>
        ) : favourites.length === 0 ? (
          <div className="text-center bg-slate-800/40 backdrop-blur-xl border border-dashed border-slate-600 rounded-2xl p-8">
            <p className="text-slate-300 font-medium mb-1">No favourite clubs yet</p>
            <p className="text-sm text-slate-400">
              {clubs.length
                ? "Open My Clubs and tap the star on a club to pin it here."
                : "Find a club, add it to My Clubs, then star it to pin it here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {favourites.map((club) => (
              <ClubCard key={club._id} club={club} />
            ))}
          </div>
        )}
      </div>
    </AppBackground>
  );
};

export default UserDashboard;
