import { Link } from "react-router-dom";
import { CreditCard } from "lucide-react";
import Toggle from "../../round-robin/admin/components/Toggle.jsx";

// "Accept online payment" switch for team / singles tournaments (same wording
// and behaviour as round robin). The Registration Fee field is the amount
// charged. Only usable once the club's Stripe payouts are active.
const OnlinePaymentToggle = ({ checked, onChange, payoutsReady, matchType }) => {
  const unit = matchType === "Doubles" ? "per team" : "per player";

  if (!payoutsReady && !checked) {
    return (
      <div className="border-t border-slate-700/50 pt-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <CreditCard className="w-4 h-4 text-cyan-400" />
          Online payment
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Want players to pay by card when they register?{" "}
          <Link to="/admin/club-profile/payments" className="text-cyan-400 hover:text-cyan-300 underline">
            Set up payments
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-700/50 pt-4 space-y-2">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-200">
        <CreditCard className="w-4 h-4 text-cyan-400" />
        Payment
      </p>
      <Toggle
        label="Accept online payment"
        hint={`Players pay the registration fee ${unit} by card when they register. They're added once the payment goes through.`}
        checked={!!checked}
        onChange={onChange}
      />
      {checked && (
        <p className="text-xs text-slate-400">The Registration Fee above is the amount charged (minimum A$1.00).</p>
      )}
    </div>
  );
};

export default OnlinePaymentToggle;
