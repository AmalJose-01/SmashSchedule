import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Users, Layers, Swords, RefreshCw, CheckCircle,
  ChevronDown, ChevronUp, Trophy, Loader2, GripVertical, AlertTriangle, CalendarDays,
  Settings, Pencil, Lock, Search, UserPlus, CreditCard, Download
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter, useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ScoreEntry from "../components/ScoreEntry.jsx";
import {
  useGetRoundRobinTournament,
  useUpdateRoundRobinTournament,
  useGetTournamentPlayers,
  useGetGroups,
  useGetMatches,
  useGetStandings,
  useGenerateGroups,
  useSaveGroups,
  useFinalizeRoundRobinTournament,
  useRemovePlayerFromTournament,
  useGetRoundRobinMembers,
  useAddMembersToTournament,
  useCollectPayment,
  useGetPaymentStatus,
  useGetTournamentPayments,
  useRefundPayment,
  useDownloadMatchSchedulePdf,
} from "../services/roundRobin.queries.js";
import AppBackground from "../../../../components/AppBackground.jsx";
import { computeGroupStandings } from "../../shared/groupStandings.js";
import PageHeader from "../../../../components/PageHeader.jsx";
import PaymentQrModal from "../../../payments/components/PaymentQrModal.jsx";
import { useStripeStatus } from "../../../payments/services/stripePayments.js";

const STATUS_STYLES = {
  Draft:     "bg-white/10 text-slate-300",
  Active:    "bg-blue-500/15 text-blue-300",
  Scheduled: "bg-yellow-500/15 text-yellow-300",
  Finalized: "bg-teal-500/15 text-cyan-300",
  Ongoing:   "bg-green-500/15 text-green-300",
  Completed: "bg-purple-500/15 text-purple-300",
};

const MATCH_STATUS_STYLES = {
  scheduled:  "bg-white/10 text-slate-300",
  ongoing:    "bg-yellow-500/15 text-yellow-300",
  completed:  "bg-green-500/15 text-green-300",
  cancelled:  "bg-red-500/15 text-red-400",
};

const GRADE_COLORS = {
  A: "bg-red-500/15 text-red-300", B: "bg-orange-500/15 text-orange-300",
  C: "bg-yellow-500/15 text-yellow-300", D: "bg-green-500/15 text-green-300",
  E: "bg-blue-500/15 text-blue-300", Unrated: "bg-white/10 text-slate-300",
};

const TABS = [
  { key: "config",           label: "Config",           icon: Settings },
  { key: "players",          label: "Players",          icon: Users },
  { key: "groups",           label: "Groups",           icon: Layers },
  { key: "matches",          label: "Matches",          icon: Swords },
  { key: "standings",        label: "Standings",        icon: Trophy },
  { key: "playerStandings",  label: "Player Standings", icon: Trophy },
];

// ── DnD helpers ───────────────────────────────────────────────────────────────

const getPlayerId = (p) => String(p.playerId?._id ?? p.playerId);

const makeDndId = (groupId, player) => `${groupId}::${getPlayerId(player)}`;

