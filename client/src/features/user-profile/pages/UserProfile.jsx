import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, CheckCircle, Loader2, User } from "lucide-react";
import AppBackground from "../../../components/AppBackground.jsx";
import PageHeader from "../../../components/PageHeader.jsx";
import { useGetMyUserDetail, useSaveMyUserDetail } from "../services/userDetail.queries.js";
import { isValidPhone, INVALID_PHONE_MESSAGE } from "../../../utils/phone.js";

// Same personal fields as the admin Member Bank form, minus grade & points.
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

const toForm = (d) => ({
  name: d?.name ?? "",
  contact: d?.contact ?? "",
  gender: d?.gender ?? "",
  dateOfBirth: d?.dateOfBirth ? String(d.dateOfBirth).slice(0, 10) : "",
  nationalMemberId: d?.nationalMemberId ?? "",
});

const inputCls = (err) =>
  `w-full bg-slate-900/50 border rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all ${
    err ? "border-red-500" : "border-slate-600"
  }`;

const Field = ({ label, required, error, hint, className = "", children }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-slate-300 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    {hint && !error && <p className="text-slate-500 text-xs mt-1">{hint}</p>}
  </div>
);

const ViewItem = ({ label, value }) => (
  <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl px-4 py-3">
    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
    <p className={`text-[15px] font-medium break-words ${value ? "text-slate-100" : "text-slate-600 italic"}`}>
      {value || "—"}
    </p>
  </div>
);

const formatDob = (d) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }) : "";

const UserProfile = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetMyUserDetail();
  const { mutate: save, isPending } = useSaveMyUserDetail();
  const detail = data?.data;

  // null = follow the default: a first visit (nothing saved yet) opens
  // straight into the form, otherwise show the read-only view.
  const [editingOverride, setEditingOverride] = useState(null);
  const editing = editingOverride ?? (detail ? !detail.isSaved : false);
  // null = untouched, so the form always starts from the latest saved data.
  const [draft, setDraft] = useState(null);
  const form = draft ?? toForm(detail);
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => {
    const value = e.target.value;
    setDraft((d) => ({ ...(d ?? toForm(detail)), [key]: value }));
  };
  const setEditing = (value) => {
    setDraft(null);
    setEditingOverride(value);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!isValidPhone(form.contact)) errs.contact = INVALID_PHONE_MESSAGE;
    if (form.dateOfBirth && new Date(form.dateOfBirth) > new Date()) errs.dateOfBirth = "Date of birth can't be in the future";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    save(form, { onSuccess: () => setEditing(false) });
  };

  const handleCancel = () => {
    setErrors({});
    setEditing(false);
  };

  const initials =
    (detail?.name || "?")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <AppBackground variant="user">
      <PageHeader
        variant="user"
        title="My Profile"
        subtitle="Your personal details"
        onBack={() => navigate("/user/dashboard")}
        profileMenu
      />

      <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Header card */}
            <div className="relative overflow-hidden bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
              <span aria-hidden="true" className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-emerald-400 to-yellow-400 opacity-15 blur-3xl" />
              <div className="relative flex-shrink-0 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-yellow-400 text-slate-900 text-2xl font-bold shadow-lg shadow-emerald-500/30">
                {initials === "?" ? <User className="w-9 h-9" /> : initials}
              </div>
              <div className="relative flex-1 min-w-0">
                <h1 className="text-2xl font-semibold text-white truncate" style={{ fontFamily: "Outfit, sans-serif" }}>
                  {detail?.name || "Your profile"}
                </h1>
                <p className="text-sm text-slate-400 truncate">{detail?.email}</p>
              </div>
              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-500 to-yellow-500 hover:from-emerald-600 hover:to-yellow-600 shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-all"
                >
                  <Pencil className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>

            {/* Details */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-white pb-3 mb-5 border-b border-slate-700/50">Personal Details</h2>

              {editing ? (
                <form onSubmit={handleSave} className="space-y-5" noValidate>
                  {!detail?.isSaved && (
                    <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
                      Welcome! Fill in your details so clubs can recognise you.
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Name" required error={errors.name} className="sm:col-span-2">
                      <input type="text" value={form.name} onChange={set("name")} placeholder="Your full name" className={inputCls(errors.name)} />
                    </Field>
                    <Field label="Email" hint="Your login email — can't be changed here" className="sm:col-span-2">
                      <input type="email" value={detail?.email || ""} disabled className={inputCls() + " !bg-slate-900/30 !text-slate-500 cursor-not-allowed"} />
                    </Field>
                    <Field label="Gender">
                      <select value={form.gender} onChange={set("gender")} className={inputCls()}>
                        <option value="">Select gender</option>
                        {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                        {form.gender && !GENDERS.includes(form.gender) && <option value={form.gender}>{form.gender}</option>}
                      </select>
                    </Field>
                    <Field label="Contact" error={errors.contact}>
                      <input type="tel" inputMode="tel" value={form.contact} onChange={set("contact")} placeholder="e.g. 0412 345 678" className={inputCls(errors.contact)} />
                    </Field>
                    <Field label="Date of Birth" error={errors.dateOfBirth}>
                      <input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} max={new Date().toISOString().slice(0, 10)} className={inputCls(errors.dateOfBirth)} />
                    </Field>
                    <Field label="National Member ID">
                      <input type="text" value={form.nationalMemberId} onChange={set("nationalMemberId")} placeholder="e.g. 60038" className={inputCls()} />
                    </Field>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-5 border-t border-slate-700/50">
                    {detail?.isSaved && (
                      <button type="button" onClick={handleCancel} disabled={isPending} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-slate-600 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all">
                        Cancel
                      </button>
                    )}
                    <button type="submit" disabled={isPending} className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-yellow-500 hover:from-emerald-600 hover:to-yellow-600 shadow-lg shadow-emerald-500/30 disabled:opacity-50 transition-all">
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {isPending ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ViewItem label="Name" value={detail?.name} />
                  <ViewItem label="Email" value={detail?.email} />
                  <ViewItem label="Gender" value={detail?.gender} />
                  <ViewItem label="Contact" value={detail?.contact} />
                  <ViewItem label="Date of Birth" value={formatDob(detail?.dateOfBirth)} />
                  <ViewItem label="National Member ID" value={detail?.nationalMemberId} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppBackground>
  );
};

export default UserProfile;
