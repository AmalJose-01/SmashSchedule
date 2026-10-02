import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import AppBackground from "../../../components/AppBackground.jsx";

// Stripe Checkout returns here. Public on purpose: a player who scanned the
// admin's QR code may not be signed in on their phone.
const PaymentResult = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const success = params.get("status") === "success";
  const roundRobinId = params.get("rr");
  const selfPay = params.get("by") === "player";
  const isJoin = params.get("join") === "1";

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
