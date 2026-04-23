import React, { useState, useRef } from "react";
import { X, Upload, UserPlus, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { readString } from "react-papaparse";
import * as XLSX from "xlsx";
import {
  useCreateRoundRobinMember,
  useUpdateRoundRobinMember,
  useBulkImportRoundRobinMembers,
} from "../services/roundRobin.queries.js";

const GRADES = ["A", "B", "C", "D", "E", "Unrated"];

const EMPTY_FORM = {
  name: "", grade: "Unrated", email: "", contact: "",
  nationalMemberId: "", dateOfBirth: "", gender: "",
};

// ── System field definitions & alias detection ────────────────────────────────
const SYSTEM_FIELDS = [
  { key: "name",             label: "Name",               required: true  },
  { key: "email",            label: "Email",              required: true  },
  { key: "contact",          label: "Contact / Phone",    required: false },
  { key: "grade",            label: "Grade",              required: false },
  { key: "nationalMemberId", label: "National Member ID", required: false },
  { key: "dateOfBirth",      label: "Date of Birth",      required: false },
  { key: "gender",           label: "Gender",             required: false },
];

const ALIASES = {
  "national member id":  "nationalMemberId",
  "member id":           "nationalMemberId",
  "memberid":            "nationalMemberId",
  "name":                "name",
  "full name":           "name",
  "player name":         "name",
  "date of birth":       "dateOfBirth",
  "dob":                 "dateOfBirth",
  "birth date":          "dateOfBirth",
  "gender identity":     "gender",
  "gender":              "gender",
  "sex":                 "gender",
  "mobile phone":        "contact",
  "mobile":              "contact",
  "phone":               "contact",
  "contact":             "contact",
  "phone number":        "contact",
  "email address":       "email",
  "email":               "email",
  "grade":               "grade",
  "level":               "grade",
  "skill level":         "grade",
};

const autoMap = (headers) =>
  Object.fromEntries(
    headers.map((h) => [h, ALIASES[h.toLowerCase().trim()] ?? "skip"])
  );

// ── File parser — CSV/TXT via papaparse, Excel via xlsx ───────────────────────
const parseFile = (file) =>
  new Promise((resolve, reject) => {
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
          resolve({ headers: rows.length ? Object.keys(rows[0]) : [], rows });
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = readString(e.target.result, { header: true, skipEmptyLines: true });
        resolve({ headers: result.meta?.fields ?? [], rows: result.data });
      };
      reader.onerror = reject;
      reader.readAsText(file);
    }
  });

const applyMapping = (rawRows, fieldMap) =>
  rawRows.map((row) => {
    const mapped = {};
    for (const [csvCol, sysKey] of Object.entries(fieldMap)) {
      if (sysKey !== "skip") mapped[sysKey] = String(row[csvCol] ?? "").trim();
    }
    return mapped;
  });

