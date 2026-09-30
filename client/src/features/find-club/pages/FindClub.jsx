import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, ScanLine, X, Loader2, MapPin, Phone, Mail, SearchX, KeyRound, Plus, Check } from "lucide-react";
import { useMyClubs, useAddMyClub } from "../../my-clubs/services/myClubs.queries.js";
import JoinRoundRobinPrompt from "../../my-clubs/components/JoinRoundRobinPrompt.jsx";
import AppBackground from "../../../components/AppBackground.jsx";
import PageHeader from "../../../components/PageHeader.jsx";
import QrScanner from "../components/QrScanner.jsx";
import { getClubByCode } from "../../club-profile/users/services/clubSearch.services.js";
import { CLUB_KEY_LENGTH, normaliseClubKey, isValidClubKey, extractClubKey } from "../clubKey.js";

const ClubResult = ({ club }) => {
  const navigate = useNavigate();
  const { data: myClubs = [] } = useMyClubs();
  const { mutate: addClub, isPending: adding } = useAddMyClub();
  const alreadyAdded = myClubs.some((c) => c._id === club._id);
  // After "Add to My Clubs", ask whether they also want to join the round robin.
  const [askJoin, setAskJoin] = useState(false);

  const location = [club.location?.address, club.location?.city, club.location?.state, club.location?.country]
    .filter(Boolean)
    .join(", ");
  return (
    <div className="relative overflow-hidden bg-slate-800/50 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl p-6">
      <span aria-hidden="true" className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-400 to-yellow-400 opacity-15 blur-3xl" />
      <div className="relative flex items-center gap-4">
        {club.logo ? (
          <img src={club.logo} alt="" className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-yellow-400 flex items-center justify-center text-2xl font-bold text-slate-900">
            {(club.name || "?")[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Club found</p>
          <h3 className="text-xl font-semibold text-white truncate" style={{ fontFamily: "Outfit, sans-serif" }}>
            {club.name || "Unnamed club"}
          </h3>
          <p className="text-xs font-mono tracking-widest text-slate-500">{club.clubCode}</p>
        </div>
      </div>

      <div className="relative mt-5 space-y-2.5 text-sm">
        {location && (
          <p className="flex items-start gap-2.5 text-slate-300"><MapPin className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />{location}</p>
        )}
        {club.phoneNumber && (
          <a href={`tel:${club.phoneNumber}`} className="flex items-center gap-2.5 text-slate-300 hover:text-white"><Phone className="w-4 h-4 text-emerald-400" />{club.phoneNumber}</a>
        )}
        {club.email && (
          <a href={`mailto:${club.email}`} className="flex items-center gap-2.5 text-slate-300 hover:text-white break-all"><Mail className="w-4 h-4 text-emerald-400" />{club.email}</a>
        )}
      </div>

      <div className="relative mt-6">
        {alreadyAdded ? (
          <button
            type="button"
            onClick={() => navigate("/user/my-clubs")}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-emerald-300 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
          >
            <Check className="w-4 h-4" /> In My Clubs — view
          </button>
        ) : (
          <button
            type="button"
            onClick={() => addClub(club._id, { onSuccess: () => setAskJoin(true) })}
            disabled={adding}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-yellow-500 hover:from-emerald-600 hover:to-yellow-600 shadow-lg shadow-emerald-500/30 disabled:opacity-60 transition-all"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {adding ? "Adding..." : "Add to My Clubs"}
          </button>
        )}
      </div>
      {askJoin && <JoinRoundRobinPrompt club={club} onClose={() => setAskJoin(false)} />}
    </div>
  );
};

const FindClub = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKey = normaliseClubKey(searchParams.get("code")).slice(0, CLUB_KEY_LENGTH);

  const [input, setInput] = useState(initialKey);
  const [submittedKey, setSubmittedKey] = useState(isValidClubKey(initialKey) ? initialKey : "");
  const [inputError, setInputError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState("");

  const { data, isFetching, error } = useQuery({
    queryKey: ["club-by-code", submittedKey],
    queryFn: () => getClubByCode(submittedKey),
    enabled: !!submittedKey,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
  const club = data?.club;
  const notFound = error?.response?.status === 404;

  const search = (key) => {
    const k = normaliseClubKey(key);
    if (!isValidClubKey(k)) {
      setInputError(`Club keys are ${CLUB_KEY_LENGTH} letters/numbers (no 0, O, 1, I or L).`);
      return;
    }
    setInputError("");
    setInput(k);
    setSubmittedKey(k);
    setSearchParams({ code: k }, { replace: true });
  };

  const handleScan = (text) => {
    setScanning(false);
    const key = extractClubKey(text);
    if (key) {
      setScanNote("");
      search(key);
    } else {
      setScanNote("That QR code isn't a Rallix club code. Try again or type the key.");
    }
  };

  return (
    <AppBackground variant="user">
      <PageHeader
        variant="user"
        title="Find a Club"
        subtitle="Search by club key or scan a QR code"
        onBack={() => navigate("/user/dashboard")}
        profileMenu
      />

      <div className="px-4 sm:px-6 py-8 max-w-xl mx-auto space-y-6">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5">
          {/* Key search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              search(input);
            }}
            className="space-y-2"
            noValidate
          >
            <label htmlFor="club-key" className="block text-sm font-medium text-slate-300">Club key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="club-key"
                  value={input}
                  onChange={(e) => {
                    setInput(normaliseClubKey(e.target.value).slice(0, CLUB_KEY_LENGTH));
                    setInputError("");
                  }}
                  placeholder="e.g. 7E46JNBT"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  inputMode="text"
                  maxLength={CLUB_KEY_LENGTH + 4}
                  className={`w-full pl-12 pr-4 py-3 bg-slate-900/50 border rounded-xl font-mono text-lg tracking-[0.25em] uppercase text-white placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all ${
                    inputError ? "border-red-500" : "border-slate-600"
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={isFetching}
                className="inline-flex items-center gap-2 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-500 to-yellow-500 hover:from-emerald-600 hover:to-yellow-600 shadow-lg shadow-emerald-500/30 disabled:opacity-60 transition-all"
              >
                {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
            <p className={`text-xs ${inputError ? "text-red-400" : "text-slate-500"}`}>
              {inputError || `${input.length}/${CLUB_KEY_LENGTH} — ask your club admin for their key.`}
            </p>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-slate-700/50" />
            <span className="text-slate-500 text-sm">or</span>
            <div className="flex-1 border-t border-slate-700/50" />
          </div>

          {/* Scanner */}
          {scanning ? (
            <div className="space-y-3">
              <QrScanner onResult={handleScan} />
              <button
                type="button"
                onClick={() => setScanning(false)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border border-slate-600 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                <X className="w-4 h-4" /> Stop scanning
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setScanNote("");
                setScanning(true);
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-emerald-300 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
            >
              <ScanLine className="w-5 h-5" /> Scan club QR code
            </button>
          )}
          {scanNote && <p className="text-xs text-amber-300 text-center">{scanNote}</p>}
        </div>

        {/* Result */}
        {submittedKey && !isFetching && club && <ClubResult club={club} />}
        {submittedKey && !isFetching && error && (
          <div className="flex flex-col items-center text-center gap-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8">
            <SearchX className="w-9 h-9 text-slate-500" />
            <p className="text-white font-medium">{notFound ? "No club found" : "Something went wrong"}</p>
            <p className="text-sm text-slate-400">
              {notFound
                ? `There's no club with the key ${submittedKey}. Check the key and try again.`
                : "Please try again in a moment."}
            </p>
          </div>
        )}
      </div>
    </AppBackground>
  );
};

export default FindClub;
