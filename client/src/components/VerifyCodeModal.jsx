import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";

export default function VerifyCodeModal({ open, onClose}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
 const tournamentData = useSelector(
    (state) => state.tournament.tournamentData
  );
  const handleVerify = () => {
    if (code.length !== 4) {
      setError("Enter 4-digit code");
      return;
    }

    // 🔐 Example verification (replace with API)
    if (code === tournamentData.uniqueKey) {
      onClose();
      

                        navigate(`/groupStageList/${tournamentData?._id}`);
      // navigate("/score-board");
    } else {
      setError("Invalid code");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-2xl border border-slate-700/60 bg-slate-800/90 backdrop-blur-xl shadow-2xl p-6 text-center"
      >
        <div className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
          Enter 4-Digit Code
        </h2>
        <p className="text-xs text-slate-400 mb-4">Ask the organiser for the tournament code.</p>

        <input
          type="password"
          inputMode="numeric"
          autoFocus
          maxLength={4}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ""));
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          className={`w-full text-center text-2xl tracking-[0.5em] bg-slate-900/60 border rounded-xl py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
            error ? "border-red-500" : "border-slate-600"
          }`}
        />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 bg-white/5 text-sm font-medium text-slate-200 hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-yellow-500 hover:from-emerald-600 hover:to-yellow-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/30 transition-all"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}