// ── Manual Entry Tab ──────────────────────────────────────────────────────────
const ManualTab = ({ member, onClose }) => {
  const [form, setForm] = useState(
    member
      ? {
          name: member.name ?? "",
          grade: member.grade ?? "Unrated",
          email: member.email ?? "",
          contact: member.contact ?? "",
          nationalMemberId: member.nationalMemberId ?? "",
          dateOfBirth: member.dateOfBirth ? member.dateOfBirth.slice(0, 10) : "",
          gender: member.gender ?? "",
        }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState({});

  const { mutate: createMember, isPending: isCreating } = useCreateRoundRobinMember();
  const { mutate: updateMember, isPending: isUpdating } = useUpdateRoundRobinMember();
  const isPending = isCreating || isUpdating;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      name: form.name,
      grade: form.grade,
      contact: form.contact,
      nationalMemberId: form.nationalMemberId || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender || undefined,
    };
    if (member) {
      updateMember({ memberId: member._id, data: payload }, { onSuccess: onClose });
    } else {
      createMember({ ...payload, email: form.email }, { onSuccess: onClose });
    }
  };

  const inputCls = (field) =>
    `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 ${
      errors[field] ? "border-red-400" : "border-gray-200"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Name */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={handleChange("name")}
            placeholder="Player name"
            className={inputCls("name")}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            placeholder="player@email.com"
            disabled={!!member}
            className={`${inputCls("email")} ${member ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          {member && <p className="text-gray-400 text-xs mt-1">Email cannot be changed</p>}
        </div>

        {/* Grade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
          <select
            value={form.grade}
            onChange={handleChange("grade")}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
          >
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <input
            type="text"
            value={form.gender}
            onChange={handleChange("gender")}
            placeholder="e.g. Male, Female"
            className={inputCls("gender")}
          />
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
          <input
            type="text"
            value={form.contact}
            onChange={handleChange("contact")}
            placeholder="Phone number"
            className={inputCls("contact")}
          />
        </div>

        {/* DOB */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={handleChange("dateOfBirth")}
            className={inputCls("dateOfBirth")}
          />
        </div>

        {/* National Member ID */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">National Member ID</label>
          <input
            type="text"
            value={form.nationalMemberId}
            onChange={handleChange("nationalMemberId")}
            placeholder="e.g. 60038"
            className={inputCls("nationalMemberId")}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-purple-700 disabled:opacity-60 transition-colors mt-2"
      >
        {isPending
          ? member ? "Saving..." : "Adding..."
          : member ? "Save Changes" : "Add Member"}
      </button>
    </form>
  );
};

// ── Bulk Import Tab (3-step: upload → mapping → preview) ─────────────────────
const BulkImportTab = () => {
  const [step, setStep] = useState("upload");
  const [csvText, setCsvText] = useState("");
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [fieldMap, setFieldMap] = useState({});
  const [preview, setPreview] = useState([]);
  const [parseError, setParseError] = useState("");
  const [mapError, setMapError] = useState("");
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);

  const { mutate: bulkImport, isPending } = useBulkImportRoundRobinMembers();

  const reset = () => {
    setStep("upload");
    setCsvText("");
    setRawHeaders([]);
    setRawRows([]);
    setFieldMap({});
    setPreview([]);
    setParseError("");
    setMapError("");
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const processRows = (headers, rows) => {
    if (!headers.length || !rows.length) {
      setParseError("No data found. Check the file has a header row and at least one data row.");
      return;
    }
    setRawHeaders(headers);
    setRawRows(rows);
    setFieldMap(autoMap(headers));
    setParseError("");
    setStep("mapping");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setCsvText("");
    setParseError("");
    try {
      const { headers, rows } = await parseFile(file);
      processRows(headers, rows);
    } catch {
      setParseError("Could not parse the file. Please check the format and try again.");
    }
  };

  const handlePastePreview = () => {
    if (!csvText.trim()) { setParseError("Paste your CSV data first."); return; }
    const result = readString(csvText, { header: true, skipEmptyLines: true });
    processRows(result.meta?.fields ?? [], result.data);
  };

  const handleProceedToPreview = () => {
    setMapError("");
    const mapped = Object.values(fieldMap);
    if (!mapped.includes("name") || !mapped.includes("email")) {
      setMapError("You must map a 'Name' and 'Email' column to proceed.");
      return;
    }
    setPreview(applyMapping(rawRows, fieldMap));
    setStep("preview");
  };

  const handleImport = () => {
    if (!preview.length) return;
    const members = preview.map((r) => ({
      name: r.name,
      email: r.email,
      grade: r.grade || "Unrated",
      contact: r.contact || "",
      nationalMemberId: r.nationalMemberId || undefined,
      dateOfBirth: r.dateOfBirth || undefined,
      gender: r.gender || undefined,
    }));
    bulkImport(members, {
      onSuccess: (data) => {
        setImportResult(data.data);
        setStep("upload");
        setPreview([]);
        setCsvText("");
        setRawHeaders([]);
        setRawRows([]);
        setFieldMap({});
      },
    });
  };

  // ── Step 1: Upload / Paste ─────────────────────────────────────────────────
  if (step === "upload") {
    return (
      <div className="space-y-4">
        {importResult && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-sm mb-1">
              <CheckCircle2 className="w-4 h-4" />
              Import complete
            </div>
            <p className="text-xs text-green-600">
              {importResult.success} added · {importResult.failed} skipped
            </p>
            {importResult.errors?.length > 0 && (
              <ul className="mt-2 space-y-0.5 max-h-24 overflow-y-auto">
                {importResult.errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-500">{e.email}: {e.reason}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-3 border border-dashed border-gray-300">
          <p className="text-xs text-gray-500 font-medium mb-1">Accepted formats</p>
          <p className="text-xs text-gray-500">.csv · .txt · .xlsx · .xls</p>
          <p className="text-xs text-gray-400 mt-1">
            Required columns: <span className="font-medium">Name</span>, <span className="font-medium">Email</span> — all others are mapped in the next step
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-sm text-purple-600 font-medium hover:text-purple-700">
          <Upload className="w-4 h-4" />
          Upload CSV or Excel file
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>

        <p className="text-xs text-gray-400 text-center">— or paste CSV text below —</p>

        <textarea
          value={csvText}
          onChange={(e) => { setCsvText(e.target.value); setParseError(""); setImportResult(null); }}
          placeholder="Paste CSV data here..."
          rows={5}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono resize-none"
        />

        {parseError && (
          <div className="flex items-center gap-2 text-red-500 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {parseError}
          </div>
        )}

        {csvText.trim() && (
          <button
            type="button"
            onClick={handlePastePreview}
            className="w-full border border-purple-400 text-purple-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
          >
            Parse & Map Fields <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // ── Step 2: Field Mapping ──────────────────────────────────────────────────
  if (step === "mapping") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-purple-700">{rawRows.length}</span> rows found.
          Map each CSV column to a system field.
        </p>

        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
            <span>CSV Column</span>
            <span>Maps to</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
            {rawHeaders.map((h) => (
              <div key={h} className="grid grid-cols-2 items-center px-4 py-2.5 gap-2">
                <span className="text-sm font-mono text-gray-600 truncate">{h}</span>
                <select
                  value={fieldMap[h] ?? "skip"}
                  onChange={(e) =>
                    setFieldMap((prev) => ({ ...prev, [h]: e.target.value }))
                  }
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="skip">— Skip —</option>
                  {SYSTEM_FIELDS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}{f.required ? " *" : ""}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {mapError && (
          <div className="flex items-center gap-2 text-red-500 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {mapError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl px-3 py-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            type="button"
            onClick={handleProceedToPreview}
            className="flex-1 bg-purple-600 text-white py-2 rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            Preview <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Preview & Import ───────────────────────────────────────────────
  const previewCols = SYSTEM_FIELDS.filter((f) =>
    Object.values(fieldMap).includes(f.key)
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-purple-700">{preview.length}</span> members ready to import
      </p>

      <div className="overflow-auto max-h-52 rounded-xl border border-gray-200">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {previewCols.map((f) => (
                <th key={f.key} className="px-3 py-2 text-left text-gray-600 font-semibold whitespace-nowrap">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {preview.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {previewCols.map((f) => (
                  <td key={f.key} className="px-3 py-2 max-w-[130px] truncate">
                    {row[f.key] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep("mapping")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl px-3 py-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={isPending}
          className="flex-1 bg-purple-600 text-white py-2 rounded-xl font-semibold text-sm hover:bg-purple-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? "Importing..." : `Import ${preview.length} members`}
        </button>
      </div>
    </div>
  );
};

// ── Modal Shell ───────────────────────────────────────────────────────────────
const MemberForm = ({ member, onClose }) => {
  const [tab, setTab] = useState("manual");
  const isEditMode = !!member;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEditMode ? "Edit Member" : "Add Member"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {!isEditMode && (
          <div className="flex border-b border-gray-100">
            {[
              { key: "manual", label: "Manual Entry", icon: UserPlus },
              { key: "bulk",   label: "Bulk Import",  icon: Upload   },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  tab === key
                    ? "text-purple-700 border-b-2 border-purple-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {tab === "manual" || isEditMode
            ? <ManualTab member={member} onClose={onClose} />
            : <BulkImportTab />}
        </div>
      </div>
    </div>
  );
};

export default MemberForm;
