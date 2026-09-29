// DashboardTile.jsx
// Glass navigation tile for dashboards on top of <AppBackground>.
//
//   <DashboardTile
//     icon={Trophy}
//     gradient="from-cyan-400 to-blue-500"   // icon badge colours
//     title="Tournament Management"
//     description="Create and manage tournaments."
//     onClick={() => navigate("/x")}
//     locked                                 // greys out + shows lock pill
//     lockedText="Complete club profile first"
//     badge="Setup required"                 // optional amber pill
//   />
import { ArrowRight, Lock } from "lucide-react";

const DashboardTile = ({
  icon: Icon,
  gradient = "from-cyan-400 to-blue-500",
  title,
  description,
  onClick,
  locked = false,
  lockedText = "Complete club profile first",
  badge,
  dot = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`group relative w-full sm:w-72 text-left overflow-hidden rounded-3xl p-7 border backdrop-blur-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
      locked
        ? "bg-slate-800/30 border-slate-700/40"
        : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 hover:border-cyan-500/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10"
    }`}
  >
    {/* corner glow */}
    {!locked && (
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl group-hover:opacity-25 transition-opacity`}
      />
    )}

    {dot && <span className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-pulse" />}

    <span
      className={`relative inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 ${
        locked ? "bg-slate-700/60" : `bg-gradient-to-br ${gradient} shadow-lg shadow-black/30`
      }`}
    >
      <Icon className={`w-7 h-7 ${locked ? "text-slate-500" : "text-white"}`} />
    </span>

    <h3
      className={`relative text-lg font-semibold mb-2 ${locked ? "text-slate-500" : "text-white"}`}
      style={{ fontFamily: "Outfit, sans-serif" }}
    >
      {title}
    </h3>
    <p className={`relative text-sm leading-relaxed ${locked ? "text-slate-600" : "text-slate-400"}`}>{description}</p>

    <div className="relative mt-5 flex items-center justify-between">
      {locked ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-700/50 border border-slate-600/50 px-3 py-1 rounded-full">
          <Lock className="w-3 h-3" /> {lockedText}
        </span>
      ) : badge ? (
        <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
          {badge}
        </span>
      ) : (
        <span className="text-xs font-semibold text-cyan-400">Open</span>
      )}
      {!locked && (
        <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
      )}
    </div>
  </button>
);

export default DashboardTile;
