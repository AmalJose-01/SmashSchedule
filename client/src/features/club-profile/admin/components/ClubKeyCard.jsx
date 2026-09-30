import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { KeyRound, Copy, Download, Share2, QrCode, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGenerateClubCode } from "../services/clubProfile.queries.js";

// Link a player lands on after scanning — the club search page looks the
// club up by its key straight away.
const buildClubJoinLink = (code) => `${window.location.origin}/user/find-club?code=${code}`;

const copyText = async (text, label) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Couldn't copy — please copy it manually");
  }
};

const ClubKeyCard = ({ club }) => {
  const qrRef = useRef(null);
  const { mutate: generate, isPending } = useGenerateClubCode();
  const code = club?.clubCode;
  const link = code ? buildClubJoinLink(code) : "";

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${(club?.name || "club").replace(/\s+/g, "_")}_${code}_QR.png`;
    a.click();
  };

  const share = async () => {
    const text = `Join ${club?.name || "our club"} on Rallix — club key: ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: club?.name || "Club key", text, url: link });
      } catch {
        /* user closed the share sheet */
      }
    } else {
      copyText(`${text}\n${link}`, "Invite");
    }
  };

  return (
    <div className="cp-section-card">
      <h2 className="cp-section-title">
        <KeyRound className="w-5 h-5 text-cyan-400" /> Club Key &amp; QR Code
      </h2>

      {!code ? (
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900/60 border border-slate-700/60">
            <QrCode className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-400 text-sm max-w-sm">
            Your club doesn&apos;t have a key yet. Generate one so players can find your club by
            typing the key or scanning its QR code.
          </p>
          <button type="button" className="btn-edit-profile inline-flex items-center gap-2" onClick={() => generate()} disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {isPending ? "Generating..." : "Generate Club Key"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* QR */}
          <div ref={qrRef} className="flex-shrink-0 p-3 bg-white rounded-2xl shadow-lg shadow-cyan-500/20">
            <QRCodeCanvas value={link} size={168} level="M" marginSize={1} />
          </div>

          {/* Key + actions */}
          <div className="flex-1 w-full min-w-0 space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Club key</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl sm:text-3xl font-bold tracking-[0.3em] text-white bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2 select-all">
                  {code}
                </span>
                <button
                  type="button"
                  onClick={() => copyText(code, "Club key")}
                  title="Copy key"
                  className="p-2.5 rounded-xl bg-white/5 border border-slate-600 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Players can type this key in club search, or scan the QR code to open your club directly.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-edit-profile inline-flex items-center gap-2" onClick={share}>
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button type="button" className="btn-secondary !flex-none inline-flex items-center gap-2" onClick={() => copyText(link, "Link")}>
                <Copy className="w-4 h-4" /> Copy link
              </button>
              <button type="button" className="btn-secondary !flex-none inline-flex items-center gap-2" onClick={downloadQr}>
                <Download className="w-4 h-4" /> Download QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubKeyCard;
