import React, { useState, useRef } from "react";
import {
    useGetMembers,
    useCreateMember,
    useUpdateMember,
    useDeleteMember,
    useBulkImportMembers
} from "../../hooks/roundRobin/useRoundRobin";
import { Plus, Edit, Trash2, Search, X, User, Upload, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/AlertView";
import { readExcelFile, readCsvFile } from "../../../utils/fileReaders";
import { toast } from "sonner";

const RoundRobinManage = () => {
    const navigate = useNavigate();
    const { data: members, isLoading } = useGetMembers();
    const createMutation = useCreateMember();
    const updateMutation = useUpdateMember();
    const deleteMutation = useDeleteMember();
    const importMutation = useBulkImportMembers();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        grade: "",
        email: "",
        contact: "",
        isMember: true
    });

    const [deleteConfig, setDeleteConfig] = useState({
        open: false,
        id: null
    });

    const fileInputRef = useRef(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleEdit = (member) => {
        setEditingMember(member);
        setFormData({
            name: member.name,
            grade: member.grade || "",
            email: member.email,
            contact: member.contact || "",
            isMember: member.isMember !== undefined ? member.isMember : true
        });
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingMember(null);
        setFormData({
            name: "",
            grade: "",
            email: "",
            contact: "",
            isMember: true
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMember(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingMember) {
            updateMutation.mutate({ id: editingMember._id, ...formData }, {
                onSuccess: handleCloseModal
            });
        } else {
            createMutation.mutate(formData, {
                onSuccess: handleCloseModal
            });
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteConfig({ open: true, id });
    };

    const confirmDelete = () => {
        if (deleteConfig.id) {
            deleteMutation.mutate(deleteConfig.id);
            setDeleteConfig({ open: false, id: null });
        }
    };

    // IMPORT LOGIC
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const ext = file.name.split(".").pop().toLowerCase();
            let rows = [];

            if (ext === "csv") {
                rows = await readCsvFile(file);
            } else if (["xls", "xlsx"].includes(ext)) {
                rows = await readExcelFile(file);
            } else {
                toast.error("Invalid file format. Use CSV or Excel.");
                setIsImporting(false);
                return;
            }

            // Map rows to expected format
            // Assumes headers: Full Name, Grade, Email, Member (optional)
            // Or maps approximate keys

            const mappedMembers = rows.map(row => {
                // Try to find keys case-insensitively
                const keys = Object.keys(row);
                const getName = (k) => keys.find(key => key.toLowerCase().includes(k));

                const nameKey = getName("name");
                const gradeKey = getName("grade");
                const emailKey = getName("email");
                const contactKey = getName("contact") || getName("phone") || getName("mobile");
                const memberKey = getName("member");

                return {
                    name: row[nameKey] || row["Full Name"] || "",
                    grade: row[gradeKey] || "",
                    email: row[emailKey] || "",
                    contact: row[contactKey] || "",
                    isMember: row[memberKey] ? String(row[memberKey]).toLowerCase() === 'true' || String(row[memberKey]).toLowerCase() === 'yes' : true
                };
            }).filter(m => m.name && m.email); // Filter invalid

            if (mappedMembers.length === 0) {
                toast.warning("No valid records found in file.");
                setIsImporting(false);
                return;
            }

            importMutation.mutate({ members: mappedMembers }, {
                onSuccess: (data) => {
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    setIsImporting(false);
                    if (data.results && data.results.errors.length > 0) {
                        toast.warning(`Imported ${data.results.successCount} members. ${data.results.errors.length} failed.`);
                        console.warn("Import errors:", data.results.errors);
                    } else {
                        toast.success(`Successfully imported ${data.results?.successCount || 0} members!`);
                    }
                },
                onError: (error) => {
                    setIsImporting(false);
                    toast.error(error.response?.data?.message || "Import failed");
                }
            });

        } catch (err) {
            console.error(err);
            toast.error("Error reading file");
            setIsImporting(false);
        }
    };

    const filteredMembers = members?.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-8 h-8 text-blue-600" />
                        Round Robin Members
                    </h1>
                    <div className="flex gap-2">
                        <label className={`cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                            <Upload className="w-5 h-5" />
                            {isImporting ? "Importing..." : "Import Players"}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv, .xls, .xlsx"
                                onChange={handleFileUpload}
                            />
                        </label>
                        <button
                            onClick={handleAdd}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                        >
                            <Plus className="w-5 h-5" /> Add Member
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search members..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 border-b">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Name</th>
                                <th className="p-4 font-semibold text-gray-600">Grade</th>
                                <th className="p-4 font-semibold text-gray-600">Email</th>
                                <th className="p-4 font-semibold text-gray-600">Contact</th>
                                <th className="p-4 font-semibold text-gray-600">Member</th>
                                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : filteredMembers?.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">No members found.</td>
                                </tr>
                            ) : (
                                filteredMembers?.map((member) => (
                                    <tr key={member._id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 font-medium text-gray-800">{member.name}</td>
                                        <td className="p-4 text-gray-600"><span className="px-2 py-1 bg-gray-100 rounded text-sm">{member.grade}</span></td>
                                        <td className="p-4 text-gray-600">{member.email}</td>
                                        <td className="p-4 text-gray-600">{member.contact}</td>
                                        <td className="p-4 text-gray-600">
                                            {member.isMember ? (
                                                <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> Yes</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-500"><XCircle className="w-4 h-4" /> No</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(member)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(member._id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">
                                {editingMember ? "Edit Member" : "Add New Member"}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. A, B, Elite"
                                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.grade}
                                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.contact}
                                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isMember"
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    checked={formData.isMember}
                                    onChange={(e) => setFormData({ ...formData, isMember: e.target.checked })}
                                />
                                <label htmlFor="isMember" className="text-gray-700 font-medium select-none">Current Member</label>
                            </div>

                            <button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {editingMember ? "Update Member" : "Create Member"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteConfig.open}
                title="Delete Member"
                message="Are you sure you want to delete this member? This cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfig({ open: false, id: null })}
                danger
            />
        </div>
    );
};

export default RoundRobinManage;
