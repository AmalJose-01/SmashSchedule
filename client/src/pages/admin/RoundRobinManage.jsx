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

const IMPORT_FIELDS = [
    { key: "name", label: "Full Name", required: true },
    { key: "grade", label: "Grade", required: true },
    { key: "email", label: "Email", required: true },
    { key: "contact", label: "Contact / Phone", required: false },
    { key: "isMember", label: "Is Member", required: false },
];

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

    const [isImporting, setIsImporting] = useState(false);

    // Import modal state
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importStep, setImportStep] = useState(1); // 1: upload, 2: map fields
    const [importFile, setImportFile] = useState(null);
    const [importHeaders, setImportHeaders] = useState([]);
    const [importRows, setImportRows] = useState([]);
    const [fieldMapping, setFieldMapping] = useState({ name: "", grade: "", email: "", contact: "", isMember: "" });
    const importFileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

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

    // IMPORT MODAL LOGIC
    const openImportModal = () => {
        setImportStep(1);
        setImportFile(null);
        setImportHeaders([]);
        setImportRows([]);
        setFieldMapping({ name: "", grade: "", email: "", contact: "", isMember: "" });
        setIsImportModalOpen(true);
    };

    const closeImportModal = () => {
        setIsImportModalOpen(false);
        if (importFileInputRef.current) importFileInputRef.current.value = "";
    };

    const autoMapHeaders = (headers) => {
        const mapping = { name: "", grade: "", email: "", contact: "", isMember: "" };
        headers.forEach(h => {
            const lower = h.toLowerCase();
            if (!mapping.name && (lower.includes("name") || lower.includes("player"))) mapping.name = h;
            else if (!mapping.grade && lower.includes("grade")) mapping.grade = h;
            else if (!mapping.email && lower.includes("email")) mapping.email = h;
            else if (!mapping.contact && (lower.includes("contact") || lower.includes("phone") || lower.includes("mobile"))) mapping.contact = h;
            else if (!mapping.isMember && (lower.includes("member") || lower.includes("status"))) mapping.isMember = h;
        });
        return mapping;
    };

    const handleImportFileSelect = async (file) => {
        if (!file) return;
        const ext = file.name.split(".").pop().toLowerCase();
        if (!["csv", "xls", "xlsx"].includes(ext)) {
            toast.error("Invalid file format. Use CSV or Excel.");
            return;
        }
        try {
            let rows = [];
            if (ext === "csv") rows = await readCsvFile(file);
            else rows = await readExcelFile(file);

            if (!rows.length) { toast.warning("File is empty."); return; }

            const headers = Object.keys(rows[0]);
            setImportFile(file);
            setImportHeaders(headers);
            setImportRows(rows);
            setFieldMapping(autoMapHeaders(headers));
            setImportStep(2);
        } catch (err) {
            toast.error("Error reading file");
        }
    };

    const handleImportFileInputChange = (e) => handleImportFileSelect(e.target.files[0]);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleImportFileSelect(e.dataTransfer.files[0]);
    };

    const handleConfirmImport = () => {
        if (!fieldMapping.name || !fieldMapping.email) {
            toast.error("Name and Email fields are required.");
            return;
        }

        const mappedMembers = importRows.map(row => ({
            name: fieldMapping.name ? String(row[fieldMapping.name] || "") : "",
            grade: fieldMapping.grade ? String(row[fieldMapping.grade] || "") : "",
            email: fieldMapping.email ? String(row[fieldMapping.email] || "") : "",
            contact: fieldMapping.contact ? String(row[fieldMapping.contact] || "") : "",
            isMember: fieldMapping.isMember
                ? (String(row[fieldMapping.isMember]).toLowerCase() === "true" || String(row[fieldMapping.isMember]).toLowerCase() === "yes")
                : true,
        })).filter(m => m.name && m.email);

        if (!mappedMembers.length) {
            toast.warning("No valid records found after mapping.");
            return;
        }

        setIsImporting(true);
        importMutation.mutate({ members: mappedMembers }, {
            onSuccess: (data) => {
                setIsImporting(false);
                closeImportModal();
                if (data.results?.errors?.length > 0) {
                    toast.warning(`Imported ${data.results.successCount} members. ${data.results.errors.length} failed.`);
                } else {
                    toast.success(`Successfully imported ${data.results?.successCount || 0} members!`);
                }
            },
            onError: (error) => {
                setIsImporting(false);
                toast.error(error.response?.data?.message || "Import failed");
            }
        });
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
                        <button
                            onClick={openImportModal}
                            className={`bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <Upload className="w-5 h-5" />
                            {isImporting ? "Importing..." : "Import Players"}
                        </button>
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
                                <select
                                    required
                                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={formData.grade}
                                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                >
                                    <option value="">Select grade...</option>
                                    {["A", "B", "C", "D", "E"].map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
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

            {/* Import Data Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                        {/* Header */}
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-green-600" />
                                    Import Players
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Step {importStep} of 2 — {importStep === 1 ? "Upload File" : "Map Fields"}
                                </p>
                            </div>
                            <button onClick={closeImportModal} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Step 1: Upload */}
                            {importStep === 1 && (
                                <div>
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={handleDrop}
                                        onClick={() => importFileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${isDragging ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-green-400 hover:bg-gray-50"}`}
                                    >
                                        <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                                        <p className="font-medium text-gray-700">Drag & drop your file here</p>
                                        <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                                        <div className="flex justify-center gap-3 mt-4">
                                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">.CSV</span>
                                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">.XLS</span>
                                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">.XLSX</span>
                                        </div>
                                        <input
                                            ref={importFileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept=".csv,.xls,.xlsx"
                                            onChange={handleImportFileInputChange}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3 text-center">
                                        Your file should have column headers in the first row. You'll map them to the correct fields in the next step.
                                    </p>
                                </div>
                            )}

                            {/* Step 2: Map Fields */}
                            {importStep === 2 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                        <span className="text-sm text-green-700">
                                            <span className="font-medium">{importFile?.name}</span> — {importRows.length} rows detected
                                        </span>
                                        <button onClick={() => setImportStep(1)} className="ml-auto text-xs text-gray-500 underline hover:text-gray-700">Change file</button>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-4">Match each field to the correct column from your file. Required fields are marked with <span className="text-red-500">*</span>.</p>

                                    <div className="space-y-3">
                                        {IMPORT_FIELDS.map(field => (
                                            <div key={field.key} className="flex items-center gap-3">
                                                <div className="w-40 shrink-0">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {field.label}
                                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                                    </span>
                                                </div>
                                                <select
                                                    className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                                                    value={fieldMapping[field.key]}
                                                    onChange={(e) => setFieldMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                >
                                                    <option value="">— Not mapped —</option>
                                                    {importHeaders.map(h => (
                                                        <option key={h} value={h}>{h}</option>
                                                    ))}
                                                </select>
                                                {/* Preview first row value */}
                                                {fieldMapping[field.key] && importRows[0] && (
                                                    <span className="text-xs text-gray-400 w-32 truncate shrink-0" title={String(importRows[0][fieldMapping[field.key]] || "")}>
                                                        e.g. {String(importRows[0][fieldMapping[field.key]] || "—")}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Preview table */}
                                    {fieldMapping.name && fieldMapping.email && (
                                        <div className="mt-5">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview (first 3 rows)</p>
                                            <div className="overflow-x-auto border rounded-lg">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-gray-50 border-b">
                                                        <tr>
                                                            {IMPORT_FIELDS.filter(f => fieldMapping[f.key]).map(f => (
                                                                <th key={f.key} className="px-3 py-2 font-medium text-gray-600">{f.label}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {importRows.slice(0, 3).map((row, i) => (
                                                            <tr key={i}>
                                                                {IMPORT_FIELDS.filter(f => fieldMapping[f.key]).map(f => (
                                                                    <td key={f.key} className="px-3 py-2 text-gray-700 max-w-[120px] truncate">
                                                                        {String(row[fieldMapping[f.key]] ?? "—")}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                            <button onClick={closeImportModal} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 transition text-sm">
                                Cancel
                            </button>
                            {importStep === 2 && (
                                <button
                                    onClick={handleConfirmImport}
                                    disabled={isImporting || !fieldMapping.name || !fieldMapping.email}
                                    className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    {isImporting ? "Importing..." : `Import ${importRows.length} Records`}
                                </button>
                            )}
                        </div>
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
