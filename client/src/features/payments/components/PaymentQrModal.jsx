import { useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// Shows a Stripe Checkout link as a QR code: the player scans it with their
// phone and pays by card / Apple Pay / Google Pay. Closes itself once paid.
const PaymentQrModal = ({ open, onClose, url, playerName, amount, status }) => {
  const paid = status === "COMPLETED";

  useEffect(() => {
    if (!paid || !open) return;
    const t = setTimeout(onClose, 1800);
    return () => clearTimeout(t);
  }, [paid, open, onClose]);

  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Payment link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 text-center"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Entry fee payment"
      >
        <div className="flex items-start justify-between">
          <div className="text-left">
            <p className="text-white font-semibold">{playerName}</p>
            <p className="text-sm text-slate-400">Entry fee A${Number(amount || 0).toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {paid ? (
          <div className="py-10">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
            <p className="mt-3 text-emerald-300 font-semibold">Paid</p>
          </div>
        ) : (
          <>
            <div className="mt-5 inline-block rounded-xl bg-white p-3">
              <QRCodeSVG value={url} size={208} />
            </div>
            <p className="mt-3 text-sm text-slate-300">Ask the player to scan and pay on their phone.</p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-amber-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Waiting for payment…
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={copy} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5">
                <Copy className="w-3.5 h-3.5" /> Copy link
              </button>
              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5">
                <ExternalLink className="w-3.5 h-3.5" /> Pay on this device
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentQrModal;
