import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Users, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import MemberForm from "../components/MemberForm.jsx";
import {
  useGetRoundRobinMembers,
  useDeleteRoundRobinMember,
  rrKeys,
} from "../services/roundRobin.queries.js";
import { deleteRoundRobinMemberAPI } from "../services/roundRobin.services.js";
import AppBackground from "../../../../components/AppBackground.jsx";
import PageHeader from "../../../../components/PageHeader.jsx";

const GRADE_COLORS = {
  A: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  B: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
  C: "bg-purple-500/15 text-purple-300 border border-purple-500/30",
  D: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
  E: "bg-pink-500/15 text-pink-300 border border-pink-500/30",
  Unrated: "bg-slate-500/15 text-slate-300 border border-slate-500/30",
};

const formatDob = (dob) => {
  if (!dob) return "—";
  return new Date(dob).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
};

const GRADE_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H", "Unrated"];

// ── Sorting helpers ─────────────────────────────────────────────────────────
const SORTABLE_COLUMNS = {
  name: { compare: (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) },
  grade: { compare: (a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade) },
  points: { compare: (a, b) => (a.points ?? 0) - (b.points ?? 0) },
  isMember: { compare: (a, b) => Number(b.isMember) - Number(a.isMember) },
  gender: { compare: (a, b) => (a.gender || "").localeCompare(b.gender || "", undefined, { sensitivity: "base" }) },
  dateOfBirth: { compare: (a, b) => new Date(a.dateOfBirth || 0) - new Date(b.dateOfBirth || 0) },
  email: { compare: (a, b) => a.email.localeCompare(b.email, undefined, { sensitivity: "base" }) },
};

const SortHeader = ({ label, sortKey, sort, onSort, className = "" }) => {
  const isActive = sort.key === sortKey;
  const Icon = isActive ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className={`px-3 py-3 font-semibold ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 hover:text-white transition-colors ${isActive ? "text-cyan-300" : ""}`}
      >
        {label}
        <Icon className={`w-3.5 h-3.5 ${isActive ? "" : "text-slate-600"}`} />
      </button>
    </th>
  );
};

const MemberManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const { data, isLoading } = useGetRoundRobinMembers();
  const { mutate: deleteMember, isPending: isDeleting } = useDeleteRoundRobinMember();

  const members = data?.data ?? [];
  const q = search.toLowerCase();
  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.grade.toLowerCase().includes(q) ||
      (m.nationalMemberId ?? "").toLowerCase().includes(q)
  );

  const sorted = [...filtered].sort((a, b) => {
    const { compare } = SORTABLE_COLUMNS[sort.key] ?? SORTABLE_COLUMNS.name;
    const result = compare(a, b);
    return sort.dir === "asc" ? result : -result;
  });

  const handleSort = (key) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((m) => selected.has(m._id));
  const someSelected = selected.size > 0;

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allFilteredSelected) {
      // Deselect all currently visible
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((m) => next.delete(m._id));
        return next;
      });
    } else {
      // Select all currently visible
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((m) => next.add(m._id));
        return next;
      });
    }
  };

  const clearSelection = () => setSelected(new Set());

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormOpen(true);
  };

  const handleDeleteClick = (id) => setDeletingId(id);

  const handleDeleteConfirm = () => {
    deleteMember(deletingId, { onSettled: () => setDeletingId(null) });
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingMember(null);
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    setConfirmBulk(false);
    const ids = [...selected];
    try {
      await Promise.all(ids.map((id) => deleteRoundRobinMemberAPI(id)));
      toast.success(`${ids.length} member${ids.length !== 1 ? "s" : ""} removed`);
      clearSelection();
      queryClient.invalidateQueries({ queryKey: rrKeys.members });
    } catch {
      toast.error("Some members could not be removed");
      queryClient.invalidateQueries({ queryKey: rrKeys.members });
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <AppBackground>
      <PageHeader
        title="Member Bank"
        subtitle="Your global player list"
        onBack={() => navigate("/round-robin/dashboard")}
      />

      <div className="px-[10px] py-6 w-full">
        {/* Title + Add button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Members</h1>
            <p className="text-sm text-white/70 mt-1">
              {members.length} member{members.length !== 1 ? "s" : ""} in the global bank
            </p>
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm hover:scale-[1.02] bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, grade, or member ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/50 backdrop-blur-xl border border-slate-600 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Bulk action bar */}
        {someSelected && (
          <div className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-xl rounded-xl px-4 py-2.5 mb-4">
            <span className="text-sm font-medium text-cyan-300">
              {selected.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={clearSelection}
                className="text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                Deselect all
              </button>
              <button
                onClick={() => setConfirmBulk(true)}
                disabled={bulkDeleting}
                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {bulkDeleting ? "Removing..." : `Delete ${selected.size}`}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-16 text-white/60">Loading members...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
            <p className="text-white/60 font-medium">
              {members.length === 0 ? "No members yet. Add your first player." : "No members match your search."}
            </p>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-slate-900/60 text-slate-400 text-left text-xs uppercase tracking-wider border-b border-slate-700/50">
                <tr>
                  <th className="px-3 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap hidden md:table-cell">Nat. ID</th>
                  <SortHeader label="Name" sortKey="name" sort={sort} onSort={handleSort} />
                  <SortHeader label="Grade" sortKey="grade" sort={sort} onSort={handleSort} />
                  <SortHeader label="Points" sortKey="points" sort={sort} onSort={handleSort} className="whitespace-nowrap" />
                  <SortHeader label="Membership" sortKey="isMember" sort={sort} onSort={handleSort} className="whitespace-nowrap hidden sm:table-cell" />
                  <SortHeader label="Gender" sortKey="gender" sort={sort} onSort={handleSort} className="hidden sm:table-cell" />
                  <SortHeader label="Date of Birth" sortKey="dateOfBirth" sort={sort} onSort={handleSort} className="whitespace-nowrap hidden lg:table-cell" />
                  <SortHeader label="Email" sortKey="email" sort={sort} onSort={handleSort} className="hidden sm:table-cell" />
                  <th className="px-3 py-3 font-semibold hidden lg:table-cell">Contact</th>
                  <th className="px-3 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {sorted.map((member) => {
                  const isSelected = selected.has(member._id);
                  return (
                    <tr
                      key={member._id}
                      onClick={() => toggleOne(member._id)}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-cyan-500/10" : "hover:bg-white/5"}`}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(member._id)}
                          className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-3 text-slate-500 text-xs font-mono hidden md:table-cell">
                        {member.nationalMemberId || "—"}
                      </td>
                      <td className="px-3 py-3 font-medium text-white">{member.name}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${GRADE_COLORS[member.grade] ?? GRADE_COLORS.Unrated}`}>
                          {member.grade}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-cyan-300 font-semibold">{member.points ?? 0}</td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${member.isMember ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-slate-500/15 text-slate-400 border border-slate-500/30"}`}>
                          {member.isMember ? "Member" : "Non-Member"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-400 text-xs hidden sm:table-cell">{member.gender || "—"}</td>
                      <td className="px-3 py-3 text-slate-400 text-xs whitespace-nowrap hidden lg:table-cell">{formatDob(member.dateOfBirth)}</td>
                      <td className="px-3 py-3 text-slate-300 hidden sm:table-cell">{member.email}</td>
                      <td className="px-3 py-3 text-slate-300 hidden lg:table-cell">{member.contact || "—"}</td>
                      <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(member)}
                            className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-500/15 hover:text-cyan-300 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(member._id)}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {formOpen && (
        <MemberForm member={editingMember} onClose={handleFormClose} />
      )}

      {/* Single Delete Confirm Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-2">Remove Member?</h3>
            <p className="text-sm text-slate-400 mb-6">
              This member will be marked inactive. They will no longer appear in the member bank.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-600 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 shadow-lg shadow-red-500/30 disabled:opacity-60"
              >
                {isDeleting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm Modal */}
      {confirmBulk && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-2">
              Remove {selected.size} Member{selected.size !== 1 ? "s" : ""}?
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              These members will be marked inactive and removed from the member bank.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmBulk(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-600 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 shadow-lg shadow-red-500/30"
              >
                Remove All
              </button>
            </div>
          </div>
        </div>
      )}
    </AppBackground>
  );
};

export default MemberManagement;
