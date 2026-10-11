import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import AppBackground from "../../../components/AppBackground.jsx";
import apiClient from "../../../services/api/axiosInstance.js";

// Team / singles tournament registration fee: the player is only registered
// once Stripe confirms the payment, so ask the server (which checks Stripe
// directly) until it has finished. "pending" = still confirming after ~20s.
const useTournamentPayment = (paymentId, enabled) => {
  const [state, setState] = useState({ phase: "checking" }); // checking | registered | refunded | pending
  useEffect(() => {
    if (!paymentId || !enabled) return undefined;
    let cancelled = false;
    let tries = 0;
    const poll = async () => {
      tries += 1;
      try {
        const { data } = await apiClient.get(`/tournament/payments/${paymentId}/status`);
        const d = data?.data;
        if (cancelled) return;
        if (d?.registered) return setState({ phase: "registered" });
        if (d?.refunded) return setState({ phase: "refunded", reason: d.reason });
      } catch {
        /* keep trying */
      }
      if (cancelled) return;
      if (tries >= 10) return setState({ phase: "pending" });
      setTimeout(poll, 2000);
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [paymentId, enabled]);
  return state;
};

// Stripe Checkout returns here. Public on purpose: a player who scanned the
// admin's QR code may not be signed in on their phone.
const PaymentResult = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const success = params.get("status") === "success";
  const roundRobinId = params.get("rr");
  const selfPay = params.get("by") === "player";
  const isJoin = params.get("join") === "1";
  const tournamentPaymentId = params.get("tp");
  const tournamentPayment = useTournamentPayment(tournamentPaymentId, success);

  if (tournamentPaymentId) {
    const phase = success ? tournamentPayment.phase : "cancelled";
    const view = {
      checking: { icon: <Loader2 className="w-14 h-14 text-emerald-400 mx-auto animate-spin" />, title: "Confirming your payment…", text: "Hang on a moment while we finish your registration." },
      registered: { icon: <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />, title: "You're registered", text: "Thanks! Your registration fee is paid and your place in the tournament is confirmed." },
      pending: { icon: <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />, title: "Payment received", text: "Your registration is still being confirmed. It will show on the tournament page shortly — you don't need to pay again." },
      refunded: { icon: <XCircle className="w-14 h-14 text-amber-400 mx-auto" />, title: "Payment refunded", text: `${tournamentPayment.reason || "We couldn't complete your registration"}. Your payment has been refunded in full.` },
      cancelled: { icon: <XCircle className="w-14 h-14 text-amber-400 mx-auto" />, title: "Payment cancelled", text: "No money was taken and you haven't been registered. Register again when you're ready to pay." },
    }[phase];
    return (
      <AppBackground variant="user">
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 text-center">
            {view.icon}
            <h1 className="mt-4 text-xl font-semibold text-white">{view.title}</h1>
            <p className="mt-2 text-sm text-slate-300">{view.text}</p>
            {phase !== "checking" && (
              <button
                onClick={() => navigate("/tournamentList", { replace: true })}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-yellow-400 px-4 py-2.5 text-sm font-semibold text-slate-900"
              >
                Back to tournaments
              </button>
            )}
          </div>
        </div>
      </AppBackground>
    );
  }

  return (
    <AppBackground variant="user">
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 text-center">
          {success ? (
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
          ) : (
            <XCircle className="w-14 h-14 text-amber-400 mx-auto" />
          )}
          <h1 className="mt-4 text-xl font-semibold text-white">
            {success ? (isJoin ? "You're registered" : "Payment received") : "Payment cancelled"}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {success
              ? isJoin
                ? "Thanks! Your entry fee is paid and your spot in the round robin is confirmed."
                : "Thanks! Your entry fee is paid and the club has been notified."
              : isJoin
              ? "No money was taken and you haven't been registered. Join again when you're ready to pay."
              : "No money was taken. You can try again whenever you're ready."}
          </p>
          {selfPay && roundRobinId ? (
            <button
              onClick={() => navigate(`/user/round-robin/${roundRobinId}`, { replace: true })}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-yellow-400 px-4 py-2.5 text-sm font-semibold text-slate-900"
            >
              Back to the round robin
            </button>
          ) : (
            <p className="mt-6 text-xs text-slate-400">You can close this page and hand the device back.</p>
          )}
        </div>
      </div>
    </AppBackground>
  );
};

export default PaymentResult;
