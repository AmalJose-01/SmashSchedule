import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import Logout from "../../../../components/Logout.jsx";
import MemberForm from "../components/MemberForm.jsx";
import {
  useGetRoundRobinMembers,
  useDeleteRoundRobinMember,
} from "../services/roundRobin.queries.js";

const GRADE_COLORS = {
  A: "bg-red-100 text-red-700",
  B: "bg-orange-100 text-orange-700",
  C: "bg-yellow-100 text-yellow-700",
  D: "bg-green-100 text-green-700",
  E: "bg-blue-100 text-blue-700",
  Unrated: "bg-gray-100 text-gray-600",
};

const formatDob = (dob) => {
  if (!dob) return "—";
  return new Date(dob).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
};

const MemberManagement = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

      <div className="p-6 max-w-5xl mx-auto">
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
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, grade, or member ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>

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
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-purple-50 text-purple-700 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Nat. ID</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Grade</th>
                  <th className="px-4 py-3 font-semibold">Gender</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Date of Birth</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                      {member.nationalMemberId || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{member.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${GRADE_COLORS[member.grade] ?? GRADE_COLORS.Unrated}`}>
                        {member.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{member.gender || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDob(member.dateOfBirth)}</td>
                    <td className="px-4 py-3 text-gray-500">{member.email}</td>
                    <td className="px-4 py-3 text-gray-500">{member.contact || "—"}</td>
                    <td className="px-4 py-3 text-right">
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {formOpen && (
        <MemberForm member={editingMember} onClose={handleFormClose} />
      )}

      {/* Delete Confirm Modal */}
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
    </div>
  );
};

export default MemberManagement;
