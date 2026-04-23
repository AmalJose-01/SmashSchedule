import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Search, Trophy } from "lucide-react";
import Logout from "../../../../components/Logout.jsx";
import {
  useCreateRoundRobinTournament,
  useGetRoundRobinMembers,
  useAddMembersToTournament,
} from "../services/roundRobin.queries.js";

// ── Step indicators ───────────────────────────────────────────────────────────
const STEPS = ["Basic Info", "Configuration", "Select Members", "Review"];

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

const GRADE_COLORS = {
  A: "bg-red-100 text-red-700", B: "bg-orange-100 text-orange-700",
  C: "bg-yellow-100 text-yellow-700", D: "bg-green-100 text-green-700",
  E: "bg-blue-100 text-blue-700", Unrated: "bg-gray-100 text-gray-600",
};

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
        <option value="Doubles" disabled>Doubles (coming soon)</option>
      </select>
    </Field>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Start Date">
        <input
          type="date"
          value={form.startDate}
          onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          className={inputCls()}
        />
      </Field>
      <Field label="End Date">
        <input
          type="date"
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
      <Field label="Players per Group" error={errors.playersPerGroup}>
        <input
          type="number"
          min={2}
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
  </div>
);

const Step3 = ({ selectedIds, setSelectedIds }) => {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetRoundRobinMembers();
  const members = data?.data ?? [];
  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.grade.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAll = () =>
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map((m) => m._id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {selectedIds.length} of {members.length} members selected
        </p>
        {filtered.length > 0 && (
          <button onClick={toggleAll} className="text-xs text-teal-600 font-medium hover:underline">
            {selectedIds.length === filtered.length ? "Deselect all" : "Select all"}
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </div>

      {isLoading ? (
        <p className="text-center text-gray-400 py-8">Loading members...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-8">
          {members.length === 0 ? "No members in the bank yet. Add members first." : "No members match your search."}
        </p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
          {filtered.map((m) => {
            const checked = selectedIds.includes(m._id);
            return (
              <label
                key={m._id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-0 ${
                  checked ? "bg-teal-50" : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(m._id)}
                  className="accent-teal-600 w-4 h-4"
                />
                <span className="flex-1 text-sm font-medium text-gray-800">{m.name}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GRADE_COLORS[m.grade] ?? GRADE_COLORS.Unrated}`}>
                  {m.grade}
                </span>
                <span className="text-xs text-gray-400">{m.contact}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Step4 = ({ form, selectedIds, membersData }) => {
  const members = membersData?.data ?? [];
  const selected = members.filter((m) => selectedIds.includes(m._id));

  return (
    <div className="space-y-5">
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-2">
        <h3 className="font-semibold text-teal-800 mb-3">Tournament Details</h3>
        {[
          ["Name", form.tournamentName],
          ["Match Type", form.matchType],
          ["Groups", form.numberOfGroups],
          ["Players per Group", form.playersPerGroup],
          ["Courts", form.numberOfCourts],
          ["Grouping Strategy", form.groupingStrategy],
          ["Win / Loss Points", `${form.pointsForWin} / ${form.pointsForLoss}`],
          ["Start Date", form.startDate || "—"],
          ["End Date", form.endDate || "—"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span className="text-gray-500">{k}</span>
            <span className="font-medium text-gray-800 capitalize">{v}</span>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 mb-2 text-sm">
          Selected Members ({selected.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {selected.map((m) => (
            <span
              key={m._id}
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${GRADE_COLORS[m.grade] ?? GRADE_COLORS.Unrated}`}
            >
              {m.name}
            </span>
          ))}
          {selected.length === 0 && <span className="text-xs text-gray-400">No members selected</span>}
        </div>
      </div>
    </div>
  );
};

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
  groupingStrategy: "random",
  pointsForWin: 2,
  pointsForLoss: 0,
};

const CreateTournamentRR = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: membersData } = useGetRoundRobinMembers();
  const { mutateAsync: createTournament, isPending: isCreating } = useCreateRoundRobinTournament();
  const { mutateAsync: addMembers, isPending: isAddingMembers } = useAddMembersToTournament();
  const isSubmitting = isCreating || isAddingMembers;

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.tournamentName.trim()) e.tournamentName = "Tournament name is required";
      if (!form.matchType) e.matchType = "Match type is required";
    }
    if (step === 1) {
      if (!form.numberOfGroups || form.numberOfGroups < 1) e.numberOfGroups = "At least 1 group required";
      if (!form.playersPerGroup || form.playersPerGroup < 2) e.playersPerGroup = "At least 2 players per group";
      if (!form.numberOfCourts || form.numberOfCourts < 1) e.numberOfCourts = "At least 1 court required";
    }
    if (step === 2 && selectedIds.length < 2) {
      e.members = "Select at least 2 members";
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
        numberOfGroups: Number(form.numberOfGroups),
        playersPerGroup: Number(form.playersPerGroup),
        numberOfCourts: Number(form.numberOfCourts),
        pointsForWin: Number(form.pointsForWin),
        pointsForLoss: Number(form.pointsForLoss),
      });

      const tournamentId = result.data._id;

      if (selectedIds.length > 0) {
        await addMembers({ tournamentId, memberIds: selectedIds });
      }

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
          {step === 2 && <Step3 selectedIds={selectedIds} setSelectedIds={setSelectedIds} />}
          {step === 3 && <Step4 form={form} selectedIds={selectedIds} membersData={membersData} />}

          {errors.members && (
            <p className="text-red-500 text-xs mt-3">{errors.members}</p>
          )}

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
