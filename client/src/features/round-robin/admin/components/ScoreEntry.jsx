import React, { useState, useEffect } from "react";
import { Plus, Minus, Send, AlertCircle, RotateCcw } from "lucide-react";
import { useRecordMatchScore, useResetMatchScore } from "../services/roundRobin.queries.js";

const EMPTY_SET = { home: "", away: "" };

const inputCls =
  "w-16 text-center border border-gray-200 rounded-lg py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-300";

/**
 * A set is won when one side reaches winPt with at least gap lead.
 * 0-0 is treated as empty (allowed to skip).
 */
const isValidSet = (set, winPt, gap) => {
  const h = Number(set.home) || 0;
  const a = Number(set.away) || 0;
  if (h === 0 && a === 0) return true;
  if (h === a) return false;
  const maxScore = Math.max(h, a);
  const diff = Math.abs(h - a);
  return maxScore >= winPt && diff >= gap;
};

const ScoreEntry = ({ match, tournamentId, tournament, onScoreRecorded }) => {
  const maxSets = tournament?.numberOfSets    ?? 3;
  const winPt   = tournament?.setWinningPoint ?? 21;
  const gap     = tournament?.winningPointGap ?? 2;
  // True majority of sets — matches the backend formula in matchHelpers.js.
  // For an even count (e.g. Best of 2) winning every set still wins outright;
  // an even split is decided by total points instead (see hint text below).
  const reqWins = Math.floor(maxSets / 2) + 1;
  const isEvenFormat = maxSets % 2 === 0;

  const [sets, setSets] = useState(
    Array.from({ length: maxSets }, () => ({ ...EMPTY_SET }))
  );
  const [validationError, setValidationError] = useState("");

  const { mutate: recordScore, isPending } = useRecordMatchScore();
  const { mutate: resetScore, isPending: isResetting } = useResetMatchScore();

  useEffect(() => {
    if (match?.sets?.length > 0) {
      setSets(match.sets.map((s) => ({ home: s.home ?? "", away: s.away ?? "" })));
    } else {
      // Default to the tournament's configured number of sets (e.g. Best of 3 → 3 rows)
      setSets(Array.from({ length: maxSets }, () => ({ ...EMPTY_SET })));
    }
  }, [match?._id, maxSets]);

  const updateSet = (idx, field, value) => {
    const num = value === "" ? "" : Math.min(Number(value), winPt);
    setSets((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: num } : s)));
    setValidationError("");
  };

  const addSet = () => {
    if (sets.length < maxSets) setSets((prev) => [...prev, { ...EMPTY_SET }]);
  };

  const removeSet = (idx) => {
    if (sets.length > 1) setSets((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    setValidationError("");

    const parsed = sets.map((s) => ({ home: Number(s.home) || 0, away: Number(s.away) || 0 }));
    const activeSets = parsed.filter((s) => !(s.home === 0 && s.away === 0));

    if (activeSets.length === 0) {
      setValidationError("Enter at least one set score.");
      return;
    }

    if (activeSets.length > maxSets) {
      setValidationError(`Maximum ${maxSets} set${maxSets !== 1 ? "s" : ""} allowed.`);
      return;
    }

    for (let i = 0; i < activeSets.length; i++) {
      if (!isValidSet(activeSets[i], winPt, gap)) {
        setValidationError(
          `Set ${i + 1}: winner must reach ${winPt} points with a ${gap}-point lead.`
        );
        return;
      }
    }

    recordScore(
      { matchId: match._id, sets: activeSets, tournamentId },
      { onSuccess: (data) => { if (onScoreRecorded) onScoreRecorded(data); } }
    );
  };

  const isCompleted = match?.status === "completed";

  return (
    <div className="space-y-4">
      {/* Scoring rule hint */}
      {!isCompleted && (
        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
          Best of {maxSets} · Set won at {winPt} pts with {gap}-pt lead · First to {reqWins} set{reqWins !== 1 ? "s" : ""} wins
          {isEvenFormat && " · if sets split evenly, total points decide (a tie goes to a draw)"}
        </p>
      )}

      {/* Player labels */}
      <div className="flex items-center gap-4">
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-gray-700 truncate">
            {match?.player1Id?.name ?? "Player 1"}
            {match?.player1PartnerId && (
              <span className="text-gray-400"> / {match.player1PartnerId.name}</span>
            )}
          </p>
          <p className="text-xs text-gray-400">(Home)</p>
        </div>
        <span className="text-gray-300 font-bold text-lg">vs</span>
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-gray-700 truncate">
            {match?.player2Id?.name ?? "Player 2"}
            {match?.player2PartnerId && (
              <span className="text-gray-400"> / {match.player2PartnerId.name}</span>
            )}
          </p>
          <p className="text-xs text-gray-400">(Away)</p>
        </div>
      </div>

      {/* Sets */}
      <div className="space-y-2">
        {sets.map((set, idx) => (
          <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-xs text-gray-400 font-medium w-10 flex-shrink-0">
              Set {idx + 1}
            </span>
            <div className="flex items-center gap-2 flex-1 justify-center">
              <input
                type="number"
                min={0}
                max={winPt}
                value={set.home}
                onChange={(e) => updateSet(idx, "home", e.target.value)}
                disabled={isCompleted}
                className={inputCls}
                placeholder="—"
              />
              <span className="text-gray-300 font-bold">—</span>
              <input
                type="number"
                min={0}
                max={winPt}
                value={set.away}
                onChange={(e) => updateSet(idx, "away", e.target.value)}
                disabled={isCompleted}
                className={inputCls}
                placeholder="—"
              />
            </div>
            {!isCompleted && sets.length > 1 && (
              <button
                onClick={() => removeSet(idx)}
                className="p-1 rounded-lg hover:bg-red-50 text-red-300 hover:text-red-500 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add set button */}
      {!isCompleted && sets.length < maxSets && (
        <button
          onClick={addSet}
          className="flex items-center gap-1.5 text-sm text-teal-600 font-medium hover:text-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Set {sets.length + 1} of {maxSets}
        </button>
      )}

      {/* Validation error */}
      {validationError && (
        <div className="flex items-start gap-2 text-red-500 text-xs bg-red-50 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {validationError}
        </div>
      )}

      {/* Submit */}
      {!isCompleted ? (
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-60 transition-colors"
        >
          <Send className="w-4 h-4" />
          {isPending ? "Saving..." : "Record Score"}
        </button>
      ) : (
        <div className="space-y-2">
          <div
            className={`text-center text-sm font-semibold py-2.5 rounded-xl ${
              match?.isDraw ? "text-amber-600 bg-amber-50" : "text-green-600 bg-green-50"
            }`}
          >
            {match?.isDraw ? "Match completed — drawn on total points" : "Match completed — score locked"}
          </div>
          <button
            onClick={() => resetScore(match._id)}
            disabled={isResetting}
            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-50 disabled:opacity-60 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {isResetting ? "Resetting..." : "Edit Score"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ScoreEntry;
