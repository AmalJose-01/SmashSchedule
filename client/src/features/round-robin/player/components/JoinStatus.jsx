import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, CheckCircle2, Loader2, UserPlus, XCircle, Lock, Swords, CreditCard } from "lucide-react";
import { useJoinRoundRobin, useLeaveRoundRobin } from "../services/playerRoundRobin.js";
import { usePayRoundRobinEntryFee } from "../../../payments/services/stripePayments.js";

const money = (n) => `A$${Number(n).toFixed(2)}`;

// "8 of 20 left" style slot summary.
export const SlotsText = ({ join, className = "" }) => {
  if (!join) return null;
  if (join.slots == null)
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <Users className="w-3 h-3" /> {join.playerCount} registered
      </span>
    );
  const full = join.remaining === 0;
  return (
    <span className={`inline-flex items-center gap-1 ${full ? "text-red-300" : ""} ${className}`}>
      <Users className="w-3 h-3" />
      {join.playerCount}/{join.slots} · {full ? "Full" : `${join.remaining} left`}
    </span>
  );
};

const btn = (size) => (size === "lg" ? "text-sm px-4 py-2.5 rounded-xl" : "text-xs px-3 py-1.5 rounded-lg");

/**
 * Registration status + actions for one round robin.
 *  • Not joined → Join (disabled when registration is closed or not allowed)
 *  • Joined     → "Joined" status + Cancel (disabled after the deadline)
 * `size="sm"` for list rows, "lg" for the round robin page (also explains why).
 */
const SCHEDULED_STATUSES = ["Finalized", "Ongoing", "Completed"];

const JoinStatus = ({ roundRobinId, join, size = "sm", status }) => {
  const navigate = useNavigate();
  const { mutate: joinRR, isPending: joining } = useJoinRoundRobin();
  const { mutate: leaveRR, isPending: leaving } = useLeaveRoundRobin();
  const { mutate: payRR, isPending: paying } = usePayRoundRobinEntryFee();
  const [confirming, setConfirming] = useState(false);
  if (!join) return null;
  const lg = size === "lg";
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  // ── Joined + schedule is out → go straight to their matches ─
  const scheduled = join.scheduled ?? SCHEDULED_STATUSES.includes(status);
  if (join.joined && scheduled) {
    return (
      <button
        type="button"
        onClick={stop(() => navigate(`/user/round-robin/${roundRobinId}`))}
        className={`inline-flex items-center gap-1.5 font-semibold text-slate-900 bg-gradient-to-r from-emerald-400 to-yellow-300 hover:from-emerald-300 hover:to-yellow-200 shadow-lg shadow-emerald-500/30 transition-all ${btn(size)}`}
      >
        <Swords className="w-3.5 h-3.5" /> View matches
      </button>
    );
  }

  // ── Joined ────────────────────────────────────────────────
  if (join.joined) {
    return (
      <div className={`flex ${lg ? "flex-col sm:flex-row sm:items-center gap-3" : "items-center gap-2"}`} onClick={(e) => e.stopPropagation()}>
        <span className={`inline-flex items-center gap-1.5 font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full ${lg ? "text-sm px-3.5 py-1.5" : "text-[11px] px-2 py-0.5"}`}>
          <CheckCircle2 className={lg ? "w-4 h-4" : "w-3 h-3"} /> Joined
        </span>

        {/* Entry fee still owed → Pay (Stripe Checkout) */}
        {join.paymentDue && join.canPayOnline && (
          <button
            type="button"
            onClick={stop(() => payRR(roundRobinId))}
            disabled={paying}
            className={`inline-flex items-center gap-1.5 font-semibold text-slate-900 bg-gradient-to-r from-emerald-400 to-yellow-300 hover:from-emerald-300 hover:to-yellow-200 disabled:opacity-60 transition-all ${btn(size)}`}
          >
            {paying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />} Pay {money(join.entryFee)}
          </button>
        )}
        {join.paid && (
          <span className={`font-semibold text-emerald-300 ${lg ? "text-sm" : "text-[11px]"}`}>Paid</span>
        )}

        {join.canCancel ? (
          confirming ? (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              {join.paid && join.entryFee > 0 && (
                <span className={`text-amber-200 ${lg ? "text-xs" : "text-[11px]"}`}>
                  Your {money(join.entryFee)} will be refunded.
                </span>
              )}
              <button
                type="button"
                onClick={stop(() => leaveRR(roundRobinId, { onSettled: () => setConfirming(false) }))}
                disabled={leaving}
                className={`inline-flex items-center gap-1.5 font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-colors ${btn(size)}`}
              >
                {leaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Yes, cancel
              </button>
              <button
                type="button"
                onClick={stop(() => setConfirming(false))}
                className={`font-semibold text-slate-300 hover:text-white border border-slate-600 bg-white/5 hover:bg-white/10 transition-colors ${btn(size)}`}
              >
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={stop(() => setConfirming(true))}
              className={`inline-flex items-center gap-1.5 font-semibold text-red-300 border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 transition-colors ${btn(size)}`}
            >
              <XCircle className="w-3.5 h-3.5" /> Cancel
            </button>
          )
        ) : (
          <button
            type="button"
            disabled
            title={join.closedText || "Registration can no longer be changed"}
            className={`inline-flex items-center gap-1.5 font-semibold text-slate-500 border border-slate-700 bg-slate-800/60 cursor-not-allowed ${btn(size)}`}
          >
            <Lock className="w-3.5 h-3.5" /> Cancel
          </button>
        )}

        {lg && !join.canCancel && join.closedText && <p className="text-xs text-slate-400">{join.closedText}</p>}
      </div>
    );
  }

  // ── Not joined ────────────────────────────────────────────
  return (
    <div className={`flex ${lg ? "flex-col sm:flex-row sm:items-center gap-3" : "items-center"}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={stop(() => joinRR(roundRobinId))}
        disabled={!join.canJoin || joining || join.confirming || (join.entryFee > 0 && !join.canPayOnline)}
        title={join.canJoin ? "Join this round robin" : join.reasonText || ""}
        className={`inline-flex items-center justify-center gap-1.5 font-semibold transition-all ${btn(size)} ${
          join.canJoin
            ? "text-slate-900 bg-gradient-to-r from-emerald-400 to-yellow-300 hover:from-emerald-300 hover:to-yellow-200 shadow-lg shadow-emerald-500/30 disabled:opacity-60"
            : "text-slate-500 border border-slate-700 bg-slate-800/60 cursor-not-allowed"
        }`}
      >
        {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : join.canJoin ? <UserPlus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
        {join.confirming
          ? "Confirming payment…"
          : join.canJoin && join.entryFee > 0
          ? join.joinPayment?.status === "PENDING" ? `Complete payment · ${money(join.entryFee)}` : `Join & pay ${money(join.entryFee)}`
          : "Join"}
      </button>
      {lg && join.canJoin && join.entryFee > 0 && (
        <p className="text-xs text-slate-400">
          {join.confirming
            ? "Payment received — your registration is being confirmed. Refresh in a moment."
            : join.joinPayment?.status === "REFUNDED" && join.joinPayment.failureReason
            ? `${join.joinPayment.failureReason}. Your payment was refunded.`
            : join.canPayOnline
            ? `${join.isMember ? "Member" : "Non-member"} entry fee ${money(join.entryFee)}. You're registered once payment is complete.`
            : "Online payment isn't set up for this club yet — contact the club to register."}
        </p>
      )}
      {lg && !join.canJoin && join.reasonText && <p className="text-xs text-slate-400">{join.reasonText}</p>}
    </div>
  );
};

export default JoinStatus;
