import React, { useState, useRef } from "react";
import { X, Upload, UserPlus, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { readString } from "react-papaparse";
import * as XLSX from "xlsx";
import {
  useApproveRoundRobinMember,
  useCreateRoundRobinMember,
  useUpdateRoundRobinMember,
  useBulkImportRoundRobinMembers,
} from "../services/roundRobin.queries.js";

import { isValidPhone, INVALID_PHONE_MESSAGE } from "../../../../utils/phone.js";

const GRADES = ["A", "B", "C", "D", "E", "F", "G", "H", "Unrated"];
const MAX_POINTS = 100; // kept in sync with server MAX_MEMBER_POINTS
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

// Kept in sync with server/src/features/round-robin/constants/grades.js —
// default starting points for a member of each grade.
const GRADE_DEFAULT_POINTS = {
  A: 80,
  B: 75,
  C: 60,
  D: 45,
  E: 30,
  F: 15,
  G: 0,
  H: 0,
  Unrated: 0,
};

const EMPTY_FORM = {
  name: "", grade: "Unrated", points: GRADE_DEFAULT_POINTS.Unrated, email: "", contact: "",
  nationalMemberId: "", dateOfBirth: "", gender: "", isMember: true,
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
const ManualTab = ({ member, onClose, approveMode = false }) => {
  const [form, setForm] = useState(
    member
      ? {
          name: member.name ?? "",
          // A pending (self-joined) member has no grade/points yet — the
          // admin must pick a grade to approve them.
          grade: member.grade ?? (approveMode ? "" : "Unrated"),
          points: member.points ?? (approveMode ? "" : GRADE_DEFAULT_POINTS[member.grade ?? "Unrated"]),
          email: member.email ?? "",
          contact: member.contact ?? "",
          nationalMemberId: member.nationalMemberId ?? "",
          dateOfBirth: member.dateOfBirth ? member.dateOfBirth.slice(0, 10) : "",
          gender: member.gender ?? "",
          isMember: member.isMember ?? true,
        }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState({});

  const { mutate: createMember, isPending: isCreating } = useCreateRoundRobinMember();
  const { mutate: updateMember, isPending: isUpdating } = useUpdateRoundRobinMember();
  const { mutate: approveMember, isPending: isApproving } = useApproveRoundRobinMember();
  const isPending = isCreating || isUpdating || isApproving;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.grade) e.grade = "Grade is required";
    if (!isValidPhone(form.contact)) e.contact = INVALID_PHONE_MESSAGE;
    const pts = Number(form.points);
    if (form.points === "" || !Number.isFinite(pts)) e.points = "Points are required";
    else if (pts < 0 || pts > MAX_POINTS) e.points = `Points must be between 0 and ${MAX_POINTS}`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // Changing grade resets points to that grade's default — admin can still
  // fine-tune the value afterwards before saving.
  const handleGradeChange = (e) => {
    const grade = e.target.value;
    setForm((f) => ({ ...f, grade, points: GRADE_DEFAULT_POINTS[grade] ?? 0 }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      name: form.name,
      grade: form.grade,
      points: Number(form.points),
      contact: form.contact,
      isMember: form.isMember,
      nationalMemberId: form.nationalMemberId || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender || undefined,
    };
    if (approveMode) {
      approveMember({ memberId: member._id, data: payload }, { onSuccess: onClose });
    } else if (member) {
      updateMember({ memberId: member._id, data: payload }, { onSuccess: onClose });
    } else {
      createMember({ ...payload, email: form.email }, { onSuccess: onClose });
    }
  };

  const inputCls = (field) =>
    `w-full bg-slate-900/50 border rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${
      errors[field] ? "border-red-500" : "border-slate-600"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {approveMode && (
        <p className="text-sm text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
          This player joined from their own account. Check their details and choose a grade to approve them.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {/* Name */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={handleChange("name")}
            placeholder="Player name"
            className={inputCls("name")}
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            placeholder="player@email.com"
            disabled={!!member}
            className={`${inputCls("email")} ${member ? "!bg-slate-900/30 !text-slate-500 cursor-not-allowed" : ""}`}
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          {member && <p className="text-slate-500 text-xs mt-1">Email cannot be changed</p>}
        </div>

        {/* Grade */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Grade {approveMode && <span className="text-red-400">*</span>}
          </label>
          <select
            value={form.grade}
            onChange={handleGradeChange}
            className={inputCls("grade")}
          >
            {!form.grade && <option value="">Select grade</option>}
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          {errors.grade && <p className="text-red-400 text-xs mt-1">{errors.grade}</p>}
        </div>

        {/* Points */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Points</label>
          <input
            type="number"
            step="0.5"
            min={0}
            max={MAX_POINTS}
            value={form.points}
            onChange={handleChange("points")}
            className={inputCls("points")}
          />
          <p className="text-slate-500 text-xs mt-1">
            Defaults to {GRADE_DEFAULT_POINTS[form.grade] ?? 0} for grade {form.grade} — changing grade resets this. Max {MAX_POINTS}.
          </p>
          {errors.points && <p className="text-red-400 text-xs mt-1">{errors.points}</p>}
        </div>

        {/* Membership Status */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Membership</label>
          <select
            value={form.isMember ? "member" : "non-member"}
            onChange={(e) => setForm((f) => ({ ...f, isMember: e.target.value === "member" }))}
            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          >
            <option value="member">Member</option>
            <option value="non-member">Non-Member</option>
          </select>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Gender</label>
          <select
            value={form.gender}
            onChange={handleChange("gender")}
            className={inputCls("gender")}
          >
            <option value="">Select gender</option>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            {/* Keep a legacy/imported value (e.g. "M") selectable so editing
                a member doesn't silently blank it out. */}
            {form.gender && !GENDERS.includes(form.gender) && (
              <option value={form.gender}>{form.gender}</option>
            )}
          </select>
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Contact</label>
          <input
            type="tel"
            inputMode="tel"
            value={form.contact}
            onChange={(e) => {
              handleChange("contact")(e);
              if (errors.contact) setErrors((er) => ({ ...er, contact: undefined }));
            }}
            placeholder="e.g. 0412 345 678"
            className={inputCls("contact")}
          />
          {errors.contact && <p className="text-red-400 text-xs mt-1">{errors.contact}</p>}
        </div>

        {/* DOB */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Date of Birth</label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={handleChange("dateOfBirth")}
            className={inputCls("dateOfBirth")}
          />
        </div>

        {/* National Member ID */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">National Member ID</label>
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
        className="w-full py-3 rounded-xl font-semibold text-sm mt-2 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
      >
        {isPending
          ? approveMode ? "Approving..." : member ? "Saving..." : "Adding..."
          : approveMode ? "Approve Member" : member ? "Save Changes" : "Add Member"}
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
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm mb-1">
              <CheckCircle2 className="w-4 h-4" />
              Import complete
            </div>
            <p className="text-xs text-emerald-400">
              {importResult.success} added
              {importResult.reactivated > 0 && ` · ${importResult.reactivated} restored`}
              {importResult.updated > 0 && ` · ${importResult.updated} updated`}
              {importResult.failed > 0 && ` · ${importResult.failed} skipped`}
            </p>
            {importResult.errors?.length > 0 && (
              <ul className="mt-2 space-y-0.5 max-h-24 overflow-y-auto">
                {importResult.errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-400">{e.email}: {e.reason}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="bg-slate-900/40 rounded-xl p-3 border border-dashed border-slate-600">
          <p className="text-xs text-slate-300 font-medium mb-1">Accepted formats</p>
          <p className="text-xs text-slate-400">.csv · .txt · .xlsx · .xls</p>
          <p className="text-xs text-slate-500 mt-1">
            Required columns: <span className="font-medium">Name</span>, <span className="font-medium">Email</span> — all others are mapped in the next step
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Imported files don't carry membership status — new members are added as <span className="font-medium">Non-Member</span> by default. Edit a member afterwards to mark them as a Member.
          </p>
        </div>

        <label className="flex items-center justify-center gap-2 cursor-pointer text-sm text-cyan-400 font-medium hover:text-cyan-300 border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 rounded-xl py-3 transition-all">
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

        <p className="text-xs text-slate-500 text-center">— or paste CSV text below —</p>

        <textarea
          value={csvText}
          onChange={(e) => { setCsvText(e.target.value); setParseError(""); setImportResult(null); }}
          placeholder="Paste CSV data here..."
          rows={5}
          className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-mono resize-none"
        />

        {parseError && (
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {parseError}
          </div>
        )}

        {csvText.trim() && (
          <button
            type="button"
            onClick={handlePastePreview}
            className="w-full border border-cyan-500/50 text-cyan-300 py-3 rounded-xl font-semibold text-sm hover:bg-cyan-500/10 transition-colors flex items-center justify-center gap-2"
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
        <p className="text-sm text-slate-300">
          <span className="font-semibold text-cyan-300">{rawRows.length}</span> rows found.
          Map each CSV column to a system field.
        </p>

        <div className="border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 bg-slate-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700/50">
            <span>CSV Column</span>
            <span>Maps to</span>
          </div>
          <div className="divide-y divide-slate-700/50 max-h-56 overflow-y-auto">
            {rawHeaders.map((h) => (
              <div key={h} className="grid grid-cols-2 items-center px-4 py-2.5 gap-2">
                <span className="text-sm font-mono text-slate-300 truncate">{h}</span>
                <select
                  value={fieldMap[h] ?? "skip"}
                  onChange={(e) =>
                    setFieldMap((prev) => ({ ...prev, [h]: e.target.value }))
                  }
                  className="bg-slate-900/50 border border-slate-600 rounded-lg px-2 py-2 text-xs text-white [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {mapError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 text-sm rounded-xl px-3 py-2 border border-slate-600 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            type="button"
            onClick={handleProceedToPreview}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
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
      <p className="text-sm text-slate-300">
        <span className="font-semibold text-cyan-300">{preview.length}</span> members ready to import
      </p>

      <div className="overflow-auto max-h-52 rounded-xl border border-slate-700/50">
        <table className="w-full text-xs">
          <thead className="bg-slate-900 sticky top-0">
            <tr>
              {previewCols.map((f) => (
                <th key={f.key} className="px-3 py-2 text-left text-slate-400 font-semibold whitespace-nowrap">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {preview.map((row, i) => (
              <tr key={i} className="hover:bg-white/5">
                {previewCols.map((f) => (
                  <td key={f.key} className="px-3 py-2 max-w-[130px] truncate text-slate-200">
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
          className="flex items-center gap-1.5 text-sm rounded-xl px-3 py-2 border border-slate-600 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={isPending}
          className="flex-1 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
        >
          {isPending ? "Importing..." : `Import ${preview.length} members`}
        </button>
      </div>
    </div>
  );
};

// ── Modal Shell ───────────────────────────────────────────────────────────────
const MemberForm = ({ member, onClose, approveMode = false }) => {
  const [tab, setTab] = useState("manual");
  const isEditMode = !!member;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">
            {approveMode ? "Approve Member" : isEditMode ? "Edit Member" : "Add Member"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isEditMode && (
          <div className="flex border-b border-slate-700/50">
            {[
              { key: "manual", label: "Manual Entry", icon: UserPlus },
              { key: "bulk",   label: "Bulk Import",  icon: Upload   },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  tab === key
                    ? "text-white border-b-2 border-cyan-400"
                    : "text-slate-400 hover:text-white"
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
            ? <ManualTab member={member} onClose={onClose} approveMode={approveMode} />
            : <BulkImportTab />}
        </div>
      </div>
    </div>
  );
};

export default MemberForm;
