// On/off switch used for "Accept online payment".
const Toggle = ({ checked, onChange, label, hint }) => (
  <label className="flex items-start justify-between gap-4 cursor-pointer">
    <span>
      <span className="block text-sm font-medium text-slate-200">{label}</span>
      {hint && <span className="block text-xs text-slate-400 mt-0.5">{hint}</span>}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-slate-600"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  </label>
);

export default Toggle;
