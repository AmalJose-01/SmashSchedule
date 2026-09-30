// Rallix brand mark: a shuttlecock. `className` sizes/colours it (it uses
// currentColor). Kept as an inline SVG so it inherits theme colours.
export const ShuttlecockIcon = ({ className = "w-6 h-6", strokeWidth = 1.8 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <g transform="rotate(-30 12 12)">
      {/* feather skirt */}
      <path d="M6.5 3h11l-3.5 11.5h-4z" />
      <path d="M10 3l1 11.5M14 3l-1 11.5" />
      <path d="M8.2 8.6h7.6" />
      {/* cork */}
      <path d="M10 14.5h4v2a2 2 0 0 1-4 0z" />
    </g>
  </svg>
);

// App icon — the "Rallix" name is part of the artwork (same file as the
// browser tab / home-screen icon, public/rallix.svg), so no separate text.
const RallixLogo = ({ size = "md", variant = "user" }) => {
  const tile = { sm: "w-10 h-10 rounded-xl", md: "w-16 h-16 rounded-2xl", lg: "w-20 h-20 rounded-3xl" }[size];
  const glow = variant === "admin" ? "shadow-cyan-500/40" : "shadow-emerald-500/40";
  return <img src="/rallix.svg" alt="Rallix" className={`${tile} shadow-lg ${glow}`} draggable="false" />;
};

export default RallixLogo;
