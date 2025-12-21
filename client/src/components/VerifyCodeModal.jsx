import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-80">
        <h2 className="text-lg font-semibold mb-4">Enter 4-Digit Code</h2>

        <input
          type="password"
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="w-full text-center text-2xl tracking-widest border rounded-lg p-2"
        />

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 border rounded-lg py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}
