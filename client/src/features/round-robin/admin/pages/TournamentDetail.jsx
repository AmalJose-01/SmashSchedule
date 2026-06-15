import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Users, Layers, Swords, RefreshCw, CheckCircle,
  ChevronDown, ChevronUp, Trophy, Loader2, GripVertical, AlertTriangle, CalendarDays,
  Settings, Pencil, Lock
} from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter, useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Logout from "../../../../components/Logout.jsx";
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
} from "../services/roundRobin.queries.js";

const STATUS_STYLES = {
  Draft:     "bg-gray-100 text-gray-600",
  Active:    "bg-blue-100 text-blue-700",
  Scheduled: "bg-yellow-100 text-yellow-700",
  Ongoing:   "bg-green-100 text-green-700",
  Completed: "bg-purple-100 text-purple-700",
};

const MATCH_STATUS_STYLES = {
  scheduled:  "bg-gray-100 text-gray-600",
  ongoing:    "bg-yellow-100 text-yellow-700",
  completed:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-500",
};

const GRADE_COLORS = {
  A: "bg-red-100 text-red-700", B: "bg-orange-100 text-orange-700",
  C: "bg-yellow-100 text-yellow-700", D: "bg-green-100 text-green-700",
  E: "bg-blue-100 text-blue-700", Unrated: "bg-gray-100 text-gray-600",
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
      className="flex items-center gap-3 px-5 py-2.5 bg-white border-b border-gray-50 last:border-b-0"
    >
      <GripVertical
        className="w-4 h-4 text-gray-300 cursor-grab active:cursor-grabbing flex-shrink-0"
        {...attributes}
        {...listeners}
      />
      <span className="text-sm font-medium text-gray-700 flex-1">{name}</span>
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
      className={`${className} transition-shadow ${isOver ? "ring-2 ring-teal-400 ring-inset" : ""}`}
    >
      {children}
    </div>
  );
};

// ── Sub-sections ──────────────────────────────────────────────────────────────

const inputCls = (err) =>
  `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 ${err ? "border-red-400" : "border-gray-200"}`;

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
    {children}
  </div>
);

const ViewRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-semibold text-gray-800">{value ?? "—"}</span>
  </div>
);

