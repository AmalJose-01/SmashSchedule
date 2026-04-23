import React, { useState, useEffect } from "react";
import { Plus, Minus, Send, AlertCircle } from "lucide-react";
import { useRecordMatchScore } from "../services/roundRobin.queries.js";

const EMPTY_SET = { home: "", away: "" };

const isValidSet = (set) => {
  const h = Number(set.home);
  const a = Number(set.away);
  if (h === 0 && a === 0) return true;           // empty set allowed
  if (h === a && h > 0) return false;            // no ties above 0
  return h >= 21 || a >= 21;                     // one side must reach 21
};

const inputCls =
  "w-16 text-center border border-gray-200 rounded-lg py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-300";

const ScoreEntry = ({ match, tournamentId, onScoreRecorded }) => {
  const [sets, setSets] = useState([{ ...EMPTY_SET }]);
  const [validationError, setValidationError] = useState("");

  const { mutate: recordScore, isPending } = useRecordMatchScore();

  // Pre-fill existing scores when match already has sets
  useEffect(() => {
    if (match?.sets?.length > 0) {
      setSets(match.sets.map((s) => ({ home: s.home ?? "", away: s.away ?? "" })));
    } else {
      setSets([{ ...EMPTY_SET }]);
    }
  }, [match?._id]);

  const updateSet = (idx, field, value) => {
    setSets((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
    setValidationError("");
  };

  const addSet = () => {
    if (sets.length < 3) setSets((prev) => [...prev, { ...EMPTY_SET }]);
  };

  const removeSet = (idx) => {
    if (sets.length > 1) setSets((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    setValidationError("");

    // Parse all, then drop trailing empty sets before sending
    const parsed = sets.map((s) => ({ home: Number(s.home) || 0, away: Number(s.away) || 0 }));
    const activeSets = parsed.filter((s) => !(s.home === 0 && s.away === 0));

    if (activeSets.length === 0) {
      setValidationError("Enter at least one set score.");
      return;
    }

    for (let i = 0; i < activeSets.length; i++) {
      if (!isValidSet(activeSets[i])) {
        setValidationError(
          `Set ${i + 1}: Invalid score — one player must reach 21, and scores cannot be equal.`
        );
        return;
      }
    }

    recordScore(
      { matchId: match._id, sets: activeSets, tournamentId },
      {
        onSuccess: (data) => {
          if (onScoreRecorded) onScoreRecorded(data);
        },
      }
    );
  };

  const isCompleted = match?.status === "completed";

  return (
    <div className="space-y-4">
      {/* Player labels */}
      <div className="flex items-center gap-4">
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-gray-700 truncate">
            {match?.player1Id?.name ?? "Player 1"}
          </p>
          <p className="text-xs text-gray-400">(Home)</p>
        </div>
        <span className="text-gray-300 font-bold text-lg">vs</span>
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-gray-700 truncate">
            {match?.player2Id?.name ?? "Player 2"}
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
      {!isCompleted && sets.length < 3 && (
        <button
          onClick={addSet}
          className="flex items-center gap-1.5 text-sm text-teal-600 font-medium hover:text-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Set
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
        <div className="text-center text-sm text-green-600 font-semibold bg-green-50 py-2.5 rounded-xl">
          Match completed — score locked
        </div>
      )}
    </div>
  );
};

export default ScoreEntry;
