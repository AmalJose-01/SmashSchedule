import { useState } from "react";
import { Star, ChevronDown, MapPin, Trash2 } from "lucide-react";
import ClubEvents from "./ClubEvents.jsx";
import { useSetClubFavourite, useRemoveMyClub } from "../services/myClubs.queries.js";

/**
 * A club in the player's list. Click the card to expand its tournaments and
 * round robins. The star marks it as a favourite (shown on the dashboard).
 */
const ClubCard = ({ club, showRemove = false, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const { mutate: setFav, isPending: favPending } = useSetClubFavourite();
  const { mutate: remove, isPending: removing } = useRemoveMyClub();

  const place = [club.location?.city, club.location?.state].filter(Boolean).join(", ");

  return (
    <div
      className={`bg-slate-800/50 backdrop-blur-xl border rounded-2xl shadow-xl overflow-hidden transition-colors ${
        open ? "border-emerald-500/40" : "border-slate-700/50"
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex-1 min-w-0 flex items-center gap-3 text-left"
        >
          {club.logo ? (
            <img src={club.logo} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0" />
          ) : (
            <span className="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 to-yellow-400 flex items-center justify-center text-lg font-bold text-slate-900">
              {(club.name || "?")[0].toUpperCase()}
            </span>
          )}
          <span className="min-w-0">
            <span className="block text-base font-semibold text-white truncate">{club.name || "Unnamed club"}</span>
            <span className="flex items-center gap-1 text-xs text-slate-400 truncate">
              {place ? (<><MapPin className="w-3 h-3 flex-shrink-0" />{place}</>) : <span className="font-mono tracking-widest">{club.clubCode}</span>}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFav({ clubId: club._id, isFavourite: !club.isFavourite })}
          disabled={favPending}
          title={club.isFavourite ? "Remove from favourites" : "Add to favourites"}
          aria-pressed={club.isFavourite}
          className={`p-2 rounded-xl transition-all ${
            club.isFavourite ? "text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20" : "text-slate-500 hover:text-yellow-300 hover:bg-white/5"
          }`}
        >
          <Star className="w-5 h-5" fill={club.isFavourite ? "currentColor" : "none"} />
        </button>

        {showRemove && (
          <button
            type="button"
            onClick={() => remove(club._id)}
            disabled={removing}
            title="Remove from My Clubs"
            className="p-2 rounded-xl text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Collapse" : "Expand"}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-700/50 bg-slate-900/20 p-4">
          <ClubEvents clubId={club._id} />
        </div>
      )}
    </div>
  );
};

export default ClubCard;
