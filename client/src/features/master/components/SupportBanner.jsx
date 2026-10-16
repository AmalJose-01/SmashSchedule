import { useDispatch, useSelector } from "react-redux";
import { ShieldAlert, X } from "lucide-react";
import { logOut } from "../../../redux/slices/userSlice";
import { getSupportMode } from "../services/supportMode";

// Always-visible reminder that a master is acting inside a club's account.
// Shown only in the tab opened by "Open as admin" (sessionStorage flag) while
// that club-admin session is active.
const SupportBanner = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const info = getSupportMode();
  if (!user || !info) return null;

  const exit = () => {
    dispatch(logOut()); // also clears the support-mode flag
    window.close(); // works for tabs opened by the console
    setTimeout(() => {
      window.location.href = "/master/console"; // still here → tab wasn't script-opened
    }, 250);
  };

  const until = info.expiresAt
    ? new Date(info.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <>
      <div aria-hidden="true" className="fixed top-0 inset-x-0 h-1 bg-rose-500 z-[60]" />
      <div
        role="status"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-xl flex items-center gap-3 rounded-2xl bg-rose-600/95 text-white shadow-2xl shadow-black/40 border border-rose-300/30 backdrop-blur px-4 py-3"
      >
        <ShieldAlert className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm leading-snug min-w-0 flex-1">
          <span className="font-semibold">Support mode</span> — viewing{" "}
          <span className="font-semibold">{info.clubName || info.adminEmail}</span> as admin
          {until ? <span className="opacity-80"> · expires {until}</span> : null}
        </p>
        <button
          type="button"
          onClick={exit}
          className="inline-flex items-center gap-1 flex-shrink-0 px-3 py-1.5 rounded-xl bg-white text-rose-700 text-sm font-semibold hover:bg-rose-50"
        >
          <X className="w-4 h-4" /> Exit
        </button>
      </div>
    </>
  );
};

export default SupportBanner;
