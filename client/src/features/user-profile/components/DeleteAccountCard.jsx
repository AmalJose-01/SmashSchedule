import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";
import { deleteMyAccount } from "../services/userDetail.services.js";
import { logOut } from "../../../redux/slices/userSlice";

// "Danger zone" on the player profile: permanently delete the account.
// The player must type DELETE to confirm.
const DeleteAccountCard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: (res) => {
      toast.success(res?.message || "Your account has been deleted.");
      queryClient.clear();
      dispatch(logOut());
      navigate("/", { replace: true });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Could not delete your account"),
  });

  const close = () => {
    if (isPending) return;
    setOpen(false);
    setTyped("");
  };

  return (
    <>
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-red-500/30 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-white font-semibold">
          <AlertTriangle className="w-4 h-4 text-red-400" /> Delete account
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Permanently delete your account and your data: profile, club memberships and round robin registrations. This
          can&apos;t be undone.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500 hover:text-white transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Delete my account
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={close}>
          <div
            role="dialog"
            aria-label="Delete account"
            className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-white">Delete your account?</h3>
              <button onClick={close} className="text-slate-400 hover:text-white" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="mt-3 text-sm text-slate-300 list-disc pl-5 space-y-1">
              <li>Your login, profile and club memberships are deleted.</li>
              <li>You&apos;re removed from round robins that haven&apos;t been scheduled yet.</li>
              <li>In scheduled or finished round robins your name is replaced with &quot;Deleted player&quot; so other players&apos; results stay correct.</li>
              <li>Payment records are kept without your name, as required for tax and refunds. Entry fees already paid are not refunded automatically.</li>
            </ul>
            <label className="block mt-5 text-sm text-slate-300">
              Type <span className="font-mono font-semibold text-red-300">DELETE</span> to confirm
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              className="mt-1.5 w-full bg-slate-900/50 border border-slate-600 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={close} disabled={isPending} className="px-4 py-2.5 rounded-xl border border-slate-600 text-sm font-semibold text-slate-300 hover:bg-white/5">
                Cancel
              </button>
              <button
                onClick={() => mutate()}
                disabled={typed !== "DELETE" || isPending}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteAccountCard;
