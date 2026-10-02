// KnockoutBracket.jsx
// Classic knockout tree: one column per round (Round of 32 → Final), each
// match a two-row box, lines joining every pair of matches into the next
// round, and the champion with a trophy at the end. Rounds that aren't
// created yet show "TBD" so the full bracket is always visible.
//
//   <KnockoutBracket matches={knockoutMatches} variant="admin" onMatchClick={fn} />
//
// matches: KnockoutMatch docs { _id, round, teamsHome, teamsAway, winner, scores, status }
// Round numbers: 0 = Round of 32, 1 = Round of 16, 2 = QF, 3 = SF, 4 = Final.
// Match k of a round is fed by matches 2k and 2k+1 of the previous round
// (same order the server uses when it creates the next round).
import { Trophy } from "lucide-react";

const ROUND_NAMES = { 0: "Round of 32", 1: "Round of 16", 2: "Quarterfinals", 3: "Semifinals", 4: "Final" };

const THEMES = {
  admin: {
    bar: "from-cyan-400 to-blue-600",
    winRow: "bg-cyan-500/15",
    winText: "text-white",
    line: "border-cyan-500/40",
    dot: "bg-cyan-400",
    head: "text-cyan-300",
    hover: "hover:border-cyan-400/60",
    banner: "from-cyan-500/25 via-blue-600/15 to-transparent",
  },
  user: {
    bar: "from-emerald-400 to-yellow-500",
    winRow: "bg-emerald-500/15",
    winText: "text-white",
    line: "border-emerald-500/40",
    dot: "bg-emerald-400",
    head: "text-emerald-300",
    hover: "hover:border-emerald-400/60",
    banner: "from-emerald-500/25 via-yellow-500/10 to-transparent",
  },
};

const COL = 200; // match box width
const GAP = 48; // space between rounds (connector lines live here)
const SLOT = 84; // height per first-round match

const nextPow2 = (n) => (n <= 1 ? 1 : 2 ** Math.ceil(Math.log2(n)));
const sideName = (side) => side?.teamName || side?.name || null;

const MatchBox = ({ match, t, onClick }) => {
  const sides = [
    { key: "home", name: sideName(match?.teamsHome) },
    { key: "away", name: sideName(match?.teamsAway) },
  ];
  const played = (match?.scores || []).filter((s) => s.home > 0 || s.away > 0);
  const winner = match?.status === "finished" ? match?.winner : null;

  return (
    <button
      type="button"
      disabled={!match || !onClick}
      onClick={() => match && onClick?.(match)}
      style={{ width: COL }}
      className={`relative z-10 text-left rounded-lg overflow-hidden border border-slate-700/70 bg-slate-900/80 shadow-lg shadow-black/30 transition-colors ${
        match && onClick ? `cursor-pointer ${t.hover}` : "cursor-default"
      }`}
    >
      {sides.map((s, i) => {
        const isWin = winner === s.key;
        const isLose = winner && !isWin;
        return (
          <div
            key={s.key}
            className={`flex items-center h-8 ${i === 0 ? "border-b border-slate-700/70" : ""} ${isWin ? t.winRow : ""}`}
          >
            <span className={`w-1.5 self-stretch bg-gradient-to-b ${t.bar} ${s.name ? "" : "opacity-30"}`} />
            <span
              className={`flex-1 min-w-0 px-2 text-xs truncate ${
                !s.name ? "text-slate-600 italic" : isWin ? `font-semibold ${t.winText}` : isLose ? "text-slate-500" : "text-slate-200"
              }`}
              title={s.name || "To be decided"}
            >
              {s.name || "TBD"}
            </span>
            {played.length > 0 && (
              <span className="flex gap-1 pr-2 text-[11px] tabular-nums">
                {played.map((set, idx) => {
                  const mine = set[s.key];
                  const other = set[s.key === "home" ? "away" : "home"];
                  return (
                    <span key={idx} className={mine > other ? "text-white font-semibold" : "text-slate-500"}>
                      {mine}
                    </span>
                  );
                })}
              </span>
            )}
          </div>
        );
      })}
    </button>
  );
};

