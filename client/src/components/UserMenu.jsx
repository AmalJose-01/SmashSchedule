// UserMenu.jsx
// Single avatar button in the top bar that combines "My Profile" and
// "Log out" in one dropdown (used on the player-facing pages).
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { User, LogOut, ChevronDown } from "lucide-react";
import { logOut } from "../redux/slices/userSlice";

const UserMenu = ({ profilePath = "/user/profile" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.name || "Player";
  const email = user?.emailID || user?.email || "";
  const initials =
    fullName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P";

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleLogout = () => {
    dispatch(logOut());
    navigate("/");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 h-10 pl-1 pr-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-400/40 transition-all"
      >
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-yellow-400 text-slate-900 text-xs font-bold">
          {initials}
        </span>
        <span className="hidden sm:block max-w-[120px] truncate text-sm font-medium text-slate-200">{fullName}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl bg-slate-800/95 backdrop-blur-xl border border-slate-700/60 shadow-2xl shadow-black/40 z-50"
        >
          <div className="px-4 py-3 border-b border-slate-700/60">
            <p className="text-sm font-semibold text-white truncate">{fullName}</p>
            {email && <p className="text-xs text-slate-400 truncate">{email}</p>}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate(profilePath);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-emerald-500/10 hover:text-white transition-colors"
          >
            <User className="w-4 h-4 text-emerald-400" /> My Profile
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200 border-t border-slate-700/60 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
