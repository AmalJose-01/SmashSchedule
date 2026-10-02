import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Trophy, ChevronDown } from "lucide-react";
import { useCreateRoundRobinTournament } from "../services/roundRobin.queries.js";
import { useStripeStatus } from "../../../payments/services/stripePayments.js";
import Toggle from "../components/Toggle.jsx";
import AppBackground from "../../../../components/AppBackground.jsx";
import PageHeader from "../../../../components/PageHeader.jsx";

// ── Step indicators ───────────────────────────────────────────────────────────
const STEPS = ["Basic Info", "Configuration", "Review"];

const StepBar = ({ current }) => (
  <div className="flex items-center justify-center gap-0 mb-8">
    {STEPS.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                done ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white" : active ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white ring-4 ring-cyan-400/30 shadow-lg shadow-cyan-500/40" : "bg-slate-800 border border-slate-600 text-slate-400"
              }`}
            >
              {done ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs mt-1 font-medium ${active ? "text-white" : "text-white/50"}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-10 mb-4 mx-1 ${i < current ? "bg-cyan-500" : "bg-slate-700"}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
    {children}
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);

const inputCls = (err) =>
  `w-full bg-slate-900/50 border rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${err ? "border-red-500" : "border-slate-600"}`;

// ── Steps ─────────────────────────────────────────────────────────────────────
const Step1 = ({ form, setForm, errors }) => (
  <div className="space-y-4">
    <Field label="Tournament Name" error={errors.tournamentName}>
      <input
        type="text"
        value={form.tournamentName}
        onChange={(e) => setForm((f) => ({ ...f, tournamentName: e.target.value }))}
        placeholder="e.g. Season 1 Round Robin"
        className={inputCls(errors.tournamentName)}
      />
    </Field>
    <Field label="Match Type" error={errors.matchType}>
      <select
        value={form.matchType}
        onChange={(e) => setForm((f) => ({ ...f, matchType: e.target.value }))}
        className={inputCls(errors.matchType)}
      >
        <option value="Singles">Singles</option>
        <option value="Doubles">Doubles</option>
      </select>
    </Field>
    <Field label="Start Date">
      <input
        type="date"
        value={form.startDate}
        onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
        className={inputCls()}
      />
    </Field>
    <Field label="Registration Deadline *" error={errors.registrationDeadline}>
      <input
        type="datetime-local"
        value={form.registrationDeadline}
        onChange={(e) => setForm((f) => ({ ...f, registrationDeadline: e.target.value }))}
        className={inputCls(errors.registrationDeadline)}
      />
      <p className="text-xs text-slate-400 mt-1">Last date and time players can register.</p>
    </Field>
    <Field label="Description">
      <textarea
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="Optional notes about this tournament"
        rows={3}
        className={inputCls() + " resize-none"}
      />
    </Field>
  </div>
);

// Fields that live inside the collapsible "Advanced Settings" section — used
// to auto-expand it if validation ever flags one of them, so an error never
// hides silently behind a collapsed section.
const ADVANCED_FIELD_KEYS = [
  "numberOfGroups",
  "playersPerGroup",
  "numberOfMatchesPerMember",
  "setWinningPoint",
  "winningPointGap",
];

const Step2 = ({ form, setForm, errors, payoutsReady }) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const hasAdvancedErrors = ADVANCED_FIELD_KEYS.some((key) => errors[key]);
  const showAdvanced = advancedOpen || hasAdvancedErrors;

  return (
  <div className="space-y-4">
    {/* Grouping Strategy is the one setting shown directly on this step —
    everything else keeps its INITIAL_FORM default unless the admin opens
    Advanced Settings below. */}
    <Field label="Grouping Strategy">
      <select
        value={form.groupingStrategy}
        onChange={(e) => setForm((f) => ({ ...f, groupingStrategy: e.target.value }))}
        className={inputCls()}
      >
        <option value="random">Random — shuffle and distribute equally</option>
        <option value="by-grade">By Grade — sort A→Unrated, fill sequentially</option>
        <option value="balanced">Balanced — snake-draft to mix grades</option>
      </select>
    </Field>

    <Field label="Number of Courts" error={errors.numberOfCourts}>
      <input
        type="number"
        min={1}
        value={form.numberOfCourts}
        onChange={(e) => setForm((f) => ({ ...f, numberOfCourts: e.target.value }))}
        className={inputCls(errors.numberOfCourts)}
      />
    </Field>

    <Field label="Number of Slots *" error={errors.numberOfSlots}>
      <input
        type="number"
        min={1}
        value={form.numberOfSlots}
        onChange={(e) => setForm((f) => ({ ...f, numberOfSlots: e.target.value }))}
        placeholder="e.g. 16"
        className={inputCls(errors.numberOfSlots)}
      />
      <p className="text-xs text-slate-400 mt-1">
        Maximum number of players who can join this tournament.
      </p>
    </Field>

    {/* Payment — only when the club's Stripe payouts are active. Fees show
        only when "Accept online payment" is switched on. */}
    {payoutsReady && (
      <div className="border-t border-slate-700/50 pt-4 space-y-4">
        <p className="text-sm font-semibold text-slate-200">Payment</p>
        <Toggle
          label="Accept online payment"
          hint="Players pay by card when they join, based on their membership type."
          checked={!!form.acceptOnlinePayment}
          onChange={(v) => setForm((f) => ({ ...f, acceptOnlinePayment: v }))}
        />
        {form.acceptOnlinePayment && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Member Fee (A$)" error={errors.entryFeeMember}>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.entryFeeMember}
                onChange={(e) => setForm((f) => ({ ...f, entryFeeMember: e.target.value }))}
                placeholder="0 = free"
                className={inputCls(errors.entryFeeMember)}
              />
            </Field>
            <Field label="Non-Member Fee (A$)" error={errors.entryFeeNonMember}>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.entryFeeNonMember}
                onChange={(e) => setForm((f) => ({ ...f, entryFeeNonMember: e.target.value }))}
                placeholder="0 = free"
                className={inputCls(errors.entryFeeNonMember)}
              />
            </Field>
          </div>
        )}
      </div>
    )}

    <div className="border-t border-slate-700/50 pt-4">
      <button
        type="button"
        onClick={() => setAdvancedOpen((open) => !open)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-slate-200">Advanced Settings</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`}
        />
      </button>

      {showAdvanced && (
        <div className="mt-4 space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <Field label="Number of Groups" error={errors.numberOfGroups}>
        <input
          type="number"
          min={1}
          value={form.numberOfGroups}
          onChange={(e) => setForm((f) => ({ ...f, numberOfGroups: e.target.value }))}
          className={inputCls(errors.numberOfGroups)}
        />
      </Field>
      <Field
        label={form.matchType === "Doubles" ? "Players per Group (min 3)" : "Players per Group"}
        error={errors.playersPerGroup}
      >
        <input
          type="number"
          min={form.matchType === "Doubles" ? 3 : 2}
          value={form.playersPerGroup}
          onChange={(e) => setForm((f) => ({ ...f, playersPerGroup: e.target.value }))}
          className={inputCls(errors.playersPerGroup)}
        />
      </Field>
    </div>
    <Field label="Number of Matches per Member" error={errors.numberOfMatchesPerMember}>
      <input
        type="number"
        min={1}
        value={form.numberOfMatchesPerMember}
        onChange={(e) => setForm((f) => ({ ...f, numberOfMatchesPerMember: e.target.value }))}
        className={inputCls(errors.numberOfMatchesPerMember)}
      />
      <p className="text-xs text-slate-400 mt-1">
        Each member plays this many matches. Set it to {form.playersPerGroup - 1 || "(players per group) - 1"} or
        higher for a full round robin.
      </p>
    </Field>
    {/* Points for Win / Points for Loss are no longer admin-editable — the
    standings table always scores win=2, draw=1, loss=0 (see applyResult in
    standingsService.js), so exposing these as separate inputs implied a
    choice that had no effect. form.pointsForWin/pointsForLoss stay fixed at
    2/0 in INITIAL_FORM below and are still submitted with the tournament,
    just no longer shown here.
    <div className="grid grid-cols-2 gap-4">
      <Field label="Points for Win">
        <input
          type="number"
          min={0}
          value={form.pointsForWin}
          onChange={(e) => setForm((f) => ({ ...f, pointsForWin: e.target.value }))}
          className={inputCls()}
        />
      </Field>
      <Field label="Points for Loss">
        <input
          type="number"
          min={0}
          value={form.pointsForLoss}
          onChange={(e) => setForm((f) => ({ ...f, pointsForLoss: e.target.value }))}
          className={inputCls()}
        />
      </Field>
    </div>
    */}

    <div className="border-t border-slate-700/50 pt-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Set Scoring Rules</p>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Number of Sets" error={errors.numberOfSets}>
          <select
            value={form.numberOfSets}
            onChange={(e) => setForm((f) => ({ ...f, numberOfSets: e.target.value }))}
            className={inputCls(errors.numberOfSets)}
          >
            <option value={1}>Best of 1</option>
            <option value={2}>Best of 2</option>
            <option value={3}>Best of 3</option>
            <option value={5}>Best of 5</option>
          </select>
        </Field>
        <Field label="Winning Point" error={errors.setWinningPoint}>
          <input
            type="number"
            min={1}
            value={form.setWinningPoint}
            onChange={(e) => setForm((f) => ({ ...f, setWinningPoint: e.target.value }))}
            placeholder="e.g. 21"
            className={inputCls(errors.setWinningPoint)}
          />
        </Field>
        <Field label="Winning Gap" error={errors.winningPointGap}>
          <input
            type="number"
            min={1}
            value={form.winningPointGap}
            onChange={(e) => setForm((f) => ({ ...f, winningPointGap: e.target.value }))}
            placeholder="e.g. 1"
            className={inputCls(errors.winningPointGap)}
          />
        </Field>
      </div>
      <p className="text-xs text-slate-400 mt-2">
        A set is won by reaching {form.setWinningPoint || "?"} points with a {form.winningPointGap || "?"}-point lead.
      </p>
    </div>
        </div>
      )}
    </div>
  </div>
  );
};