const KnockoutBracket = ({ matches = [], variant = "admin", onMatchClick, title = "Knockout Stage" }) => {
  const t = THEMES[variant] ?? THEMES.admin;
  if (!matches.length) return null;

  // Matches per round, in creation order.
  const byRound = {};
  for (const m of matches) (byRound[m.round] ||= []).push(m);
  Object.values(byRound).forEach((list) => list.sort((a, b) => String(a._id).localeCompare(String(b._id))));

  const firstRound = Math.min(...Object.keys(byRound).map(Number));
  const firstSize = nextPow2(byRound[firstRound].length); // matches in the first column
  const roundsCount = Math.log2(firstSize) + 1; // ... down to the final
  const columns = Array.from({ length: roundsCount }, (_, i) => {
    const round = firstRound + i;
    const size = firstSize / 2 ** i;
    const list = byRound[round] || [];
    return { round, size, slots: Array.from({ length: size }, (_, k) => list[k] || null) };
  });

  const height = firstSize * SLOT;
  const final = columns[columns.length - 1].slots[0];
  const championName =
    final?.status === "finished" && final?.winner
      ? sideName(final.winner === "home" ? final.teamsHome : final.teamsAway)
      : null;

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden">
      <div className={`px-5 py-4 bg-gradient-to-r ${t.banner} border-b border-slate-700/50`}>
        <p className={`text-[11px] font-semibold uppercase tracking-widest ${t.head}`}>Championship</p>
        <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
          {title}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex p-5 sm:p-6 min-w-full">
          {columns.map((col, ci) => {
            const isLastCol = ci === columns.length - 1;
            const slotH = height / col.size;
            return (
              <div key={col.round} style={{ width: COL, marginRight: GAP }} className="flex-shrink-0">
                <div className={`h-6 mb-3 text-[11px] font-semibold uppercase tracking-wider text-center ${t.head}`}>
                  {ROUND_NAMES[col.round] ?? `Round ${col.round}`}
                </div>
                <div style={{ height }}>
                  {col.slots.map((m, k) => (
                    <div key={k} className="relative flex items-center" style={{ height: slotH, width: COL }}>
                      {/* line in from the previous round */}
                      {ci > 0 && (
                        <div className={`absolute top-1/2 border-t ${t.line}`} style={{ left: -GAP / 2, width: GAP / 2 }} />
                      )}

                      <MatchBox match={m} t={t} onClick={onMatchClick} />

                      {/* line out to the next round (or to the trophy) */}
                      <div className={`absolute top-1/2 border-t ${t.line}`} style={{ left: COL, width: GAP / 2 }} />

                      {/* join each pair: vertical line + dot */}
                      {!isLastCol && k % 2 === 0 && (
                        <>
                          <div
                            className={`absolute border-r ${t.line}`}
                            style={{ left: COL + GAP / 2 - 1, top: slotH / 2, height: slotH }}
                          />
                          <div
                            className={`absolute w-2 h-2 rounded-full ${t.dot}`}
                            style={{ left: COL + GAP / 2 - 4, top: slotH - 4 }}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Champion */}
          <div className="flex-shrink-0 w-44">
            <div className={`h-6 mb-3 text-[11px] font-semibold uppercase tracking-wider text-center ${t.head}`}>Champion</div>
            <div style={{ height }} className="relative flex flex-col items-center justify-center">
              <div className={`absolute top-1/2 border-t ${t.line}`} style={{ left: -GAP / 2, width: GAP / 2 }} />
              <Trophy
                className={`w-16 h-16 ${championName ? "text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.45)]" : "text-slate-600"}`}
              />
              <div
                className={`mt-3 text-center font-bold ${championName ? "text-white text-lg" : "text-slate-500 text-sm italic"}`}
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                {championName || "TBD"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnockoutBracket;
