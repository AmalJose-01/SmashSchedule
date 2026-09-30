import { useNavigate } from "react-router-dom";
import { LogIn, ScanSearch, CalendarDays, Trophy, ArrowRight, Shield } from "lucide-react";
import AppBackground from "../../components/AppBackground";
import RallixLogo from "../../components/RallixLogo";
import { RallyScene, PerspectiveCourt, FloatingShuttles } from "./HomeArt";

const FEATURES = [
  { icon: ScanSearch, title: "Find your club", text: "Club key or QR code" },
  { icon: CalendarDays, title: "Your matches", text: "Court, round & time" },
  { icon: Trophy, title: "Live scores", text: "Updated as you play" },
];

const LoginSelector = () => {
  const navigate = useNavigate();

  return (
    <AppBackground variant="user" className="flex items-center">
      <PerspectiveCourt />
      <FloatingShuttles />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-16 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <div className="text-center lg:text-left">
          <div className="flex justify-center lg:justify-start mb-6">
            <RallixLogo size="md" />
          </div>

          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" /> Tournaments · Round robins
          </p>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight text-white mb-4"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Every rally,{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-lime-300 to-yellow-300 bg-clip-text text-transparent">
              perfectly scheduled.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-md mx-auto lg:mx-0">
            Join your club&apos;s tournaments and round robins, see exactly when and where you play, and follow the scores live.
          </p>

          {/* Rally animation — hidden on phones so Player Login stays on the first screen */}
          <RallyScene className="hidden sm:block mt-8 max-w-md mx-auto lg:mx-0 px-[6%]" />
        </div>

        {/* ── Player login card (main action) ───────────────────── */}
        <div className="w-full max-w-md mx-auto">
          <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/40 border border-emerald-400/20 p-6 sm:p-8 overflow-hidden">
            {/* court-line accent */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-2xl border border-white/5" />
            <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-3 bottom-3 w-px bg-white/5" />
            <span aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 rounded-full bg-gradient-to-br from-emerald-400 to-yellow-300 opacity-20 blur-3xl" />

            <div className="relative">
              <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                Ready to play?
              </h2>
              <p className="text-sm text-slate-400 mt-1 mb-6">Sign in to see your clubs, tournaments and matches.</p>

              <button
                type="button"
                onClick={() => navigate("/user/login")}
                className="group w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-lg font-semibold text-slate-900 bg-gradient-to-r from-emerald-400 via-lime-300 to-yellow-300 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-400/60 hover:scale-[1.02] active:scale-[0.99] transition-all"
              >
                <LogIn className="w-5 h-5" />
                Player Login
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/user/signup")}
                className="w-full mt-3 py-3 rounded-2xl text-sm font-semibold text-emerald-200 border border-emerald-400/30 bg-emerald-500/5 hover:bg-emerald-500/15 transition-colors"
              >
                New to Rallix? Create a player account
              </button>

              <div className="grid grid-cols-3 gap-2 mt-7 pt-6 border-t border-slate-700/50">
                {FEATURES.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="text-center">
                    <span className="mx-auto mb-2 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-yellow-400/10 border border-emerald-400/20">
                      <Icon className="w-5 h-5 text-emerald-300" />
                    </span>
                    <p className="text-xs font-semibold text-white">{title}</p>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Admin login — secondary */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => navigate("/admin/login")}
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Club admin? <span className="font-semibold underline underline-offset-4 decoration-slate-600">Admin login</span>
            </button>
          </div>
        </div>
      </div>
    </AppBackground>
  );
};

export default LoginSelector;
