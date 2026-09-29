// AppBackground.jsx
// Shared dark gradient background (glowing blobs + subtle grid), matching the
// Business Directory home page. Wrap a page with it:
//
//   <AppBackground>
//     ...page content...
//   </AppBackground>
//
// The decorative layers are `fixed`, so they stay put while long pages
// scroll. The root deliberately avoids `overflow-hidden` — that would turn it
// into a scroll container and break the `sticky` page headers inside it.
// variant="admin" (default): cyan / emerald / blue glow.
// variant="user": green / yellow glow for the player-facing screens.
const THEMES = {
  admin: {
    bg: "from-slate-900 via-slate-800 to-slate-900",
    blobs: ["bg-cyan-500", "bg-emerald-500", "bg-blue-500"],
  },
  user: {
    bg: "from-slate-900 via-emerald-950 to-slate-900",
    blobs: ["bg-emerald-500", "bg-yellow-400", "bg-green-500"],
  },
};

const AppBackground = ({ children, className = "", variant = "admin" }) => {
  const t = THEMES[variant] ?? THEMES.admin;
  return (
  <div className={`relative isolate min-h-screen bg-gradient-to-br ${t.bg} ${className}`}>
    {/* Animated background blobs */}
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-30">
      <div className={`absolute top-20 left-10 w-72 h-72 ${t.blobs[0]} rounded-full mix-blend-multiply filter blur-3xl animate-pulse`} />
      <div
        className={`absolute top-40 right-10 w-72 h-72 ${t.blobs[1]} rounded-full mix-blend-multiply filter blur-3xl animate-pulse`}
        style={{ animationDelay: "2s" }}
      />
      <div
        className={`absolute -bottom-8 left-1/3 w-72 h-72 ${t.blobs[2]} rounded-full mix-blend-multiply filter blur-3xl animate-pulse`}
        style={{ animationDelay: "4s" }}
      />
    </div>

    {/* Grid pattern overlay */}
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"
    />

    {children}
  </div>
  );
};

export default AppBackground;
