// Decorative racket-sport artwork for the home page (pure SVG, no images).
import { ShuttlecockIcon } from "../../components/RallixLogo";

// A badminton racket: oval head with string grid, throat and grip.
export const Racket = ({ className = "", stroke = "currentColor" }) => (
  <svg viewBox="0 0 120 300" fill="none" className={className} aria-hidden="true">
    <defs>
      <clipPath id="racket-head">
        <ellipse cx="60" cy="72" rx="46" ry="62" />
      </clipPath>
    </defs>
    {/* strings */}
    <g clipPath="url(#racket-head)" stroke={stroke} strokeWidth="1.2" opacity="0.55">
      {Array.from({ length: 11 }, (_, i) => (
        <line key={`v${i}`} x1={14 + i * 9.2} y1="5" x2={14 + i * 9.2} y2="140" />
      ))}
      {Array.from({ length: 15 }, (_, i) => (
        <line key={`h${i}`} x1="10" y1={12 + i * 8.6} x2="110" y2={12 + i * 8.6} />
      ))}
    </g>
    {/* frame */}
    <ellipse cx="60" cy="72" rx="46" ry="62" stroke={stroke} strokeWidth="6" />
    {/* throat + shaft */}
    <path d="M44 128 L58 170 M76 128 L62 170" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
    <line x1="60" y1="168" x2="60" y2="232" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
    {/* grip */}
    <rect x="52" y="230" width="16" height="62" rx="6" fill={stroke} opacity="0.9" />
    <path d="M52 242 l16 -6 M52 256 l16 -6 M52 270 l16 -6 M52 284 l16 -6" stroke="#0f172a" strokeWidth="2" opacity="0.5" />
  </svg>
);

// A rally: two rackets with a shuttle flying between them along an arc.
export const RallyScene = ({ className = "" }) => (
  <div className={`relative ${className}`} aria-hidden="true">
    <svg viewBox="0 0 520 260" className="w-full h-auto overflow-visible">
      <defs>
        <linearGradient id="trail" x1="0" x2="1">
          <stop offset="0" stopColor="#34d399" stopOpacity="0" />
          <stop offset="0.5" stopColor="#a3e635" stopOpacity="0.8" />
          <stop offset="1" stopColor="#facc15" stopOpacity="0" />
        </linearGradient>
        <path id="rally-path" d="M70 190 Q 260 -40 450 190" />
        <pattern id="net" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 0 L6 6 M6 0 L0 6" stroke="white" strokeOpacity="0.5" strokeWidth="0.8" />
        </pattern>
      </defs>
      {/* flight arc */}
      <use href="#rally-path" fill="none" stroke="url(#trail)" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
      {/* net */}
      <line x1="260" y1="150" x2="260" y2="250" stroke="white" strokeOpacity="0.35" strokeWidth="3" />
      <rect x="252" y="150" width="16" height="44" fill="url(#net)" opacity="0.5" />
      {/* floor */}
      <line x1="10" y1="250" x2="510" y2="250" stroke="white" strokeOpacity="0.2" strokeWidth="2" />
      {/* shuttle flying back and forth */}
      <g>
        <g transform="translate(-14 -14)">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fde047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 3h11l-3.5 11.5h-4z" />
            <path d="M10 3l1 11.5M14 3l-1 11.5" />
            <path d="M8.2 8.6h7.6" />
            <path d="M10 14.5h4v2a2 2 0 0 1-4 0z" fill="#fde047" />
          </svg>
        </g>
        <animateMotion dur="2.6s" repeatCount="indefinite" rotate="auto" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1">
          <mpath href="#rally-path" />
        </animateMotion>
      </g>
    </svg>
    {/* rackets at each end */}
    <Racket className="absolute left-[2%] bottom-0 w-[16%] -rotate-[35deg] origin-bottom text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
    <Racket className="absolute right-[2%] bottom-0 w-[16%] rotate-[35deg] origin-bottom text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]" />
  </div>
);

// Court seen in perspective, glowing lines, sitting at the bottom of the page.
export const PerspectiveCourt = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-x-0 bottom-0 h-[55vh] -z-10 overflow-hidden [perspective:900px]"
  >
    <div className="absolute left-1/2 bottom-[-35%] w-[900px] max-w-[160vw] h-[140%] -translate-x-1/2 origin-bottom [transform:rotateX(62deg)]">
      <svg viewBox="0 0 610 1340" preserveAspectRatio="none" className="w-full h-full" fill="none">
        <defs>
          <linearGradient id="court-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#34d399" stopOpacity="0" />
            <stop offset="0.5" stopColor="#34d399" stopOpacity="0.35" />
            <stop offset="1" stopColor="#facc15" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="610" height="1340" fill="#065f46" fillOpacity="0.15" />
        <g stroke="url(#court-fade)" strokeWidth="5">
          <rect x="5" y="5" width="600" height="1330" />
          <line x1="51" y1="5" x2="51" y2="1335" />
          <line x1="559" y1="5" x2="559" y2="1335" />
          <line x1="5" y1="81" x2="605" y2="81" />
          <line x1="5" y1="1259" x2="605" y2="1259" />
          <line x1="5" y1="472" x2="605" y2="472" />
          <line x1="5" y1="868" x2="605" y2="868" />
          <line x1="305" y1="5" x2="305" y2="472" />
          <line x1="305" y1="868" x2="305" y2="1335" />
        </g>
        <line x1="0" y1="670" x2="610" y2="670" stroke="white" strokeOpacity="0.35" strokeWidth="10" strokeDasharray="14 10" />
      </svg>
    </div>
  </div>
);

// Small shuttles drifting in the background.
export const FloatingShuttles = () => (
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    {[
      { pos: "top-[12%] left-[8%] w-10", rot: "-rotate-[20deg]", color: "text-emerald-300/20" },
      { pos: "top-[20%] right-[10%] w-14", rot: "rotate-[25deg]", color: "text-yellow-300/20" },
      { pos: "top-[52%] left-[4%] w-8", rot: "rotate-[40deg]", color: "text-lime-300/15" },
      { pos: "top-[40%] right-[4%] w-9", rot: "-rotate-[35deg]", color: "text-emerald-300/15" },
    ].map(({ pos, rot, color }, i) => (
      // outer span floats (animated transform), inner span holds the tilt
      <span key={i} className={`absolute animate-float ${pos}`} style={{ animationDelay: `${i * 1.3}s` }}>
        <span className={`block ${rot} ${color}`}>
          <ShuttlecockIcon className="w-full h-auto" strokeWidth={1.4} />
        </span>
      </span>
    ))}
  </div>
);
