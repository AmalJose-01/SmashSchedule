import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Landmark, CheckCircle2, AlertTriangle, Loader2, ExternalLink, ShieldCheck, Percent } from "lucide-react";
import { toast } from "sonner";
import AppBackground from "../../../components/AppBackground.jsx";
import PageHeader from "../../../components/PageHeader.jsx";
import { useStripeStatus, useStartStripeOnboarding, useOpenStripeDashboard } from "../services/stripePayments.js";

// Stripe's requirement keys → plain words for the "still needed" list.
const REQUIREMENT_LABELS = {
  external_account: "Bank account (BSB + account number)",
  "business_profile.url": "Club website or social page",
  "business_profile.mcc": "Business category",
  business_type: "Business type",
  tos_acceptance: "Accept Stripe's terms",
};
const labelFor = (key) =>
  REQUIREMENT_LABELS[key] ||
  (key.includes("verification") ? "Identity verification" : key.startsWith("representative") || key.startsWith("individual") ? "Responsible person's details" : key.startsWith("company") ? "Club / business details" : key);

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 sm:p-6 ${className}`}>{children}</div>
);

const PaymentSettings = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data, isLoading, refetch, isFetching } = useStripeStatus();
  const { mutate: startOnboarding, isPending: starting } = useStartStripeOnboarding();
  const { mutate: openDashboard, isPending: opening } = useOpenStripeDashboard();
  const status = data?.data;

  // Back from Stripe onboarding: refresh status, then tidy the URL.
  useEffect(() => {
    const onboarding = params.get("onboarding");
    if (!onboarding) return;
    if (onboarding === "refresh") startOnboarding(); // link expired → get a fresh one
    else refetch().then((r) => r.data?.data?.ready && toast.success("Payouts are set up — you can now take card payments."));
    params.delete("onboarding");
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const feePct = ((status?.platformFeeBps ?? 100) / 100).toLocaleString("en-AU", { maximumFractionDigits: 2 });
  const needed = [...new Set((status?.currentlyDue ?? []).map(labelFor))];

  return (
    <AppBackground>
      <PageHeader title="Club Payments" subtitle="Get paid to your club's bank account" onBack={() => navigate("/admin/club-profile")} />

      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>
        ) : !status?.hasClub ? (
          <Card className="text-center">
            <p className="text-white font-semibold">Set up your club profile first</p>
            <p className="text-sm text-slate-400 mt-1">Payouts are linked to your club.</p>
            <button onClick={() => navigate("/admin/club-profile")} className="mt-4 text-sm font-semibold text-cyan-300 hover:underline">
              Go to Club Profile →
            </button>
          </Card>
        ) : (
          <>
            <Card>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${status.ready ? "bg-emerald-500/15" : "bg-cyan-500/15"}`}>
                  {status.ready ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Landmark className="w-6 h-6 text-cyan-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-semibold text-lg">
                    {status.ready ? "Payouts are active" : status.connected ? "Finish your payout setup" : "Set up payouts"}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {status.ready
                      ? "Card payments from players are paid out automatically to your club's bank account."
                      : "Enter your club's details and its BSB and account number on Stripe's secure page. It takes about 5 minutes."}
                  </p>

                  {status.bank && (
                    <p className="mt-3 text-sm text-slate-200">
                      Paying out to <span className="font-semibold">{status.bank.bankName || "bank account"}</span>
                      {status.bank.routingNumber ? ` · BSB ${status.bank.routingNumber}` : ""} · ••••{status.bank.last4}
                    </p>
                  )}

                  {status.connected && !status.ready && needed.length > 0 && (
                    <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3">
                      <p className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                        <AlertTriangle className="w-4 h-4" /> Stripe still needs
                      </p>
                      <ul className="mt-1.5 text-sm text-amber-100/90 list-disc pl-5 space-y-0.5">
                        {needed.map((n) => <li key={n}>{n}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    {!status.ready && (
                      <button
                        onClick={() => startOnboarding()}
                        disabled={starting}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
                        {status.connected ? "Continue setup" : "Set up payouts"}
                      </button>
                    )}
                    {status.connected && status.detailsSubmitted && (
                      <button
                        onClick={() => openDashboard()}
                        disabled={opening}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-60"
                      >
                        <ExternalLink className="w-4 h-4" /> Payouts &amp; bank details
                      </button>
                    )}
                    {status.connected && (
                      <button onClick={() => refetch()} disabled={isFetching} className="text-sm text-slate-400 hover:text-slate-200">
                        {isFetching ? "Checking…" : "Refresh status"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="flex items-center gap-2 text-white font-semibold"><Percent className="w-4 h-4 text-cyan-400" /> Fees</h3>
              <ul className="mt-2 text-sm text-slate-300 space-y-1.5">
                <li>SmashSchedule platform fee: <span className="font-semibold text-white">{feePct}%</span> of each payment.</li>
                <li>Stripe card fee: about 1.7% + A$0.30 per payment (Australian cards), deducted before payout.</li>
                <li>Example: a A$20.00 entry pays out about A$19.16 to your club.</li>
              </ul>
            </Card>

            <p className="flex items-start gap-2 text-xs text-slate-500 px-1">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 text-slate-400" />
              Bank and identity details are entered on Stripe and never stored by SmashSchedule.
            </p>
          </>
        )}
      </div>
    </AppBackground>
  );
};

export default PaymentSettings;
