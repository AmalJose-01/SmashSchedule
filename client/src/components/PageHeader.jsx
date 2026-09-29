// PageHeader.jsx
// Sticky glass navigation bar used on top of <AppBackground>. Matches the
// dark slate / cyan-emerald look of the login and home pages.
//
//   <PageHeader
//     title="Round Robin Tournaments"
//     subtitle="Doubles · 2 groups"          // optional, string or node
//     badge={<span>Live</span>}               // optional, shown beside title
//     onBack={() => navigate(-1)}             // optional back button
//     actions={<button>New</button>}          // optional, right side
//   />
import { ArrowLeft, Trophy } from "lucide-react";
import Logout from "./Logout";

const PageHeader = ({
  title,
  subtitle,
  badge,
  onBack,
  actions,
  eyebrow = "SmashSchedule",
  showLogout = true,
}) => (
  <header className="sticky top-0 z-20 bg-slate-900/70 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20">
    <div className="flex items-center justify-between gap-3 px-4 py-3 min-h-[64px]">
      {/* Left: back + brand + title */}
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white hover:border-cyan-400/40 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="hidden sm:inline-flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-500 shadow-lg shadow-cyan-500/30">
          <Trophy className="w-5 h-5 text-white" />
        </div>

        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-widest bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent leading-tight">
              {eyebrow}
            </p>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <h2
              className="text-lg sm:text-xl font-semibold text-white leading-tight truncate"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {title}
            </h2>
            {badge}
          </div>
          {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
        </div>
      </div>

      {/* Right: page actions + logout */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}
        {showLogout && <Logout />}
      </div>
    </div>

    {/* Accent line */}
    <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
  </header>
);

export default PageHeader;
