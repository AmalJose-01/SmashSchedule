import React, { useEffect } from "react";
import { AlertTriangle, HelpCircle, Loader2 } from "lucide-react";

// Confirm dialog in the app's dark glass style.
// danger → red icon + red confirm button (deletes); otherwise cyan.
// Closes on Escape or a click on the backdrop (unless loading).
const AlertView = ({
  isOpen,
  title = "Are you sure?",
  message = "Do you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  danger = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && !loading && onCancel?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const Icon = danger ? AlertTriangle : HelpCircle;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={() => !loading && onCancel?.()}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-slate-700/60 bg-slate-800/90 backdrop-blur-xl shadow-2xl shadow-black/40 p-6 text-center"
      >
        <div
          className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center border ${
            danger
              ? "bg-red-500/15 border-red-500/30 text-red-400"
              : "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>

        <h2 id="alert-title" className="text-lg font-semibold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
          {title}
        </h2>
        <p className="text-sm text-slate-300 mb-6">{message}</p>

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 bg-white/5 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white disabled:opacity-40 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            autoFocus
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-60 ${
              danger
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/30"
                : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-cyan-500/30"
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertView;
