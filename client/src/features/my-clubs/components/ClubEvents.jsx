import { useNavigate } from "react-router-dom";
import { Trophy, Shuffle, Loader2, ArrowRight } from "lucide-react";
import { useClubEvents } from "../services/myClubs.queries.js";
import { TournamentRow, RoundRobinRow } from "./EventRows.jsx";

// How many of each type the club card shows; the rest are on the full page.
const PREVIEW_COUNT = 5;

const Section = ({ icon: Icon, title, count, children }) => (
  <div>
    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
      <Icon className="w-3.5 h-3.5" /> {title} <span className="text-slate-600">({count})</span>
    </p>
    {children}
  </div>
);

const MoreButton = ({ count, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="mt-2 w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-emerald-300 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 transition-colors"
  >
    View all {count} <ArrowRight className="w-3.5 h-3.5" />
  </button>
);

// Expandable body of a club card: the latest 5 tournaments and round robins,
// each with a "View all" link to the full list.
const ClubEvents = ({ clubId }) => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useClubEvents(clubId, true);

  if (isLoading)
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Loading events…
      </div>
    );
  if (isError) return <p className="py-4 text-center text-sm text-red-300">Couldn&apos;t load this club&apos;s events.</p>;

  const tournaments = data?.tournaments ?? [];
  const roundRobins = data?.roundRobins ?? [];
  const openAll = (type) => navigate(`/user/club/${clubId}/events?type=${type}`);

  return (
    <div className="space-y-5">
      <Section icon={Trophy} title="Tournaments" count={tournaments.length}>
        {tournaments.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No tournaments yet.</p>
        ) : (
          <div className="space-y-2">
            {tournaments.slice(0, PREVIEW_COUNT).map((t) => <TournamentRow key={t._id} t={t} />)}
            {tournaments.length > PREVIEW_COUNT && <MoreButton count={tournaments.length} onClick={() => openAll("tournaments")} />}
          </div>
        )}
      </Section>

      <Section icon={Shuffle} title="Round Robin" count={roundRobins.length}>
        {roundRobins.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No round robins yet.</p>
        ) : (
          <div className="space-y-2">
            {roundRobins.slice(0, PREVIEW_COUNT).map((r) => <RoundRobinRow key={r._id} r={r} />)}
            {roundRobins.length > PREVIEW_COUNT && <MoreButton count={roundRobins.length} onClick={() => openAll("round-robin")} />}
          </div>
        )}
      </Section>
    </div>
  );
};

export default ClubEvents;