const ConfigTab = ({ tournament, isFinalized }) => {
  const { mutate: updateTournament, isPending } = useUpdateRoundRobinTournament();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    setForm({
      tournamentName: tournament.tournamentName ?? "",
      description:    tournament.description    ?? "",
      startDate:      tournament.startDate ? new Date(tournament.startDate).toISOString().slice(0, 16) : "",
      endDate:        tournament.endDate   ? new Date(tournament.endDate).toISOString().slice(0, 16)   : "",
      numberOfCourts: tournament.numberOfCourts  ?? 1,
      pointsForWin:   tournament.pointsForWin    ?? 2,
      pointsForLoss:  tournament.pointsForLoss   ?? 0,
      numberOfSets:   tournament.numberOfSets    ?? 3,
      setWinningPoint:tournament.setWinningPoint ?? 21,
      winningPointGap:tournament.winningPointGap ?? 2,
    });
  }, [tournament]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    updateTournament(
      {
        id: tournament._id,
        data: {
          ...form,
          numberOfCourts:  Number(form.numberOfCourts),
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
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
            <Lock className="w-3.5 h-3.5" />
            Configuration is locked once matches are scheduled.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
            <h3 className="font-semibold text-teal-800 text-sm">Tournament Info</h3>
            {!isFinalized && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors"
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
            <ViewRow label="End Date"   value={formatDate(tournament.endDate)} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-teal-50 border-b border-teal-100">
            <h3 className="font-semibold text-teal-800 text-sm">Structure</h3>
          </div>
          <div className="px-5 py-1">
            <ViewRow label="Groups"            value={tournament.numberOfGroups} />
            <ViewRow label="Players per Group" value={tournament.playersPerGroup} />
            <ViewRow label="Courts"            value={tournament.numberOfCourts} />
            <ViewRow label="Grouping Strategy" value={tournament.groupingStrategy} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-teal-50 border-b border-teal-100">
            <h3 className="font-semibold text-teal-800 text-sm">Scoring Rules</h3>
          </div>
          <div className="px-5 py-1">
            <ViewRow label="Number of Sets"  value={`Best of ${tournament.numberOfSets ?? 3}`} />
            <ViewRow label="Winning Point"   value={tournament.setWinningPoint ?? 21} />
            <ViewRow label="Winning Gap"     value={`${tournament.winningPointGap ?? 2} points`} />
            <ViewRow label="Points for Win"  value={tournament.pointsForWin ?? 2} />
            <ViewRow label="Points for Loss" value={tournament.pointsForLoss ?? 0} />
          </div>
        </div>
      </div>
    );
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Tournament Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h3 className="font-semibold text-gray-700 text-sm">Tournament Info</h3>
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
        <Field label="Number of Courts">
          <input type="number" min={1} value={form.numberOfCourts} onChange={(e) => set("numberOfCourts", e.target.value)} className={inputCls()} />
        </Field>
      </div>

      {/* Scoring Rules */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h3 className="font-semibold text-gray-700 text-sm">Scoring Rules</h3>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Number of Sets">
            <select value={form.numberOfSets} onChange={(e) => set("numberOfSets", e.target.value)} className={inputCls() + " bg-white"}>
              <option value={1}>Best of 1</option>
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
        <p className="text-xs text-gray-400">
          A set is won by reaching {form.setWinningPoint} points with a {form.winningPointGap}-point lead.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Points for Win">
            <input type="number" min={0} value={form.pointsForWin} onChange={(e) => set("pointsForWin", e.target.value)} className={inputCls()} />
          </Field>
          <Field label="Points for Loss">
            <input type="number" min={0} value={form.pointsForLoss} onChange={(e) => set("pointsForLoss", e.target.value)} className={inputCls()} />
          </Field>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setEditing(false)}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

const PlayersTab = ({ tournamentId }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetTournamentPlayers(tournamentId);
  const { mutate: removePlayer, isPending } = useRemovePlayerFromTournament();
  const players = data?.data ?? [];

  if (isLoading) return <Spinner />;

  if (players.length === 0)
    return (
      <div className="text-center py-14">
        <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-400 text-sm mb-4">No players registered yet.</p>
        <button
          onClick={() => navigate("/round-robin/members")}
          className="inline-flex items-center gap-2 text-sm text-teal-600 font-semibold hover:underline"
        >
          Go to Member Bank →
        </button>
      </div>
    );

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 font-medium">{players.length} player{players.length !== 1 ? "s" : ""} registered</p>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-teal-50 text-teal-700 text-left">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Grade</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Contact</th>
              <th className="px-5 py-3 font-semibold text-right">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {players.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GRADE_COLORS[p.grade] ?? GRADE_COLORS.Unrated}`}>
                    {p.grade}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500">{p.email}</td>
                <td className="px-5 py-3 text-gray-500">{p.contact}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => removePlayer({ tournamentId, playerId: p._id })}
                    disabled={isPending}
                    className="text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-50"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const GroupsTab = ({ tournamentId }) => {
  const { data, isLoading } = useGetGroups(tournamentId);
  const { data: matchesData } = useGetMatches(tournamentId);
  const { mutate: saveGroups, isPending: isSaving } = useSaveGroups();

  const hasScores = (matchesData?.data ?? []).some(
    (m) => m.status !== "scheduled" || m.sets?.length > 0
  );
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
          {hasScores ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <Lock className="w-3.5 h-3.5" />
              Groups are locked once scores have been entered.
            </div>
          ) : (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 text-sm font-semibold text-teal-700 border border-teal-300 px-4 py-2 rounded-xl hover:bg-teal-50 transition-colors"
            >
              <GripVertical className="w-4 h-4" />
              Rearrange Players
            </button>
          )}
        </div>
        {serverGroups.map((g) => {
          const open = expanded[g._id] !== false;
          return (
            <div key={g._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded((prev) => ({ ...prev, [g._id]: !open }))}
              >
                <span className="font-semibold text-gray-800">{g.groupName}</span>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span>{g.players?.length ?? 0} players</span>
                  {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              {open && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {(g.players ?? []).map((p) => (
                    <div key={getPlayerId(p)} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="text-sm font-medium text-gray-700 flex-1">{p.name}</span>
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
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        Saving will delete all existing matches and regenerate them with the new arrangement.
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
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              >
                <div className="px-5 py-3 bg-teal-50 border-b border-teal-100 flex items-center gap-2">
                  <span className="font-semibold text-teal-800 text-sm">{g.groupName}</span>
                  <span className="text-xs text-teal-500">{g.players.length} players</span>
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
                      <p className="text-xs text-gray-400 px-5 py-5 text-center">Drop players here</p>
                    )}
                  </div>
                </SortableContext>
              </DroppableGroup>
            );
          })}
        </div>

        <DragOverlay>
          {activePlayer && (
            <div className="flex items-center gap-3 px-5 py-2.5 bg-white border border-teal-300 rounded-xl shadow-lg opacity-95">
              <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700 flex-1">{activePlayer.name}</span>
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
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {isSaving ? "Saving..." : "Save & Regenerate"}
        </button>
      </div>
    </div>
  );
};

const MatchesTab = ({ tournamentId, matchType }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetMatches(tournamentId);
  const matches = data?.data ?? [];

  if (isLoading) return <Spinner />;
  if (matches.length === 0)
    return <Empty text="No matches yet. Generate groups to create matches automatically." />;

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
      {Object.entries(byGroup).map(([groupName, groupMatches]) => (
        <div key={groupName}>
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">{groupName}</h3>
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
              const team2Name = m.player2PartnerId
                ? `${m.player2Id?.name ?? "—"} / ${m.player2PartnerId?.name ?? "—"}`
                : (m.player2Id?.name ?? "—");

              return (
                <div
                  key={m._id}
                  className="bg-white rounded-xl border border-gray-100 px-5 py-3 flex items-center gap-4 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => navigate(`/round-robin/match/${m._id}?tournament=${tournamentId}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-400 truncate mb-1">{m.matchName}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold px-2 py-0.5 rounded-lg ${
                        homeWon ? "bg-green-100 text-green-700" :
                        awayWon ? "text-red-400" :
                        "text-gray-800"
                      }`}>
                        {team1Name}
                      </span>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold flex-shrink-0">VS</span>
                      <span className={`text-sm font-semibold px-2 py-0.5 rounded-lg ${
                        awayWon ? "bg-green-100 text-green-700" :
                        homeWon ? "text-red-400" :
                        "text-gray-800"
                      }`}>
                        {team2Name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {m.sets?.length > 0 && (
                      <span className="text-xs text-gray-500 font-mono">
                        {m.sets.map((s) => `${s.home}-${s.away}`).join(", ")}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{m.court}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MATCH_STATUS_STYLES[m.status] ?? ""}`}>
                      {m.status}
                    </span>
                  </div>
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
const StandingsTab = ({ tournamentId }) => {
  const { data, isLoading } = useGetStandings(tournamentId);
  const groups = data?.data ?? [];

  if (isLoading) return <Spinner />;
  if (groups.length === 0)
    return <Empty text="Standings will appear after matches are played." />;

  const groupRows = groups.map((g) => {
    const players = g.standings ?? [];
    const sum = players.reduce(
      (acc, p) => ({
        wins:          acc.wins          + (p.wins          || 0),
        losses:        acc.losses        + (p.losses        || 0),
        matchesPlayed: acc.matchesPlayed + (p.matchesPlayed || 0),
        totalPoints:   acc.totalPoints   + (p.totalPoints   || 0),
        pointsFor:     acc.pointsFor     + (p.pointsFor     || 0),
        pointsAgainst: acc.pointsAgainst + (p.pointsAgainst || 0),
      }),
      { wins: 0, losses: 0, matchesPlayed: 0, totalPoints: 0, pointsFor: 0, pointsAgainst: 0 }
    );
    const divisor = players.length > 0 ? 2 : 1;
    return {
      _id:           g._id,
      groupName:     g.groupName,
      matchesPlayed: sum.matchesPlayed / divisor,
      wins:          sum.wins          / divisor,
      losses:        sum.losses        / divisor,
      totalPoints:   sum.totalPoints   / divisor,
      pointsDiff:    (sum.pointsFor - sum.pointsAgainst) / divisor,
    };
  }).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return b.pointsDiff - a.pointsDiff;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-left text-xs">
          <tr>
            <th className="px-5 py-2 font-semibold">#</th>
            <th className="px-5 py-2 font-semibold">Group</th>
            <th className="px-4 py-2 font-semibold text-center">P</th>
            <th className="px-4 py-2 font-semibold text-center">W</th>
            <th className="px-4 py-2 font-semibold text-center">L</th>
            <th className="px-4 py-2 font-semibold text-center">+/-</th>
            <th className="px-4 py-2 font-semibold text-center">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {groupRows.map((g, i) => (
            <tr key={g._id} className={i === 0 ? "bg-yellow-50" : "hover:bg-gray-50"}>
              <td className="px-5 py-2.5 font-bold text-gray-500">{i + 1}</td>
              <td className="px-5 py-2.5 font-medium text-gray-800">{g.groupName}</td>
              <td className="px-4 py-2.5 text-center text-gray-600">{g.matchesPlayed}</td>
              <td className="px-4 py-2.5 text-center text-green-600 font-semibold">{g.wins}</td>
              <td className="px-4 py-2.5 text-center text-red-400">{g.losses}</td>
              <td className={`px-4 py-2.5 text-center font-medium ${g.pointsDiff >= 0 ? "text-green-600" : "text-red-400"}`}>
                {g.pointsDiff >= 0 ? "+" : ""}{g.pointsDiff}
              </td>
              <td className="px-4 py-2.5 text-center font-bold text-teal-700">{g.totalPoints}</td>
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
        <div key={g._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-teal-50 border-b border-teal-100">
            <h3 className="font-semibold text-teal-800 text-sm">{g.groupName}</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left text-xs">
              <tr>
                <th className="px-5 py-2 font-semibold">#</th>
                <th className="px-5 py-2 font-semibold">Player</th>
                <th className="px-4 py-2 font-semibold text-center">P</th>
                <th className="px-4 py-2 font-semibold text-center">W</th>
                <th className="px-4 py-2 font-semibold text-center">L</th>
                <th className="px-4 py-2 font-semibold text-center">PF</th>
                <th className="px-4 py-2 font-semibold text-center">PA</th>
                <th className="px-4 py-2 font-semibold text-center">+/-</th>
                <th className="px-4 py-2 font-semibold text-center">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(g.standings ?? []).map((s, i) => (
                <tr key={s.playerId?._id ?? i} className={i === 0 ? "bg-yellow-50" : "hover:bg-gray-50"}>
                  <td className="px-5 py-2.5 font-bold text-gray-500">{i + 1}</td>
                  <td className="px-5 py-2.5 font-medium text-gray-800">{s.name ?? s.playerId?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{s.matchesPlayed}</td>
                  <td className="px-4 py-2.5 text-center text-green-600 font-semibold">{s.wins}</td>
                  <td className="px-4 py-2.5 text-center text-red-400">{s.losses}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{s.pointsFor}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{s.pointsAgainst}</td>
                  <td className={`px-4 py-2.5 text-center font-medium ${s.pointsDiff >= 0 ? "text-green-600" : "text-red-400"}`}>
                    {s.pointsDiff >= 0 ? "+" : ""}{s.pointsDiff}
                  </td>
                  <td className="px-4 py-2.5 text-center font-bold text-teal-700">{s.totalPoints}</td>
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
    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
  </div>
);

const Empty = ({ text }) => (
  <div className="text-center py-14 text-gray-400 text-sm">{text}</div>
);

// ── Main component ────────────────────────────────────────────────────────────
const TournamentDetail = () => {
  const navigate = useNavigate();
  const { id: tournamentId } = useParams();
  const [tab, setTab] = useState("matches");

  const { data: tData, isLoading: tLoading } = useGetRoundRobinTournament(tournamentId);
  const { mutate: generateGroups, isPending: isGenerating } = useGenerateGroups();
  const { mutate: finalize, isPending: isFinalizing } = useFinalizeRoundRobinTournament();

  const tournament = tData?.data;

  if (tLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
    </div>
  );

  if (!tournament) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Tournament not found.
    </div>
  );

  const canGenerate = ["Draft", "Active", "Scheduled"].includes(tournament.status);
  const canFinalize = tournament.status === "Scheduled";
  const isFinalized = ["Scheduled", "Ongoing", "Completed"].includes(tournament.status);

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
          <div>
            <h2 className="text-lg font-semibold text-teal-800 leading-tight">{tournament.tournamentName}</h2>
            <p className="text-xs text-gray-400">{tournament.matchType} · {tournament.numberOfGroups} groups · {tournament.numberOfCourts} courts</p>
            {(tournament.startDate || tournament.endDate) && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <CalendarDays className="w-3 h-3" />
                {tournament.startDate ? new Date(tournament.startDate).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                {tournament.endDate && <> → {new Date(tournament.endDate).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</>}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[tournament.status] ?? ""}`}>
            {tournament.status}
          </span>
          <Logout />
        </div>
      </div>

      <div className="px-[10px] py-6 w-full">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          {canGenerate && (
            <button
              onClick={() => generateGroups(tournamentId)}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {isGenerating ? "Generating..." : tournament.groups?.length > 0 ? "Regenerate Groups & Matches" : "Generate Groups & Matches"}
            </button>
          )}
          {canFinalize && (
            <button
              onClick={() => finalize(tournamentId)}
              disabled={isFinalizing}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {isFinalizing ? "Finalizing..." : "Finalize Tournament"}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === key
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "config"    && <ConfigTab    tournament={tournament} isFinalized={isFinalized} />}
        {tab === "players"   && <PlayersTab   tournamentId={tournamentId} />}
        {tab === "groups"    && <GroupsTab    tournamentId={tournamentId} />}
        {tab === "matches"   && <MatchesTab   tournamentId={tournamentId} matchType={tournament.matchType} />}
        {tab === "standings"       && <StandingsTab       tournamentId={tournamentId} />}
        {tab === "playerStandings" && <PlayerStandingsTab tournamentId={tournamentId} />}
      </div>
    </div>
  );
};

export default TournamentDetail;
