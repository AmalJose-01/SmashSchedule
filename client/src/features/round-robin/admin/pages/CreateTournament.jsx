import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Trophy } from "lucide-react";
import Logout from "../../../../components/Logout.jsx";
import { useCreateRoundRobinTournament } from "../services/roundRobin.queries.js";

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
                done ? "bg-teal-600 text-white" : active ? "bg-teal-600 text-white ring-4 ring-teal-100" : "bg-gray-200 text-gray-500"
              }`}
            >
              {done ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs mt-1 font-medium ${active ? "text-teal-700" : "text-gray-400"}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-10 mb-4 mx-1 ${i < current ? "bg-teal-600" : "bg-gray-200"}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const inputCls = (err) =>
  `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 ${err ? "border-red-400" : "border-gray-200"}`;

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
        className={inputCls(errors.matchType) + " bg-white"}
      >
        <option value="Singles">Singles</option>
        <option value="Doubles">Doubles</option>
      </select>
    </Field>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Start Date & Time">
        <input
          type="datetime-local"
          value={form.startDate}
          onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          className={inputCls()}
        />
      </Field>
      <Field label="End Date & Time">
        <input
          type="datetime-local"
          value={form.endDate}
          onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
          className={inputCls()}
        />
      </Field>
    </div>
    <Field label="Description">
      <textarea
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="Optional notes about this tournament"
        rows={3}
        className={inputCls() + " resize-none"}
      />
    </Field>
    <Field label="Entry Fee ($)">
      <input
        type="number"
        min={0}
        step="0.01"
        value={form.entryFee}
        onChange={(e) => setForm((f) => ({ ...f, entryFee: e.target.value }))}
        placeholder="0 = free"
        className={inputCls()}
      />
      <p className="text-xs text-gray-400 mt-1">
        Leave at 0 for a free tournament. Set an amount to enable Square Terminal payment collection per player.
      </p>
    </Field>
  </div>
);

const Step2 = ({ form, setForm, errors }) => (
  <div className="space-y-4">
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
    <Field label="Number of Courts" error={errors.numberOfCourts}>
      <input
        type="number"
        min={1}
        value={form.numberOfCourts}
        onChange={(e) => setForm((f) => ({ ...f, numberOfCourts: e.target.value }))}
        className={inputCls(errors.numberOfCourts)}
      />
    </Field>
    <Field label="Number of Matches per Member" error={errors.numberOfMatchesPerMember}>
      <input
        type="number"
        min={1}
        value={form.numberOfMatchesPerMember}
        onChange={(e) => setForm((f) => ({ ...f, numberOfMatchesPerMember: e.target.value }))}
        className={inputCls(errors.numberOfMatchesPerMember)}
      />
      <p className="text-xs text-gray-400 mt-1">
        Each member plays this many matches. Set it to {form.playersPerGroup - 1 || "(players per group) - 1"} or
        higher for a full round robin.
      </p>
    </Field>
    <Field label="Grouping Strategy">
      <select
        value={form.groupingStrategy}
        onChange={(e) => setForm((f) => ({ ...f, groupingStrategy: e.target.value }))}
        className={inputCls() + " bg-white"}
      >
        <option value="random">Random — shuffle and distribute equally</option>
        <option value="by-grade">By Grade — sort A→Unrated, fill sequentially</option>
        <option value="balanced">Balanced — snake-draft to mix grades</option>
      </select>
    </Field>
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

    <div className="border-t border-gray-100 pt-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Set Scoring Rules</p>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Number of Sets" error={errors.numberOfSets}>
          <select
            value={form.numberOfSets}
            onChange={(e) => setForm((f) => ({ ...f, numberOfSets: e.target.value }))}
            className={inputCls(errors.numberOfSets) + " bg-white"}
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
            placeholder="e.g. 2"
            className={inputCls(errors.winningPointGap)}
          />
        </Field>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        A set is won by reaching {form.setWinningPoint || "?"} points with a {form.winningPointGap || "?"}-point lead.
      </p>
    </div>
  </div>
);

const Step3 = ({ form }) => (
  <div className="space-y-5">
    <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-2">
      <h3 className="font-semibold text-teal-800 mb-3">Tournament Details</h3>
      {[
        ["Name", form.tournamentName],
        ["Match Type", form.matchType],
        ["Groups", form.numberOfGroups],
        [form.matchType === "Doubles" ? "Players per Group (all pair combinations)" : "Players per Group", form.playersPerGroup],
        ["Courts", form.numberOfCourts],
        ["Matches per Member", form.numberOfMatchesPerMember],
        ["Grouping Strategy", form.groupingStrategy],
        ["Win / Loss Points", `${form.pointsForWin} / ${form.pointsForLoss}`],
        ["Sets", `Best of ${form.numberOfSets}`],
        ["Set Winning Point", form.setWinningPoint],
        ["Winning Gap", form.winningPointGap],
        ["Entry Fee", form.entryFee > 0 ? `$${Number(form.entryFee).toFixed(2)}` : "Free"],
        ["Start Date", form.startDate || "—"],
        ["End Date", form.endDate || "—"],
      ].map(([k, v]) => (
        <div key={k} className="flex justify-between text-sm">
          <span className="text-gray-500">{k}</span>
          <span className="font-medium text-gray-800 capitalize">{v}</span>
        </div>
      ))}
    </div>

    <p className="text-xs text-gray-400">
      You'll add players to this tournament from the Players tab after it's created, any time before groups
      and matches are scheduled.
    </p>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const INITIAL_FORM = {
  tournamentName: "",
  matchType: "Singles",
  startDate: "",
  endDate: "",
  description: "",
  numberOfGroups: 2,
  playersPerGroup: 4,
  numberOfCourts: 2,
  numberOfMatchesPerMember: 3,
  groupingStrategy: "random",
  pointsForWin: 2,
  pointsForLoss: 0,
  numberOfSets: 3,
  setWinningPoint: 21,
  winningPointGap: 2,
  entryFee: 0,
};

const CreateTournamentRR = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const { mutateAsync: createTournament, isPending: isCreating } = useCreateRoundRobinTournament();
  const isSubmitting = isCreating;

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.tournamentName.trim()) e.tournamentName = "Tournament name is required";
      if (!form.matchType) e.matchType = "Match type is required";
    }
    if (step === 1) {
      if (!form.numberOfGroups || form.numberOfGroups < 1) e.numberOfGroups = "At least 1 group required";
      if (form.matchType === "Doubles") {
        if (!form.playersPerGroup || form.playersPerGroup < 3) e.playersPerGroup = "At least 3 players per group for doubles";
      } else {
        if (!form.playersPerGroup || form.playersPerGroup < 2) e.playersPerGroup = "At least 2 players per group";
      }
      if (!form.numberOfCourts || form.numberOfCourts < 1) e.numberOfCourts = "At least 1 court required";
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
        numberOfMatchesPerMember: Number(form.numberOfMatchesPerMember),
        pointsForWin:     Number(form.pointsForWin),
        pointsForLoss:    Number(form.pointsForLoss),
        numberOfSets:     Number(form.numberOfSets),
        setWinningPoint:  Number(form.setWinningPoint),
        winningPointGap:  Number(form.winningPointGap),
        entryFee:         Number(form.entryFee) || 0,
      });

      const tournamentId = result.data._id;

      navigate(`/round-robin/tournament/${tournamentId}`);
    } catch {
      // errors handled by query hooks via toast
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/round-robin/tournaments")}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-teal-800">New Round Robin Tournament</h2>
        </div>
        <Logout />
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        <StepBar current={step} />

        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">{STEPS[step]}</h2>

          {step === 0 && <Step1 form={form} setForm={setForm} errors={errors} />}
          {step === 1 && <Step2 form={form} setForm={setForm} errors={errors} />}
          {step === 2 && <Step3 form={form} />}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
            <button
              onClick={back}
              disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-60 transition-colors"
              >
                <Trophy className="w-4 h-4" />
                {isSubmitting ? "Creating..." : "Create Tournament"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTournamentRR;
