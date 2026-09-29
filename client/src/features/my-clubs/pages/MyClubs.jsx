import { useNavigate } from "react-router-dom";
import { Loader2, ScanSearch, Building2, Star } from "lucide-react";
import AppBackground from "../../../components/AppBackground.jsx";
import PageHeader from "../../../components/PageHeader.jsx";
import ClubCard from "../components/ClubCard.jsx";
import { useMyClubs } from "../services/myClubs.queries.js";

const MyClubs = () => {
  const navigate = useNavigate();
  const { data: clubs = [], isLoading } = useMyClubs();
  const favCount = clubs.filter((c) => c.isFavourite).length;

  return (
    <AppBackground variant="user">
      <PageHeader
        variant="user"
        title="My Clubs"
        subtitle="Star a club to show it on your dashboard"
        onBack={() => navigate("/user/dashboard")}
        profileMenu
        actions={
          <button
            type="button"
            onClick={() => navigate("/user/find-club")}
            className="hidden sm:inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-yellow-500 hover:from-emerald-600 hover:to-yellow-600 shadow-lg shadow-emerald-500/30 transition-all"
          >
            <ScanSearch className="w-4 h-4" /> Find a Club
          </button>
        }
      />

      <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : clubs.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-10">
            <Building2 className="w-10 h-10 text-slate-500" />
            <p className="text-white font-medium">You haven&apos;t added any clubs yet</p>
            <p className="text-sm text-slate-400 max-w-sm">Find a club by its key or QR code, then tap &ldquo;Add to My Clubs&rdquo;.</p>
            <button
              type="button"
              onClick={() => navigate("/user/find-club")}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-yellow-500 shadow-lg shadow-emerald-500/30"
            >
              <ScanSearch className="w-4 h-4" /> Find a Club
            </button>
          </div>
        ) : (
          <>
            <p className="flex items-center gap-2 text-sm text-slate-400">
              {clubs.length} club{clubs.length !== 1 ? "s" : ""} ·
              <Star className="w-3.5 h-3.5 text-yellow-300" fill="currentColor" /> {favCount} favourite{favCount !== 1 ? "s" : ""}
            </p>
            {clubs.map((club) => (
              <ClubCard key={club._id} club={club} showRemove />
            ))}
          </>
        )}
      </div>
    </AppBackground>
  );
};

export default MyClubs;
