import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, LogOut, MapPin, Search, ServerCrash } from "lucide-react";
import AppBackground from "../../../components/AppBackground";
import PageHeader from "../../../components/PageHeader";
import { MASTER_ENVS, getEnv } from "../config/masterEnvs";
import { useMasterClubs } from "../services/master.queries";
import { errorMessage, impersonateAPI } from "../services/master.services";
import { clearMasterSession, useMasterSession } from "../services/masterSession";

const ENV_KEY = "masterEnv";
const STATUS_OPTIONS = [
  { value: "all", label: "All clubs" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending verification" },
  { value: "incomplete", label: "Profile incomplete" },
];

const readSavedEnv = () => {
  try {
    return localStorage.getItem(ENV_KEY);
  } catch {
    return null;
  }
};

const envSuffix = (status) =>
  status === "ok" ? "" : status === "pending" ? " · connecting…" : status === "expired" ? " · session expired" : " · unavailable";

const Badge = ({ tone, children }) => {
  const tones = {
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    slate: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  };
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${tones[tone]}`}>{children}</span>;
};

const ClubRow = ({ club, onOpen, opening }) => {
  const hasClub = !!club.clubId;
  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {club.logo ? (
          <img src={club.logo} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-700 flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/40 to-rose-500/40 text-white font-semibold flex items-center justify-center flex-shrink-0">
            {(club.name || club.adminEmail || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-white truncate">{hasClub && club.name ? club.name : "No club profile yet"}</p>
          <p className="text-sm text-slate-400 truncate">{club.adminEmail}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
            {club.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {club.city}
                {club.state ? `, ${club.state}` : ""}
              </span>
            )}
            {club.clubCode && <span className="font-mono tracking-wider text-slate-300">{club.clubCode}</span>}
            <span>Joined {new Date(club.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {club.isVerified ? <Badge tone="green">Verified</Badge> : <Badge tone="amber">Pending</Badge>}
        {!club.isProfileComplete && <Badge tone="slate">Profile incomplete</Badge>}
        <button
          type="button"
          onClick={() => onOpen(club)}
          disabled={opening || !club.isVerified}
          title={club.isVerified ? "Open this club's dashboard as its admin" : "Verify this admin before opening"}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-rose-500 hover:from-violet-600 hover:to-rose-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {opening ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          Open as admin
        </button>
      </div>
    </li>
  );
};

const MasterConsole = () => {
  const navigate = useNavigate();
  const session = useMasterSession();
  // Environment shown: what the user picked this visit; otherwise the remembered
  // one if it's signed in; otherwise the first environment that is signed in.
  const [pickedKey, setPickedKey] = useState(null);
  const statusOf = (k) => session?.envs?.[k]?.status;
  const savedKey = getEnv(readSavedEnv()) ? readSavedEnv() : null;
  const firstOkKey = MASTER_ENVS.find((e) => statusOf(e.key) === "ok")?.key;
  const envKey =
    pickedKey ||
    (savedKey && statusOf(savedKey) === "ok" ? savedKey : null) ||
    firstOkKey ||
    savedKey ||
    MASTER_ENVS[0].key;
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [openingId, setOpeningId] = useState(null);

  const env = getEnv(envKey);
  const envState = session?.envs?.[envKey] || { status: "failed", error: "Not signed in" };
  const ready = envState.status === "ok";

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, error, refetch } = useMasterClubs(env, { search, status, page }, ready);

  const changeEnv = (key) => {
    setPickedKey(key);
    setPage(1);
    try {
      localStorage.setItem(ENV_KEY, key);
    } catch {
      /* storage unavailable */
    }
  };

  const signOut = () => {
    clearMasterSession();
    navigate("/master/login", { replace: true });
  };

  const openClub = async (club) => {
    if (openingId) return;
    setOpeningId(club.adminId);
    // Open the tab inside the click so pop-up blockers allow it; point it at
    // the hand-off page once the token arrives.
    const tab = window.open("about:blank", "_blank");
    try {
      const res = await impersonateAPI(env, club.adminId);
      const params = new URLSearchParams({
        t: res.accessToken,
        c: club.name || club.adminEmail,
        a: club.adminEmail,
        m: session?.email || "",
      });
      const url = `${env.appUrl}/master/handoff#${params.toString()}`;
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      } else {
        window.open(url, "_blank", "noopener");
      }
    } catch (err) {
      if (tab) tab.close();
      toast.error(errorMessage(err, "Could not open this club"));
    } finally {
      setOpeningId(null);
    }
  };

  const items = data?.items || [];
  const envOptions = useMemo(
    () => MASTER_ENVS.map((e) => ({ ...e, suffix: envSuffix(session?.envs?.[e.key]?.status) })),
    [session]
  );

  return (
    <AppBackground variant="master">
      <PageHeader
        variant="master"
        eyebrow="Rallix · Master"
        title="Master Console"
        subtitle={session?.email}
        showLogout={false}
        actions={
          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            aria-label="Sign out"
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all"
          >
            <LogOut size={18} />
          </button>
        }
      />

      <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
        {/* Controls */}
        <div className="grid gap-3 sm:grid-cols-[220px_1fr_200px] mb-6">
          <label className="block">
            <span className="block text-xs font-medium text-slate-400 mb-1">Environment</span>
            <select
              value={envKey}
              onChange={(e) => changeEnv(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {envOptions.map((e) => (
                <option key={e.key} value={e.key}>
                  {e.label}
                  {e.suffix}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-slate-400 mb-1">Search clubs</span>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Club, admin email, city or club key"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-slate-400 mb-1">Show</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Body */}
        {envState.status === "pending" && (
          <div className="flex items-center justify-center gap-3 py-16 text-slate-300">
            <Loader2 className="w-5 h-5 animate-spin" />
            Connecting to {env?.label}… the server may be waking up.
          </div>
        )}

        {(envState.status === "failed" || envState.status === "expired") && (
          <div className="text-center py-16 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
            <ServerCrash className="w-8 h-8 text-rose-400 mx-auto mb-3" />
            <p className="text-white font-semibold">{env?.label} isn&apos;t available</p>
            <p className="text-sm text-rose-300 mt-2 max-w-md mx-auto">
              {envState.error || "Sign-in failed for this environment."}
            </p>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
              This environment needs the latest server deployed and the master account created in its database
              (run <span className="font-mono">scripts/createMaster.js</span> there). Pick another environment above to continue.
            </p>
            <button
              type="button"
              onClick={signOut}
              className="mt-5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-white/10 border border-white/10 hover:bg-white/15"
            >
              Sign in again
            </button>
          </div>
        )}

        {ready && isLoading && (
          <div className="flex items-center justify-center gap-3 py-16 text-slate-300">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading clubs…
          </div>
        )}

        {ready && isError && (
          <div className="text-center py-12 bg-slate-800/40 border border-red-500/30 rounded-2xl">
            <p className="text-red-300">{errorMessage(error, "Could not load clubs")}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-white/10 border border-white/10 hover:bg-white/15"
            >
              Retry
            </button>
          </div>
        )}

        {ready && !isLoading && !isError && (
          <>
            <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
              <span>
                {data?.total ?? 0} club{data?.total === 1 ? "" : "s"} in {env?.label}
              </span>
              {isFetching && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>

            {items.length === 0 ? (
              <p className="text-center text-slate-400 py-16 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
                No clubs match.
              </p>
            ) : (
              <ul className="space-y-3">
                {items.map((club) => (
                  <ClubRow key={club.adminId} club={club} onOpen={openClub} opening={openingId === club.adminId} />
                ))}
              </ul>
            )}

            {data?.pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-sm text-slate-300">
                  Page {data.page} of {data.pages}
                </span>
                <button
                  type="button"
                  disabled={page >= data.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 disabled:opacity-40"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppBackground>
  );
};

export default MasterConsole;