// Draggable player card used inside SortableContext
const SortablePlayerCard = ({ id, name, grade }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-5 py-2.5 bg-transparent hover:bg-white/5 border-b border-slate-700/40 last:border-b-0"
    >
      <GripVertical
        className="w-4 h-4 text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0"
        {...attributes}
        {...listeners}
      />
      <span className="text-sm font-medium text-slate-200 flex-1">{name}</span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GRADE_COLORS[grade] ?? GRADE_COLORS.Unrated}`}>
        {grade ?? "—"}
      </span>
    </div>
  );
};

// Droppable group container — highlights when a dragged item hovers over it
const DroppableGroup = ({ id, children, className }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`${className} transition-shadow ${isOver ? "ring-2 ring-cyan-400 ring-inset" : ""}`}
    >
      {children}
    </div>
  );
};

// ── Sub-sections ──────────────────────────────────────────────────────────────

const inputCls = (err) =>
  `w-full bg-slate-900/50 border rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${err ? "border-red-500" : "border-slate-600"}`;

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</label>
    {children}
  </div>
);

// Date → value for <input type="datetime-local"> in the browser's local time.
const toLocalInput = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const ViewRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-slate-700/50 last:border-0">
    <span className="text-sm text-slate-400">{label}</span>
    <span className="text-sm font-semibold text-white">{value ?? "—"}</span>
  </div>
);

const ConfigTab = ({ tournament, isFinalized }) => {
  const { mutate: updateTournament, isPending } = useUpdateRoundRobinTournament();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    setForm({
      tournamentName: tournament.tournamentName ?? "",
      matchType:      tournament.matchType ?? "Singles",
      description:    tournament.description    ?? "",
      startDate:      tournament.startDate ? new Date(tournament.startDate).toISOString().slice(0, 16) : "",
      registrationDeadline: toLocalInput(tournament.registrationDeadline),
      endDate:        tournament.endDate   ? new Date(tournament.endDate).toISOString().slice(0, 16)   : "",
      numberOfCourts: tournament.numberOfCourts  ?? 1,
      numberOfSlots:  tournament.numberOfSlots ?? "",
      numberOfMatchesPerMember: tournament.numberOfMatchesPerMember ?? 3,
      entryFeeMember:    tournament.entryFeeMember    ?? 0,
      entryFeeNonMember: tournament.entryFeeNonMember ?? 0,
      pointsForWin:   tournament.pointsForWin    ?? 2,
      pointsForLoss:  tournament.pointsForLoss   ?? 0,
      numberOfSets:   tournament.numberOfSets    ?? 3,
      setWinningPoint:tournament.setWinningPoint ?? 21,
      winningPointGap:tournament.winningPointGap ?? 1,
    });
  }, [tournament]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.registrationDeadline) {
      toast.error("Registration deadline is required");
      return;
    }
    updateTournament(
      {
        id: tournament._id,
        data: {
          ...form,
          numberOfCourts:  Number(form.numberOfCourts),
          registrationDeadline: new Date(form.registrationDeadline).toISOString(),
          ...(form.numberOfSlots !== "" && { numberOfSlots: Number(form.numberOfSlots) }),
          numberOfMatchesPerMember: Number(form.numberOfMatchesPerMember),
          entryFeeMember:    Number(form.entryFeeMember),
          entryFeeNonMember: Number(form.entryFeeNonMember),
          pointsForWin:    Number(form.pointsForWin),
          pointsForLoss:   Number(form.pointsForLoss),
          numberOfSets:    Number(form.numberOfSets),
          setWinningPoint: Number(form.setWinningPoint),
          winningPointGap: Number(form.winningPointGap),
        },
      },
      { onSuccess: () => setEditing(false) }
    );
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  // ── View mode ──────────────────────────────────────────────────────────────
  if (!editing || isFinalized) {
    return (
      <div className="space-y-4">
        {isFinalized && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/40 border border-slate-600 rounded-xl px-4 py-2.5">
            <Lock className="w-3.5 h-3.5" />
            Configuration is locked once matches are scheduled.
          </div>
        )}

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="px-5 py-3 bg-slate-900/50 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Tournament Info</h3>
            {!isFinalized && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-white transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>
          <div className="px-5 py-1">
            <ViewRow label="Name"       value={tournament.tournamentName} />
            <ViewRow label="Match Type" value={tournament.matchType} />
            <ViewRow label="Status"     value={tournament.status} />
            <ViewRow label="Description" value={tournament.description || "—"} />
            <ViewRow label="Start Date" value={formatDate(tournament.startDate)} />
            <ViewRow label="Registration Deadline" value={formatDate(tournament.registrationDeadline)} />
            <ViewRow label="End Date"   value={formatDate(tournament.endDate)} />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="px-5 py-3 bg-slate-900/50 border-b border-slate-700/50">
            <h3 className="font-semibold text-white text-sm">Structure</h3>
          </div>
          <div className="px-5 py-1">
            <ViewRow label="Groups"            value={tournament.numberOfGroups} />
            <ViewRow label="Players per Group" value={tournament.playersPerGroup} />
            <ViewRow label="Matches per Member" value={tournament.numberOfMatchesPerMember} />
            <ViewRow label="Courts"            value={tournament.numberOfCourts} />
            <ViewRow label="Player Slots"      value={tournament.numberOfSlots ?? "—"} />
            <ViewRow label="Grouping Strategy" value={tournament.groupingStrategy} />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="px-5 py-3 bg-slate-900/50 border-b border-slate-700/50">
            <h3 className="font-semibold text-white text-sm">Payment</h3>
          </div>
          <div className="px-5 py-1">
            <ViewRow label="Member Fee" value={tournament.entryFeeMember > 0 ? `A$${tournament.entryFeeMember.toFixed(2)}` : "Free"} />
            <ViewRow label="Non-Member Fee" value={tournament.entryFeeNonMember > 0 ? `A$${tournament.entryFeeNonMember.toFixed(2)}` : "Free"} />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="px-5 py-3 bg-slate-900/50 border-b border-slate-700/50">
            <h3 className="font-semibold text-white text-sm">Scoring Rules</h3>
          </div>
          <div className="px-5 py-1">
            <ViewRow label="Number of Sets"  value={`Best of ${tournament.numberOfSets ?? 3}`} />
            <ViewRow label="Winning Point"   value={tournament.setWinningPoint ?? 21} />
            <ViewRow label="Winning Gap"     value={`${tournament.winningPointGap ?? 1} points`} />
            {/* Points for Win/Loss hidden — standings always score win=2,
            draw=1, loss=0 (see applyResult in standingsService.js), so these
            were never actually configurable in practice. */}
          </div>
        </div>
      </div>
    );
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Tournament Info */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 space-y-4">
        <h3 className="font-semibold text-slate-200 text-sm">Tournament Info</h3>
        <Field label="Tournament Name">
          <input type="text" value={form.tournamentName} onChange={(e) => set("tournamentName", e.target.value)} className={inputCls()} />
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className={inputCls() + " resize-none"} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date & Time">
            <input type="datetime-local" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={inputCls()} />
          </Field>
          <Field label="End Date & Time">
            <input type="datetime-local" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className={inputCls()} />
          </Field>
        </div>
        <Field label="Registration Deadline *">
          <input
            type="datetime-local"
            value={form.registrationDeadline}
            onChange={(e) => set("registrationDeadline", e.target.value)}
            className={inputCls(!form.registrationDeadline)}
          />
          {!form.registrationDeadline && <p className="text-red-400 text-xs mt-1">Registration deadline is required</p>}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Match Type">
            <select value={form.matchType} onChange={(e) => set("matchType", e.target.value)} className={inputCls()}>
              <option value="Singles">Singles</option>
              <option value="Doubles">Doubles</option>
            </select>
          </Field>
          <Field label="Matches per Member">
            <input type="number" min={1} value={form.numberOfMatchesPerMember} onChange={(e) => set("numberOfMatchesPerMember", e.target.value)} className={inputCls()} />
          </Field>
        </div>
        <p className="text-xs text-slate-400">
          Match Type and Matches per Member can only be changed before the schedule is generated — they lock once matches exist.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Number of Courts">
            <input type="number" min={1} value={form.numberOfCourts} onChange={(e) => set("numberOfCourts", e.target.value)} className={inputCls()} />
          </Field>
          <Field label="Number of Slots">
            <input type="number" min={1} value={form.numberOfSlots} onChange={(e) => set("numberOfSlots", e.target.value)} className={inputCls()} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Member Fee (A$)">
            <input type="number" min={0} step="0.01" value={form.entryFeeMember} onChange={(e) => set("entryFeeMember", e.target.value)} className={inputCls()} placeholder="0 = free" />
          </Field>
          <Field label="Non-Member Fee (A$)">
            <input type="number" min={0} step="0.01" value={form.entryFeeNonMember} onChange={(e) => set("entryFeeNonMember", e.target.value)} className={inputCls()} placeholder="0 = free" />
          </Field>
        </div>
      </div>

      {/* Scoring Rules */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 space-y-4">
        <h3 className="font-semibold text-slate-200 text-sm">Scoring Rules</h3>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Number of Sets">
            <select value={form.numberOfSets} onChange={(e) => set("numberOfSets", e.target.value)} className={inputCls()}>
              <option value={1}>Best of 1</option>
              <option value={2}>Best of 2</option>
              <option value={3}>Best of 3</option>
              <option value={5}>Best of 5</option>
            </select>
          </Field>
          <Field label="Winning Point">
            <input type="number" min={1} value={form.setWinningPoint} onChange={(e) => set("setWinningPoint", e.target.value)} className={inputCls()} />
          </Field>
          <Field label="Winning Gap">
            <input type="number" min={1} value={form.winningPointGap} onChange={(e) => set("winningPointGap", e.target.value)} className={inputCls()} />
          </Field>
        </div>
        <p className="text-xs text-slate-400">
          A set is won by reaching {form.setWinningPoint} points with a {form.winningPointGap}-point lead.
        </p>
        {/* Points for Win/Loss removed from editing too — fixed at 2/0
        (see the Scoring Rules view above). form.pointsForWin/pointsForLoss
        still round-trip through the form state unchanged so the save below
        keeps sending the tournament's existing values.
        <div className="grid grid-cols-2 gap-4">
          <Field label="Points for Win">
            <input type="number" min={0} value={form.pointsForWin} onChange={(e) => set("pointsForWin", e.target.value)} className={inputCls()} />
          </Field>
          <Field label="Points for Loss">
            <input type="number" min={0} value={form.pointsForLoss} onChange={(e) => set("pointsForLoss", e.target.value)} className={inputCls()} />
          </Field>
        </div>
        */}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setEditing(false)}
          className="px-4 py-2 rounded-xl border border-slate-600 text-sm font-medium text-slate-300 hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30 text-white text-sm font-semibold hover:from-cyan-600 hover:to-blue-600 disabled:opacity-60 transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

const AddPlayersPanel = ({ tournamentId, existingPlayers, defaultOpen = false, numberOfSlots }) => {
  const [open, setOpen] = useState(defaultOpen);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const { data: membersData, isLoading } = useGetRoundRobinMembers();
  const { mutate: addMembers, isPending } = useAddMembersToTournament();

  const existingEmails = new Set(existingPlayers.map((p) => p.email));
  // Only approved members with a grade can be added to a round robin.
  const members = (membersData?.data ?? []).filter(
    (m) => !existingEmails.has(m.email) && m.status !== "pending" && !!m.grade
  );
  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  // Number of Slots is a hard cap: never select more players than free slots.
  const hasLimit = Number(numberOfSlots) > 0;
  const remaining = hasLimit ? Math.max(0, numberOfSlots - existingPlayers.length) : Infinity;
  const isFull = hasLimit && remaining === 0;
  const atLimit = selectedIds.length >= remaining;

  const toggle = (id) =>
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= remaining) return prev; // no free slot left
      return [...prev, id];
    });

  // "Select all" fills only the free slots.
  const selectableCount = Math.min(filtered.length, remaining);
  const toggleAll = () =>
    setSelectedIds(
      selectedIds.length >= selectableCount && selectedIds.length > 0
        ? []
        : filtered.slice(0, selectableCount).map((m) => m._id)
    );

  const handleAdd = () => {
    addMembers(
      { tournamentId, memberIds: selectedIds },
      { onSuccess: () => { setSelectedIds([]); setOpen(false); } }
    );
  };

  if (isFull) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5">
        <Lock className="w-4 h-4" /> Tournament is full — all {numberOfSlots} slots are taken. Increase Number of Slots on the Config tab to add more.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-cyan-300 font-semibold border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-2.5 rounded-xl transition-colors"
      >
        <UserPlus className="w-4 h-4" /> Add Players
      </button>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-200 text-sm">Add Players from Member Bank</h3>
          {hasLimit && (
            <p className="text-xs text-slate-400 mt-0.5">
              {existingPlayers.length}/{numberOfSlots} slots used · {remaining - selectedIds.length} left after this selection
            </p>
          )}
        </div>
        <button onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-white">
          Close
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
        />
      </div>

      {isLoading ? (
        <p className="text-center text-slate-400 py-6 text-sm">Loading members...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-400 py-6 text-sm">
          {members.length === 0 ? "All members are already in this tournament." : "No members match your search."}
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className={`text-xs ${hasLimit && atLimit ? "text-amber-300" : "text-slate-400"}`}>
              {selectedIds.length} selected
              {hasLimit && atLimit && " — slot limit reached"}
            </p>
            <button onClick={toggleAll} className="text-xs text-cyan-400 font-medium hover:underline">
              {selectedIds.length >= selectableCount && selectedIds.length > 0
                ? "Deselect all"
                : hasLimit && selectableCount < filtered.length
                ? `Select first ${selectableCount}`
                : "Select all"}
            </button>
          </div>
          <div className="border border-slate-600 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            {filtered.map((m) => {
              const checked = selectedIds.includes(m._id);
              return (
                <label
                  key={m._id}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-slate-700/50 last:border-0 ${
                    checked ? "bg-cyan-500/10" : atLimit ? "opacity-40 cursor-not-allowed" : "hover:bg-white/5"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(m._id)}
                    disabled={!checked && atLimit}
                    className="accent-cyan-500 w-4 h-4"
                  />
                  <span className="flex-1 text-sm font-medium text-white">{m.name}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GRADE_COLORS[m.grade] ?? GRADE_COLORS.Unrated}`}>
                    {m.grade}
                  </span>
                </label>
              );
            })}
          </div>
        </>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleAdd}
          disabled={selectedIds.length === 0 || isPending}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {isPending ? "Adding..." : `Add ${selectedIds.length || ""} Player${selectedIds.length === 1 ? "" : "s"}`}
        </button>
      </div>
    </div>
  );
};