const Step3 = ({ form, payoutsReady }) => (
  <div className="space-y-5">
    <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-5 space-y-2.5">
      <h3 className="font-semibold text-white mb-3">Tournament Details</h3>
      {[
        ["Name", form.tournamentName],
        ["Match Type", form.matchType],
        ["Groups", form.numberOfGroups],
        [form.matchType === "Doubles" ? "Players per Group (all pair combinations)" : "Players per Group", form.playersPerGroup],
        ["Courts", form.numberOfCourts],
        ["Player Slots", form.numberOfSlots],
        ...(payoutsReady
          ? [
              ["Online Payment", form.acceptOnlinePayment ? "On" : "Off"],
              ...(form.acceptOnlinePayment
                ? [
                    ["Member Fee", Number(form.entryFeeMember) > 0 ? `A$${Number(form.entryFeeMember).toFixed(2)}` : "Free"],
                    ["Non-Member Fee", Number(form.entryFeeNonMember) > 0 ? `A$${Number(form.entryFeeNonMember).toFixed(2)}` : "Free"],
                  ]
                : []),
            ]
          : []),
        ["Matches per Member", form.numberOfMatchesPerMember],
        ["Grouping Strategy", form.groupingStrategy],
        // Win/Loss points removed from the review summary too — fixed at 2/0/1 (win/loss/draw), not admin-configurable.
        ["Sets", `Best of ${form.numberOfSets}`],
        ["Set Winning Point", form.setWinningPoint],
        ["Winning Gap", form.winningPointGap],
        ["Start Date", form.startDate || "—"],
        [
          "Registration Deadline",
          form.registrationDeadline
            ? new Date(form.registrationDeadline).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
            : "—",
        ],
      ].map(([k, v]) => (
        <div key={k} className="flex justify-between text-sm">
          <span className="text-slate-400">{k}</span>
          <span className="font-medium text-slate-100 capitalize">{v}</span>
        </div>
      ))}
    </div>

    <p className="text-xs text-slate-400">
      You'll add players to this tournament from the Players tab after it's created, any time before groups
      and matches are scheduled.
    </p>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
// Defaults "Start Date" to today (in the browser's local time), formatted
// for an <input type="date">, so the admin doesn't have to pick today's
// date manually every time.
const getDefaultStartDate = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const INITIAL_FORM = {
  tournamentName: "",
  matchType: "Doubles",
  startDate: getDefaultStartDate(),
  registrationDeadline: "", // mandatory, starts empty
  description: "",
  numberOfGroups: 2,
  playersPerGroup: 4,
  numberOfCourts: 2,
  numberOfSlots: "",
  acceptOnlinePayment: false,
  entryFeeMember: 0,
  entryFeeNonMember: 0,
  numberOfMatchesPerMember: 3,
  groupingStrategy: "random",
  pointsForWin: 2,
  pointsForLoss: 0,
  numberOfSets: 3,
  setWinningPoint: 21,
  winningPointGap: 1,
};

const CreateTournamentRR = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const { mutateAsync: createTournament, isPending: isCreating } = useCreateRoundRobinTournament();
  // Payment options only exist once the club's Stripe payouts are active.
  const { data: stripeStatus } = useStripeStatus();
  const payoutsReady = !!stripeStatus?.data?.chargesEnabled;
  const isSubmitting = isCreating;

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.tournamentName.trim()) e.tournamentName = "Tournament name is required";
      if (!form.matchType) e.matchType = "Match type is required";
      if (!form.registrationDeadline) {
        e.registrationDeadline = "Registration deadline is required";
      } else if (new Date(form.registrationDeadline) <= new Date()) {
        e.registrationDeadline = "Deadline must be in the future";
      }
    }
    if (step === 1) {
      if (!form.numberOfGroups || form.numberOfGroups < 1) e.numberOfGroups = "At least 1 group required";
      if (form.matchType === "Doubles") {
        if (!form.playersPerGroup || form.playersPerGroup < 3) e.playersPerGroup = "At least 3 players per group for doubles";
      } else {
        if (!form.playersPerGroup || form.playersPerGroup < 2) e.playersPerGroup = "At least 2 players per group";
      }
      if (!form.numberOfCourts || form.numberOfCourts < 1) e.numberOfCourts = "At least 1 court required";
      if (form.numberOfSlots === "" || form.numberOfSlots === null || form.numberOfSlots === undefined) {
        e.numberOfSlots = "Number of slots is required";
      } else if (!Number.isInteger(Number(form.numberOfSlots)) || Number(form.numberOfSlots) < 1) {
        e.numberOfSlots = "Enter a whole number of at least 1";
      }
      for (const key of payoutsReady && form.acceptOnlinePayment ? ["entryFeeMember", "entryFeeNonMember"] : []) {
        const fee = Number(form[key]);
        if (form[key] === "" || !Number.isFinite(fee) || fee < 0) e[key] = "Enter 0 or more";
        else if (fee > 0 && fee < 1) e[key] = "Minimum A$1.00 (or 0 for free)";
      }
      if (!form.numberOfMatchesPerMember || form.numberOfMatchesPerMember < 1) e.numberOfMatchesPerMember = "At least 1 match per member required";
      if (!form.setWinningPoint || form.setWinningPoint < 1) e.setWinningPoint = "Required";
      if (!form.winningPointGap || form.winningPointGap < 1) e.winningPointGap = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep((s) => s + 1); };
  const back = () => { setErrors({}); setStep((s) => s - 1); };

  const handleCreate = async () => {
    try {
      const result = await createTournament({
        ...form,
        numberOfGroups:   Number(form.numberOfGroups),
        playersPerGroup:  Number(form.playersPerGroup),
        numberOfCourts:   Number(form.numberOfCourts),
        numberOfSlots:    Number(form.numberOfSlots),
        acceptOnlinePayment: payoutsReady && !!form.acceptOnlinePayment,
        entryFeeMember:    Number(form.entryFeeMember) || 0,
        entryFeeNonMember: Number(form.entryFeeNonMember) || 0,
        // datetime-local is local time — send as a full ISO timestamp.
        registrationDeadline: new Date(form.registrationDeadline).toISOString(),
        numberOfMatchesPerMember: Number(form.numberOfMatchesPerMember),
        pointsForWin:     Number(form.pointsForWin),
        pointsForLoss:    Number(form.pointsForLoss),
        numberOfSets:     Number(form.numberOfSets),
        setWinningPoint:  Number(form.setWinningPoint),
        winningPointGap:  Number(form.winningPointGap),
      });

      const tournamentId = result.data._id;

      navigate(`/round-robin/tournament/${tournamentId}`);
    } catch {
      // errors handled by query hooks via toast
    }
  };

  return (
    <AppBackground>
      <PageHeader
        title="New Round Robin Tournament"
        subtitle="Set up the basics, configure play, then review"
        onBack={() => navigate("/round-robin/tournaments")}
      />

      <div className="p-6 max-w-2xl mx-auto">
        <StepBar current={step} />

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-white mb-5 pb-3 border-b border-slate-700/50">{STEPS[step]}</h2>

          {step === 0 && <Step1 form={form} setForm={setForm} errors={errors} />}
          {step === 1 && <Step2 form={form} setForm={setForm} errors={errors} payoutsReady={payoutsReady} />}
          {step === 2 && <Step3 form={form} payoutsReady={payoutsReady} />}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-5 border-t border-slate-700/50">
            <button
              onClick={back}
              disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600 bg-white/5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] transition-all"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                <Trophy className="w-4 h-4" />
                {isSubmitting ? "Creating..." : "Create Tournament"}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppBackground>
  );
};

export default CreateTournamentRR;
