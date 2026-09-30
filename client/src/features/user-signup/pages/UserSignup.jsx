import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Shield, User, Check } from "lucide-react";
import AppBackground from "../../../components/AppBackground";
import { useUserSignup } from "../hooks/useUserSignup.js";

// Same look as the sign-in page: admin = cyan/blue, player = green/yellow.
const THEME = {
  admin: {
    ring: "focus:ring-cyan-500",
    icon: "from-cyan-400 to-blue-500 shadow-cyan-500/50",
    button: "from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-cyan-500/30 hover:shadow-cyan-500/50 text-white",
    link: "text-cyan-400 hover:text-cyan-300",
    ok: "text-cyan-300",
  },
  user: {
    ring: "focus:ring-emerald-400",
    icon: "from-emerald-400 to-yellow-400 shadow-emerald-500/50",
    button: "from-emerald-400 via-lime-300 to-yellow-300 shadow-emerald-500/30 hover:shadow-emerald-400/60 text-slate-900",
    link: "text-emerald-400 hover:text-emerald-300",
    ok: "text-emerald-300",
  },
};

const inputCls = (ring) =>
  `w-full pl-12 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${ring} focus:border-transparent transition-all`;

// Live password checklist (same rules the form validates on submit).
const RULES = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "Uppercase", test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase", test: (p) => /[a-z]/.test(p) },
  { label: "Number", test: (p) => /\d/.test(p) },
  { label: "Symbol (@$!%*?&)", test: (p) => /[@$!%*?&]/.test(p) },
];

const PasswordField = ({ id, label, name, value, onChange, show, onToggle, placeholder, ring }) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-slate-300">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Lock className="w-5 h-5 text-slate-400" />
      </div>
      <input
        id={id}
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="new-password"
        className={inputCls(ring) + " pr-12"}
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-300 transition-colors"
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  </div>
);

const UserSignup = () => {
  const {
    formData,
    showPassword,
    showConfirmPassword,
    isLoading,
    isAdmin,
    setShowPassword,
    setShowConfirmPassword,
    handleInputChange,
    handleSubmit,
  } = useUserSignup();

  const accountType = isAdmin ? "admin" : "user";
  const t = THEME[accountType];
  const HeaderIcon = isAdmin ? Shield : User;
  const pwd = formData.password || "";
  const confirmMismatch = formData.confirmPassword && formData.confirmPassword !== pwd;

  return (
    <AppBackground variant={accountType} className="flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${t.icon} mb-4 shadow-lg`}>
            <HeaderIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
            {isAdmin ? "Create Admin Account" : "Create Player Account"}
          </h1>
          <p className="text-slate-400">
            {isAdmin ? "Sign up to manage your club on Rallix" : "Join Rallix to find your club and see your matches"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-slate-300">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={isAdmin ? "admin@yourclub.com" : "you@example.com"}
                  autoComplete="email"
                  className={inputCls(t.ring) + " pr-4"}
                />
              </div>
            </div>

            <PasswordField
              id="password"
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              placeholder="Create a password"
              ring={t.ring}
            />

            {/* Password checklist */}
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 -mt-2">
              {RULES.map(({ label, test }) => {
                const ok = test(pwd);
                return (
                  <li key={label} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? t.ok : "text-slate-500"}`}>
                    <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border ${ok ? "border-current" : "border-slate-600"}`}>
                      {ok && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                    </span>
                    {label}
                  </li>
                );
              })}
            </ul>

            <div>
              <PasswordField
                id="confirmPassword"
                label="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                show={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((v) => !v)}
                placeholder="Re-enter your password"
                ring={t.ring}
              />
              {confirmMismatch && <p className="text-red-400 text-sm mt-2">Passwords don&apos;t match yet</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 bg-gradient-to-r ${t.button} font-semibold rounded-xl transition-all duration-200 shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-center text-slate-400">
              Already have an account?{" "}
              <Link to={isAdmin ? "/admin/login" : "/user/login"} className={`${t.link} font-semibold transition-colors`}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AppBackground>
  );
};

export default UserSignup;
