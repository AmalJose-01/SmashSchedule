import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { CameraOff, Loader2 } from "lucide-react";

/**
 * Live camera QR scanner. Uses the browser's native BarcodeDetector when
 * available (fast, Chrome/Android) and falls back to jsQR on a canvas
 * (works everywhere, incl. iOS Safari). Calls onResult(text) once.
 * Camera access needs https (or localhost).
 */
const QrScanner = ({ onResult, onError }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("starting"); // starting | scanning | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let stream;
    let rafId;
    let stopped = false;
    let detector = null;

    const fail = (msg) => {
      if (stopped) return;
      setStatus("error");
      setErrorMsg(msg);
      onError?.(msg);
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        fail("Camera isn't available in this browser. Type the club key instead.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch (err) {
        fail(
          err?.name === "NotAllowedError"
            ? "Camera permission was blocked. Allow camera access, or type the club key instead."
            : "Couldn't open the camera. Type the club key instead."
        );
        return;
      }
      if (stopped) return;

      const video = videoRef.current;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true"); // iOS: don't go fullscreen
      await video.play().catch(() => {});

      if ("BarcodeDetector" in window) {
        try {
          const formats = await window.BarcodeDetector.getSupportedFormats?.();
          if (!formats || formats.includes("qr_code")) {
            detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          }
        } catch {
          detector = null;
        }
      }

      setStatus("scanning");
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      const tick = async () => {
        if (stopped) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          let text = null;
          if (detector) {
            try {
              const codes = await detector.detect(video);
              text = codes?.[0]?.rawValue ?? null;
            } catch {
              detector = null; // fall back to jsQR from now on
            }
          } else {
            const w = video.videoWidth;
            const h = video.videoHeight;
            if (w && h) {
              // Downscale for speed — QR codes decode fine at ~640px.
              const scale = Math.min(1, 640 / Math.max(w, h));
              canvas.width = Math.round(w * scale);
              canvas.height = Math.round(h * scale);
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
              text = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" })?.data ?? null;
            }
          }
          if (text && !stopped) {
            stopped = true;
            onResult(text);
            return;
          }
        }
        rafId = requestAnimationFrame(tick);
      };
      tick();
    };

    start();
    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // onResult/onError intentionally not deps — the scanner runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto overflow-hidden rounded-2xl bg-slate-950 border border-slate-700/60">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />

      {status === "scanning" && (
        <>
          {/* viewfinder */}
          <div className="absolute inset-[15%] rounded-2xl border-2 border-emerald-400/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.45)]" />
          <div className="absolute left-[15%] right-[15%] top-1/2 h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent animate-pulse" />
          <p className="absolute bottom-3 inset-x-0 text-center text-xs text-slate-200">Point the camera at the club&apos;s QR code</p>
        </>
      )}

      {status === "starting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
          <p className="text-sm">Starting camera…</p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <CameraOff className="w-8 h-8 text-slate-500" />
          <p className="text-sm text-slate-300">{errorMsg}</p>
        </div>
      )}
    </div>
  );
};

export default QrScanner;