// Card payment for one registered player's entry fee via Stripe Checkout.
// "Collect Payment" opens a QR code the player scans to pay on their phone;
// the row polls until Stripe confirms. `existingPayment` is the player's latest
// payment record, so the right state shows on load/refresh.
const CollectPaymentButton = ({ tournamentId, player, existingPayment, entryFee, canCollect }) => {
  const [paymentId, setPaymentId] = useState(existingPayment?._id ?? null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const { mutate: collect, isPending } = useCollectPayment();
  const { mutate: refund, isPending: refunding } = useRefundPayment();
  const { data: statusData } = useGetPaymentStatus(paymentId);
  const payment = statusData?.data ?? existingPayment;
  const status = payment?.status;
  const isStripe = (payment?.provider ?? "stripe") === "stripe";

  useEffect(() => {
    setPaymentId(existingPayment?._id ?? null);
  }, [existingPayment?._id]);

  const openQr = (url) => {
    setCheckoutUrl(url);
    setQrOpen(true);
  };

  const handleCollect = () => {
    collect(
      { tournamentId, playerId: player._id },
      {
        onSuccess: (res) => {
          setPaymentId(res?.data?.paymentId ?? null);
          if (res?.data?.checkoutUrl) openQr(res.data.checkoutUrl);
        },
      }
    );
  };

  const handleRefund = () => {
    if (!window.confirm(`Refund A$${Number(payment?.amount ?? entryFee).toFixed(2)} to ${player.name}?`)) return;
    refund(payment._id);
  };

  const modal = (
    <PaymentQrModal
      open={qrOpen && !!checkoutUrl}
      onClose={() => setQrOpen(false)}
      url={checkoutUrl}
      playerName={player.name}
      amount={payment?.amount ?? entryFee}
      status={status}
    />
  );

  if (status === "COMPLETED") {
    return (
      <span className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
          <CheckCircle className="w-3.5 h-3.5" /> Paid
        </span>
        {isStripe && (
          <button onClick={handleRefund} disabled={refunding} className="text-[11px] text-slate-400 hover:text-red-300 disabled:opacity-50">
            {refunding ? "Refunding…" : "Refund"}
          </button>
        )}
        {modal}
      </span>
    );
  }

  if (status === "REFUNDED") {
    return <span className="text-xs text-slate-400 font-medium">Refunded</span>;
  }

  if (paymentId && status === "PENDING" && isStripe) {
    return (
      <span className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Awaiting payment
        </span>
        <button
          onClick={() => (payment?.checkoutUrl ? openQr(payment.checkoutUrl) : handleCollect())}
          className="text-[11px] font-semibold text-cyan-400 hover:underline"
        >
          Show QR
        </button>
        {modal}
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleCollect}
        disabled={isPending || !canCollect}
        title={canCollect ? undefined : "Set up payouts first"}
        className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded-lg hover:bg-cyan-500/10 disabled:opacity-50 transition-colors"
      >
        <CreditCard className="w-3.5 h-3.5" />
        {isPending ? "Creating..." : status === "CANCELED" || status === "FAILED" ? "Retry Payment" : "Collect Payment"}
      </button>
      {modal}
    </>
  );
};

const PlayersTab = ({ tournamentId, isFinalized, tournament }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetTournamentPlayers(tournamentId);
  const { mutate: removePlayer, isPending } = useRemovePlayerFromTournament();
  const { data: stripeStatusData } = useStripeStatus();
  const hasEntryFee = (tournament?.entryFeeMember ?? 0) > 0 || (tournament?.entryFeeNonMember ?? 0) > 0;
  const { data: paymentsData } = useGetTournamentPayments(hasEntryFee ? tournamentId : null);
  const players = data?.data ?? [];
  const payoutsReady = !!stripeStatusData?.data?.chargesEnabled;
  const paymentsByPlayerId = (paymentsData?.data ?? []).reduce((map, payment) => {
    map[payment.playerId] = payment;
    return map;
  }, {});

  if (isLoading) return <Spinner />;

  if (players.length === 0)
    return (
      <div className="space-y-4">
        {isFinalized ? (
          <div className="text-center py-14">
            <Users className="w-10 h-10 text-white/30 mx-auto mb-3" />
            <p className="text-white/70 text-sm">No players registered yet.</p>
            <p className="text-xs text-white/60 mt-1">Players can no longer be added once matches are scheduled.</p>
          </div>
        ) : (
          <AddPlayersPanel tournamentId={tournamentId} existingPlayers={players} defaultOpen numberOfSlots={tournament?.numberOfSlots} />
        )}
      </div>
    );

  return (
    <div className="space-y-3">
      {hasEntryFee && stripeStatusData && !payoutsReady && (
        <div className="flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-amber-200">
          <span>This tournament has an entry fee. Set up payouts to your club's bank account to take card payments.</span>
          <button
            onClick={() => navigate("/admin/club-profile/payments")}
            className="flex-shrink-0 text-xs font-semibold text-cyan-300 hover:underline"
          >
            Set up payouts →
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400 font-medium">
          {players.length}
          {tournament?.numberOfSlots ? ` / ${tournament.numberOfSlots}` : ""} player{players.length !== 1 ? "s" : ""} registered
        </p>
        {isFinalized && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5" /> Locked — matches already scheduled
          </span>
        )}
      </div>

      {!isFinalized && <AddPlayersPanel tournamentId={tournamentId} existingPlayers={players} numberOfSlots={tournament?.numberOfSlots} />}

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-slate-400 text-left text-xs uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Grade</th>
              <th className="px-5 py-3 font-semibold">Membership</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Contact</th>
              {hasEntryFee && <th className="px-5 py-3 font-semibold">Payment</th>}
              {!isFinalized && <th className="px-5 py-3 font-semibold text-right">Remove</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {players.map((p) => (
              <tr key={p._id} className="hover:bg-white/5">
                <td className="px-5 py-3 font-medium text-white">{p.name}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GRADE_COLORS[p.grade] ?? GRADE_COLORS.Unrated}`}>
                    {p.grade}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.isMember ? "bg-teal-500/15 text-cyan-300" : "bg-white/10 text-slate-300"}`}>
                    {p.isMember ? "Member" : "Non-Member"}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-400">{p.email}</td>
                <td className="px-5 py-3 text-slate-400">{p.contact}</td>
                {hasEntryFee && (
                  <td className="px-5 py-3">
                    <CollectPaymentButton
                      tournamentId={tournamentId}
                      player={p}
                      existingPayment={paymentsByPlayerId[p._id]}
                      entryFee={p.isMember ? tournament?.entryFeeMember : tournament?.entryFeeNonMember}
                      canCollect={payoutsReady}
                    />
                  </td>
                )}
                {!isFinalized && (
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => removePlayer({ tournamentId, playerId: p._id })}
                      disabled={isPending}
                      className="text-xs text-red-400 hover:text-red-300 font-medium disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const GroupsTab = ({ tournamentId, isFinalized }) => {
  const { data, isLoading } = useGetGroups(tournamentId);
  const { data: matchesData } = useGetMatches(tournamentId);
  const { mutate: saveGroups, isPending: isSaving } = useSaveGroups();

  const hasScores = (matchesData?.data ?? []).some(
    (m) => m.status !== "scheduled" || m.sets?.length > 0
  );
  const rearrangeLocked = isFinalized || hasScores;
  const [expanded, setExpanded] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [localGroups, setLocalGroups] = useState(null);
  const [activePlayer, setActivePlayer] = useState(null);

  const serverGroups = data?.data ?? [];
  const groups = isEditing ? (localGroups ?? serverGroups) : serverGroups;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleEdit = () => {
    setLocalGroups(serverGroups.map((g) => ({ ...g, players: [...g.players] })));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setLocalGroups(null);
    setIsEditing(false);
    setActivePlayer(null);
  };

  const handleDragStart = ({ active }) => {
    const [groupId, playerId] = active.id.split("::");
    const group = (localGroups ?? serverGroups).find((g) => g._id === groupId);
    const player = group?.players.find((p) => getPlayerId(p) === playerId);
    setActivePlayer(player ?? null);
  };

  const handleDragEnd = ({ active, over }) => {
    setActivePlayer(null);
    if (!over || active.id === over.id) return;

    const [sourceGroupId, activePlayerId] = active.id.split("::");
    const targetGroupId = over.id.includes("::") ? over.id.split("::")[0] : over.id;

    if (sourceGroupId === targetGroupId) return;

    setLocalGroups((prev) =>
      prev.map((g) => {
        if (g._id === sourceGroupId) {
          return { ...g, players: g.players.filter((p) => getPlayerId(p) !== activePlayerId) };
        }
        if (g._id === targetGroupId) {
          const srcGroup = prev.find((x) => x._id === sourceGroupId);
          const movedPlayer = srcGroup?.players.find((p) => getPlayerId(p) === activePlayerId);
          return movedPlayer ? { ...g, players: [...g.players, movedPlayer] } : g;
        }
        return g;
      })
    );
  };

  const handleSave = () => {
    saveGroups(
      {
        tournamentId,
        groups: (localGroups ?? serverGroups).map((g) => ({
          groupName: g.groupName,
          players: g.players.map((p) => ({
            playerId: p.playerId?._id ?? p.playerId,
            name: p.name,
          })),
        })),
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          setLocalGroups(null);
        },
      }
    );
  };

  if (isLoading) return <Spinner />;
  if (serverGroups.length === 0)
    return <Empty text="No groups yet. Use 'Generate Groups' above." />;

  // ── Read-only view ──────────────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          {rearrangeLocked ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/40 border border-slate-600 rounded-xl px-4 py-2.5">
              <Lock className="w-3.5 h-3.5" />
              {hasScores
                ? "Groups are locked once scores have been entered."
                : "Groups are locked once matches have been scheduled."}
            </div>
          ) : (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 text-sm font-semibold text-cyan-300 border border-cyan-500/40 px-4 py-2 rounded-xl hover:bg-cyan-500/10 transition-colors"
            >
              <GripVertical className="w-4 h-4" />
              Rearrange Players
            </button>
          )}
        </div>
        {serverGroups.map((g) => {
          const open = expanded[g._id] !== false;
          return (
            <div key={g._id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
                onClick={() => setExpanded((prev) => ({ ...prev, [g._id]: !open }))}
              >
                <span className="font-semibold text-white">{g.groupName}</span>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <span>{g.players?.length ?? 0} players</span>
                  {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              {open && (
                <div className="border-t border-slate-700/50 divide-y divide-slate-700/40">
                  {(g.players ?? []).map((p) => (
                    <div key={getPlayerId(p)} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="text-sm font-medium text-slate-200 flex-1">{p.name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GRADE_COLORS[p.playerId?.grade] ?? GRADE_COLORS.Unrated}`}>
                        {p.playerId?.grade ?? "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Edit / drag mode ────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-200">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        Saving updates the group arrangement. The match schedule is created when you click Finalize, so you can keep rearranging until then.
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g) => {
            const playerIds = g.players.map((p) => makeDndId(g._id, p));
            return (
              <DroppableGroup
                key={g._id}
                id={g._id}
                className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden"
              >
                <div className="px-5 py-3 bg-slate-900/50 border-b border-slate-700/50 flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{g.groupName}</span>
                  <span className="text-xs text-cyan-400">{g.players.length} players</span>
                </div>
                <SortableContext items={playerIds} strategy={verticalListSortingStrategy}>
                  <div className="min-h-[60px]">
                    {g.players.map((p) => (
                      <SortablePlayerCard
                        key={getPlayerId(p)}
                        id={makeDndId(g._id, p)}
                        name={p.name}
                        grade={p.playerId?.grade}
                      />
                    ))}
                    {g.players.length === 0 && (
                      <p className="text-xs text-slate-400 px-5 py-5 text-center">Drop players here</p>
                    )}
                  </div>
                </SortableContext>
              </DroppableGroup>
            );
          })}
        </div>

        <DragOverlay>
          {activePlayer && (
            <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-800 border border-cyan-500/60 rounded-xl shadow-2xl shadow-cyan-500/20 opacity-95">
              <GripVertical className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-200 flex-1">{activePlayer.name}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GRADE_COLORS[activePlayer.playerId?.grade] ?? GRADE_COLORS.Unrated}`}>
                {activePlayer.playerId?.grade ?? "—"}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={handleCancel}
          className="px-4 py-2 rounded-xl border border-slate-600 text-sm font-medium text-slate-300 hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30 text-white text-sm font-semibold hover:from-cyan-600 hover:to-blue-600 disabled:opacity-60 transition-colors"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {isSaving ? "Saving..." : "Save & Regenerate"}
        </button>
      </div>
    </div>
  );
};

const MatchesTab = ({ tournamentId, matchType, tournament }) => {
  const [expandedId, setExpandedId] = useState(null);
  const { data, isLoading } = useGetMatches(tournamentId);
  const matches = data?.data ?? [];
  const { mutate: downloadPdf, isPending: isDownloadingPdf } = useDownloadMatchSchedulePdf();

  const handleDownloadPdf = () => {
    downloadPdf(tournamentId, {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${(tournament?.tournamentName || "Match_Schedule").replace(/\s+/g, "_")}_Match_Schedule.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      },
    });
  };

  if (isLoading) return <Spinner />;
  if (matches.length === 0)
    return <Empty text="No matches yet. Click 'Finalize & Schedule Matches' once your groups are set." />;

  // For doubles, group by fixture extracted from matchName ("Group A vs Group B - Match X")
  // For singles, group by the group document name
  const byGroup = matches.reduce((acc, m) => {
    let key;
    if (matchType === "Doubles") {
      // matchName is "Group A vs Group B - Match X" — extract the fixture prefix
      const parts = m.matchName.split(" - Match ");
      key = parts.length > 1 ? parts[0] : (m.groupId?.groupName ?? "Doubles Matches");
    } else {
      key = m.groupId?.groupName ?? "Ungrouped";
    }
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf}
          className="flex items-center gap-2 bg-white/10 border border-white/15 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/20 disabled:opacity-60 transition-colors"
        >
          <Download className="w-4 h-4" />
          {isDownloadingPdf ? "Generating PDF..." : "Download Match Schedule (PDF)"}
        </button>
      </div>
      {Object.entries(byGroup).map(([groupName, groupMatches]) => (
        <div key={groupName}>
          <h3 className="font-semibold text-white mb-3 text-sm">{groupName}</h3>
          <div className="space-y-2">
            {groupMatches.map((m) => {
              const isCompleted = m.status === "completed";
              const winnerId = m.winner?._id?.toString() ?? m.winner?.toString();
              const p1Id     = m.player1Id?._id?.toString() ?? m.player1Id?.toString();
              const homeWon  = isCompleted && !!winnerId && winnerId === p1Id;
              const awayWon  = isCompleted && !!winnerId && winnerId !== p1Id;

              const team1Name = m.player1PartnerId
                ? `${m.player1Id?.name ?? "—"} / ${m.player1PartnerId?.name ?? "—"}`
                : (m.player1Id?.name ?? "—");
              const team2Name = m.isBye
                ? "BYE"
                : m.player2PartnerId
                ? `${m.player2Id?.name ?? "—"} / ${m.player2PartnerId?.name ?? "—"}`
                : (m.player2Id?.name ?? "—");

              const isExpanded = expandedId === m._id;

              return (
                <div key={m._id} className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden">
                  <div
                    className="px-5 py-3 flex items-center gap-4 hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => setExpandedId((prev) => (prev === m._id ? null : m._id))}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-400 truncate mb-1">{m.matchName}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold px-2 py-0.5 rounded-lg ${
                          homeWon ? "bg-green-500/15 text-green-300" :
                          awayWon ? "text-red-400" :
                          "text-white"
                        }`}>
                          {team1Name}
                        </span>
                        <span className="inline-block px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold flex-shrink-0">VS</span>
                        <span className={`text-sm font-semibold px-2 py-0.5 rounded-lg ${
                          awayWon ? "bg-green-500/15 text-green-300" :
                          homeWon ? "text-red-400" :
                          "text-white"
                        }`}>
                          {team2Name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {m.sets?.length > 0 && (
                        <span className="text-xs text-slate-400 font-mono">
                          {m.sets.map((s) => `${s.home}-${s.away}`).join(", ")}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">{m.court}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MATCH_STATUS_STYLES[m.status] ?? ""}`}>
                        {m.status}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-700/50 bg-slate-900/40 p-4">
                      <ScoreEntry
                        match={m}
                        tournamentId={tournamentId}
                        tournament={tournament}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// Group-level standings (one row per group, aggregated from player stats / 2)
const StandingsTab = ({ tournamentId, matchType }) => {
  const { data, isLoading } = useGetStandings(tournamentId);
  const { data: matchesData, isLoading: matchesLoading } = useGetMatches(tournamentId);
  const groups = data?.data ?? [];

  if (isLoading || matchesLoading) return <Spinner />;
  if (groups.length === 0)
    return <Empty text="Standings will appear after matches are played." />;

  const groupRows = computeGroupStandings(groups, matchesData?.data ?? [], matchType);

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-900/60 text-slate-400 text-left text-xs uppercase tracking-wider">
          <tr>
            <th className="px-5 py-2 font-semibold">#</th>
            <th className="px-5 py-2 font-semibold">Group</th>
            <th className="px-4 py-2 font-semibold text-center">P</th>
            <th className="px-4 py-2 font-semibold text-center">W</th>
            <th className="px-4 py-2 font-semibold text-center">D</th>
            <th className="px-4 py-2 font-semibold text-center">L</th>
            <th className="px-4 py-2 font-semibold text-center">+/-</th>
            <th className="px-4 py-2 font-semibold text-center">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {groupRows.map((g, i) => (
            <tr key={g._id} className={i === 0 ? "bg-amber-500/10" : "hover:bg-white/5"}>
              <td className="px-5 py-2.5 font-bold text-slate-400">{i + 1}</td>
              <td className="px-5 py-2.5 font-medium text-white">{g.groupName}</td>
              <td className="px-4 py-2.5 text-center text-slate-300">{g.matchesPlayed}</td>
              <td className="px-4 py-2.5 text-center text-emerald-400 font-semibold">{g.wins}</td>
              <td className="px-4 py-2.5 text-center text-amber-400">{g.draws}</td>
              <td className="px-4 py-2.5 text-center text-red-400">{g.losses}</td>
              <td className={`px-4 py-2.5 text-center font-medium ${g.pointsDiff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {g.pointsDiff >= 0 ? "+" : ""}{g.pointsDiff}
              </td>
              <td className="px-4 py-2.5 text-center font-bold text-cyan-300">{g.totalPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Player-level standings (original view — one row per player, grouped by group)
const PlayerStandingsTab = ({ tournamentId }) => {
  const { data, isLoading } = useGetStandings(tournamentId);
  const groups = data?.data ?? [];

  if (isLoading) return <Spinner />;
  if (groups.length === 0)
    return <Empty text="Standings will appear after matches are played." />;

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g._id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="px-5 py-3 bg-slate-900/50 border-b border-slate-700/50">
            <h3 className="font-semibold text-white text-sm">{g.groupName}</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 text-slate-400 text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-2 font-semibold">#</th>
                <th className="px-5 py-2 font-semibold">Player</th>
                <th className="px-4 py-2 font-semibold text-center">P</th>
                <th className="px-4 py-2 font-semibold text-center">W</th>
                <th className="px-4 py-2 font-semibold text-center">D</th>
                <th className="px-4 py-2 font-semibold text-center">L</th>
                <th className="px-4 py-2 font-semibold text-center">PF</th>
                <th className="px-4 py-2 font-semibold text-center">PA</th>
                <th className="px-4 py-2 font-semibold text-center">+/-</th>
                <th className="px-4 py-2 font-semibold text-center">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {(g.standings ?? []).map((s, i) => (
                <tr key={s.playerId?._id ?? i} className={i === 0 ? "bg-amber-500/10" : "hover:bg-white/5"}>
                  <td className="px-5 py-2.5 font-bold text-slate-400">{i + 1}</td>
                  <td className="px-5 py-2.5 font-medium text-white">{s.name ?? s.playerId?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-center text-slate-300">{s.matchesPlayed}</td>
                  <td className="px-4 py-2.5 text-center text-emerald-400 font-semibold">{s.wins}</td>
                  <td className="px-4 py-2.5 text-center text-amber-400">{s.draws ?? 0}</td>
                  <td className="px-4 py-2.5 text-center text-red-400">{s.losses}</td>
                  <td className="px-4 py-2.5 text-center text-slate-300">{s.pointsFor}</td>
                  <td className="px-4 py-2.5 text-center text-slate-300">{s.pointsAgainst}</td>
                  <td className={`px-4 py-2.5 text-center font-medium ${s.pointsDiff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {s.pointsDiff >= 0 ? "+" : ""}{s.pointsDiff}
                  </td>
                  <td className="px-4 py-2.5 text-center font-bold text-cyan-300">{s.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex justify-center py-12">
    <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
  </div>
);

const Empty = ({ text }) => (
  <div className="text-center py-14 text-white/60 text-sm">{text}</div>
);

// ── Main component ────────────────────────────────────────────────────────────
const TournamentDetail = () => {
  const navigate = useNavigate();
  const { id: tournamentId } = useParams();
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab || "players");

  const { data: tData, isLoading: tLoading } = useGetRoundRobinTournament(tournamentId);
  const { mutate: generateGroups, isPending: isGenerating } = useGenerateGroups();
  const { mutate: finalize, isPending: isFinalizing } = useFinalizeRoundRobinTournament();

  const tournament = tData?.data;

  if (tLoading) return (
    <AppBackground className="flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
    </AppBackground>
  );

  if (!tournament) return (
    <AppBackground className="flex items-center justify-center text-white/60">
      Tournament not found.
    </AppBackground>
  );

  const isPostFinalize = ["Finalized", "Ongoing", "Completed"].includes(tournament.status);
  // Groups can be generated/regenerated freely any time before the tournament
  // is finalized — generating groups no longer schedules matches or locks
  // anything, so it doesn't need its own status gate beyond "not finalized yet".
  const canGenerate = !isPostFinalize;
  // Finalize is the step that actually schedules the matches, so it just
  // needs groups to exist and the tournament to not already be finalized.
  const canFinalize = !isPostFinalize && (tournament.groups?.length ?? 0) > 0;

  return (
    <AppBackground>
      <PageHeader
        title={tournament.tournamentName}
        onBack={() => navigate("/round-robin/tournaments")}
        subtitle={
          <>
            <p>{tournament.matchType} · {tournament.numberOfGroups} groups · {tournament.numberOfCourts} courts</p>
            {(tournament.startDate || tournament.endDate) && (
              <p className="flex items-center gap-1 mt-0.5">
                <CalendarDays className="w-3 h-3" />
                {tournament.startDate ? new Date(tournament.startDate).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                {tournament.endDate && <> → {new Date(tournament.endDate).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</>}
              </p>
            )}
          </>
        }
        actions={
          <span className={`hidden sm:inline-block text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[tournament.status] ?? ""}`}>
            {tournament.status}
          </span>
        }
      />

      <div className="px-[10px] py-6 w-full">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          {canGenerate ? (
            <button
              onClick={() => generateGroups(tournamentId)}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-cyan-600 hover:to-blue-600 disabled:opacity-60 transition-colors"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {isGenerating ? "Generating..." : tournament.groups?.length > 0 ? "Regenerate Groups" : "Generate Groups"}
            </button>
          ) : isPostFinalize && (
            <button
              disabled
              className="flex items-center gap-2 bg-white/10 text-slate-400 px-4 py-2 rounded-xl text-sm font-semibold cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              Regenerate Groups
            </button>
          )}
          {canFinalize ? (
            <button
              onClick={() => finalize(tournamentId)}
              disabled={isFinalizing}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/30 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {isFinalizing ? "Scheduling matches..." : "Finalize & Schedule Matches"}
            </button>
          ) : isPostFinalize && (
            <button
              disabled
              className="flex items-center gap-2 bg-white/10 text-slate-400 px-4 py-2 rounded-xl text-sm font-semibold cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              Tournament Finalized
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/20 mb-6 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === key
                  ? "border-cyan-400 text-white"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "config"    && <ConfigTab    tournament={tournament} isFinalized={isPostFinalize} />}
        {tab === "players"   && <PlayersTab   tournamentId={tournamentId} isFinalized={isPostFinalize} tournament={tournament} />}
        {tab === "groups"    && <GroupsTab    tournamentId={tournamentId} isFinalized={isPostFinalize} />}
        {tab === "matches"   && <MatchesTab   tournamentId={tournamentId} matchType={tournament.matchType} tournament={tournament} />}
        {tab === "standings"       && <StandingsTab       tournamentId={tournamentId} matchType={tournament.matchType} />}
        {tab === "playerStandings" && <PlayerStandingsTab tournamentId={tournamentId} />}
      </div>
    </AppBackground>
  );
};

export default TournamentDetail;
