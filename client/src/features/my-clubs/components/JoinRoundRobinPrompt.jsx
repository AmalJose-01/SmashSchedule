import { createPortal } from "react-dom";
import { Shuffle, Loader2 } from "lucide-react";
import { useJoinClubRoundRobin } from "../services/myClubs.queries.js";

/**
 * Shown right after a player adds a club to My Clubs: "Do you want to join
 * this club's round robin?" Yes → request goes to the club admin for
 * approval. No → they can join later from the club's card.
 */
const JoinRoundRobinPrompt = ({ club, onClose }) => {
  const { mutate: join, isPending } = useJoinClubRoundRobin();

  // Portal to <body>: a parent card with backdrop-blur would otherwise trap
  // this fixed overlay inside the card.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm bg-slate-800/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-6 text-center">
        <div className="mx-auto mb-4 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-yellow-400 shadow-lg shadow-emerald-500/30">
          <Shuffle className="w-7 h-7 text-slate-900" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Join the round robin?</h3>
        <p className="text-sm text-slate-400 mb-6">
          Do you want to join <span className="text-slate-200 font-medium">{club?.name || "this club"}</span>&apos;s round robin?
          The club admin will approve your request.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border border-slate-600 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            No, not now
          </button>
          <button
            type="button"
            onClick={() => join(club._id, { onSuccess: onClose })}
            disabled={isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-yellow-500 hover:from-emerald-600 hover:to-yellow-600 shadow-lg shadow-emerald-500/30 disabled:opacity-60 transition-all"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Yes, join
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default JoinRoundRobinPrompt;
