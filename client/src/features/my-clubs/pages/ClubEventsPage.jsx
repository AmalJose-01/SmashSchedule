import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Shuffle, Loader2, Search } from "lucide-react";
import AppBackground from "../../../components/AppBackground.jsx";
import PageHeader from "../../../components/PageHeader.jsx";
import { useClubEvents } from "../services/myClubs.queries.js";
import { getClubById } from "../../club-profile/users/services/clubSearch.services.js";
import { TournamentRow, RoundRobinRow } from "../components/EventRows.jsx";

const TABS = [
  { key: "tournaments", label: "Tournaments", icon: Trophy },
  { key: "round-robin", label: "Round Robin", icon: Shuffle },
];

// Full list of one club's tournaments or round robins (the club card only
// shows the latest 5 of each).
const ClubEventsPage = () => {
  const navigate = useNavigate();
  const { clubId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get("type") === "round-robin" ? "round-robin" : "tournaments";
  const [query, setQuery] = useState("");

  const { data, isLoading, isError } = useClubEvents(clubId, true);
  const { data: clubData } = useQuery({
    queryKey: ["club", clubId],
    queryFn: () => getClubById(clubId),
    enabled: !!clubId,
    staleTime: 1000 * 60 * 5,
  });
  const clubName = clubData?.club?.name || "Club";

  const lists = { tournaments: data?.tournaments ?? [], "round-robin": data?.roundRobins ?? [] };
  const q = query.trim().toLowerCase();
  const items = lists[type].filter((e) => !q || e.tournamentName?.toLowerCase().includes(q));

  return (
    <AppBackground variant="user">
      <PageHeader
        variant="user"
        title={clubName}
        subtitle="All tournaments and round robins"
        onBack={() => navigate(-1)}
        profileMenu
      />

      <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto space-y-4">
        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/50 border border-slate-700/50 rounded-2xl">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = type === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSearchParams({ type: key }, { replace: true })}
                className={`inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-gradient-to-r from-emerald-500 to-yellow-500 text-white shadow-lg shadow-emerald-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
                <span className={`text-xs ${active ? "text-white/80" : "text-slate-500"}`}>({lists[key].length})</span>
              </button>
            );
          })}
        </div>

        {/* Filter */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${type === "tournaments" ? "tournaments" : "round robins"}…`}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
          </div>
        ) : isError ? (
          <p className="text-center text-sm text-red-300 py-10">Couldn&apos;t load this club&apos;s events.</p>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-10 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
            {q ? "Nothing matches your search." : type === "tournaments" ? "No tournaments yet." : "No round robins yet."}
          </p>
        ) : (
          <div className="space-y-2">
            {type === "tournaments"
              ? items.map((t) => <TournamentRow key={t._id} t={t} />)
              : items.map((r) => <RoundRobinRow key={r._id} r={r} />)}
          </div>
        )}
      </div>
    </AppBackground>
  );
};

export default ClubEventsPage;
