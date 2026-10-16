import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import AppBackground from "../../../components/AppBackground";
import { MASTER_ENVS } from "../config/masterEnvs";
import { errorMessage, masterLoginAPI } from "../services/master.services";
import { clearMasterSession, setEnvResult, startMasterSession, useMasterSession } from "../services/masterSession";

const inputCls =
  "w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all";

const MasterLogin = () => {
  const navigate = useNavigate();
  const session = useMasterSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Already signed in to at least one environment → straight to the console.
  const hasSession = session && Object.values(session.envs || {}).some((e) => e.status === "ok");
  if (hasSession && !busy) return <Navigate to="/master/console" replace />;

  const onSubmit = (e) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);

    const cleanEmail = email.trim().toLowerCase();
    startMasterSession(cleanEmail, MASTER_ENVS.map((env) => env.key));

    // One login, every environment, in parallel. Go to the console as soon as
    // the first one answers; the others finish in the background (a sleeping
    // Render server can take ~30s) and show up in the dropdown when ready.
    let navigated = false;
    let failures = 0;
    let firstError = "";
    MASTER_ENVS.forEach((env) => {
      masterLoginAPI(env, { email: cleanEmail, password })
        .then((res) => {
          setEnvResult(env.key, { status: "ok", token: res.accessToken });
          if (!navigated) {
            navigated = true;
            navigate("/master/console", { replace: true });
          }
        })
        .catch((err) => {
          const msg = errorMessage(err, "Could not sign in");
          setEnvResult(env.key, { status: "failed", error: msg });
          failures += 1;
          if (!firstError || err?.response) firstError = msg;
          if (failures === MASTER_ENVS.length) {
            clearMasterSession();
            setError(firstError);
            setBusy(false);
          }
        });
    });
  };

  return (
    <AppBackground variant="master" className="flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-rose-500 shadow-lg shadow-violet-500/40 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
            Master Console
          </h1>
          <p className="text-slate-400">Rallix support access</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <label htmlFor="master-email" className="block text-slate-300">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="master-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="master@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="master-password" className="block text-slate-300">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="master-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputCls}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || !email || !password}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-rose-500 hover:from-violet-600 hover:to-rose-600 shadow-lg shadow-violet-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? "Signing in to all environments…" : "Sign in"}
            </button>
            {busy && (
              <p className="text-xs text-slate-400 text-center">
                Servers that have been idle can take up to 30 seconds to wake up.
              </p>
            )}
          </form>
        </div>
      </div>
    </AppBackground>
  );
};

export default MasterLogin;
