import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search, Pencil, Trash2, Users, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import Logout from "../../../../components/Logout.jsx";
import MemberForm from "../components/MemberForm.jsx";
import {
  useGetRoundRobinMembers,
  useDeleteRoundRobinMember,
  rrKeys,
} from "../services/roundRobin.queries.js";
import { deleteRoundRobinMemberAPI } from "../services/roundRobin.services.js";

const GRADE_COLORS = {
  A: "bg-green-100 text-green-700",
  B: "bg-blue-100 text-blue-700",
  C: "bg-purple-100 text-purple-700",
  D: "bg-sky-100 text-sky-700",
  E: "bg-pink-100 text-pink-700",
  Unrated: "bg-gray-100 text-gray-600",
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
        className={`flex items-center gap-1 hover:text-purple-900 transition-colors ${isActive ? "text-purple-900" : ""}`}
      >
        {label}
        <Icon className={`w-3.5 h-3.5 ${isActive ? "" : "text-gray-300"}`} />
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/round-robin/dashboard")}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-purple-800">Member Bank</h2>
        </div>
        <Logout />
      </div>

      <div className="px-[10px] py-6 w-full">
        {/* Title + Add button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-purple-800">Members</h1>
            <p className="text-sm text-gray-500 mt-1">
              {members.length} member{members.length !== 1 ? "s" : ""} in the global bank
            </p>
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, grade, or member ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>

        {/* Bulk action bar */}
        {someSelected && (
          <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5 mb-4">
            <span className="text-sm font-medium text-purple-700">
              {selected.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={clearSelection}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
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
          <div className="text-center py-16 text-gray-400">Loading members...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">
              {members.length === 0 ? "No members yet. Add your first player." : "No members match your search."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-purple-50 text-purple-700 text-left">
                <tr>
                  <th className="px-3 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap hidden md:table-cell">Nat. ID</th>
                  <SortHeader label="Name" sortKey="name" sort={sort} onSort={handleSort} />
                  <SortHeader label="Grade" sortKey="grade" sort={sort} onSort={handleSort} />
                  <SortHeader label="Gender" sortKey="gender" sort={sort} onSort={handleSort} className="hidden sm:table-cell" />
                  <SortHeader label="Date of Birth" sortKey="dateOfBirth" sort={sort} onSort={handleSort} className="whitespace-nowrap hidden lg:table-cell" />
                  <SortHeader label="Email" sortKey="email" sort={sort} onSort={handleSort} className="hidden sm:table-cell" />
                  <th className="px-3 py-3 font-semibold hidden lg:table-cell">Contact</th>
                  <th className="px-3 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((member) => {
                  const isSelected = selected.has(member._id);
                  return (
                    <tr
                      key={member._id}
                      onClick={() => toggleOne(member._id)}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-purple-50" : "hover:bg-gray-50"}`}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(member._id)}
                          className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-3 text-gray-400 text-xs font-mono hidden md:table-cell">
                        {member.nationalMemberId || "—"}
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-800">{member.name}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${GRADE_COLORS[member.grade] ?? GRADE_COLORS.Unrated}`}>
                          {member.grade}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-500 text-xs hidden sm:table-cell">{member.gender || "—"}</td>
                      <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap hidden lg:table-cell">{formatDob(member.dateOfBirth)}</td>
                      <td className="px-3 py-3 text-gray-500 hidden sm:table-cell">{member.email}</td>
                      <td className="px-3 py-3 text-gray-500 hidden lg:table-cell">{member.contact || "—"}</td>
                      <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(member)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(member._id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Remove Member?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This member will be marked inactive. They will no longer appear in the member bank.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
              >
                {isDeleting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm Modal */}
      {confirmBulk && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Remove {selected.size} Member{selected.size !== 1 ? "s" : ""}?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              These members will be marked inactive and removed from the member bank.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmBulk(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600"
              >
                Remove All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
