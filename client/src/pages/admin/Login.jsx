import { Link, useLocation } from "react-router-dom";
import validationSchema from "../../../utils/validationSchemas";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import { useLogin } from "../../hooks/useLogin";
import { useGoogleLogin } from "../../hooks/useGoogleLogin";
import { Lock, Mail, Eye, EyeOff, Shield, User } from "lucide-react";
import AppBackground from "../../components/AppBackground";

// Admin = cyan/blue, user (player) = green/yellow.
const THEME = {
  admin: {
    ring: "focus:ring-cyan-500",
    icon: "from-cyan-400 to-blue-500 shadow-cyan-500/50",
    button: "from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-cyan-500/30 hover:shadow-cyan-500/50",
    link: "text-cyan-400 hover:text-cyan-300",
    check: "text-cyan-500 focus:ring-cyan-500",
  },
  user: {
    ring: "focus:ring-emerald-400",
    icon: "from-emerald-400 to-yellow-400 shadow-emerald-500/50",
    button: "from-emerald-500 to-yellow-500 hover:from-emerald-600 hover:to-yellow-600 shadow-emerald-500/30 hover:shadow-emerald-500/50",
    link: "text-emerald-400 hover:text-emerald-300",
    check: "text-emerald-500 focus:ring-emerald-400",
  },
};

const inputCls = (hasError, ring) =>
  `w-full pl-12 py-3 bg-slate-900/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${ring} focus:border-transparent transition-all ${
    hasError ? "border-red-500" : "border-slate-600"
  }`;

const Spinner = ({ className = "" }) => (
  <svg className={`animate-spin h-5 w-5 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const Login = () => {
  const schema = validationSchema.pick(["email", "password"]);
  const { handleLogin, isLoading } = useLogin();
  const { handleLoginWithGoogle, isLoading: isGoogleLoading } = useGoogleLogin();
  const [showPassword, setShowPassword] = useState(false);

  const location = useLocation();
  // Same page serves both /admin/login and /user/login.
  const isAdmin = location.pathname === "/admin/login";
  const accountType = isAdmin ? "admin" : "user";
  const t = THEME[accountType];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onClickLoginWithGoogle = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      handleLoginWithGoogle({
        email: decoded.email,
        firstName: decoded.given_name,
        lastName: decoded.family_name,
        googleId: decoded.sub,
        accountType,
      });
    } catch (error) {
      console.log("Login", error);
      alert(error.response?.data?.message || "Login failed");
    }
  };

  const onSubmit = (data) => {
    handleLogin({ ...data, accountType });
  };

  const HeaderIcon = isAdmin ? Shield : User;

  return (
    <AppBackground variant={accountType} className="flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${t.icon} mb-4 shadow-lg`}>
            <HeaderIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
            {isAdmin ? "Admin Portal" : "Player Portal"}
          </h1>
          <p className="text-slate-400">Sign in to access your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  className={inputCls(errors.email, t.ring) + " pr-4"}
                  placeholder={isAdmin ? "admin@example.com" : "you@example.com"}
                />
              </div>
              {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-slate-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                  className={inputCls(errors.password, t.ring) + " pr-12"}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-sm">{errors.password.message}</p>}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  className={`w-4 h-4 rounded border-slate-600 bg-slate-900/50 focus:ring-2 focus:ring-offset-0 cursor-pointer ${t.check}`}
                />
                <span className="ml-2 text-slate-300 group-hover:text-white transition-colors">Remember me</span>
              </label>
              <Link to="/forgot-password" className={`${t.link} transition-colors`}>
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 bg-gradient-to-r ${t.button} text-white rounded-xl transition-all duration-200 shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Spinner className="-ml-1 mr-3 text-white" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 border-t border-slate-700/50" />
            <span className="text-slate-400">Or continue with</span>
            <div className="flex-1 border-t border-slate-700/50" />
          </div>

          {/* Google Login — uses the real Google Identity button (required
              to get a credential), styled to match the white pill in the design. */}
          <div className="flex justify-center">
            {isGoogleLoading ? (
              <div className="w-full py-3 px-4 bg-white text-slate-900 rounded-xl flex items-center justify-center gap-3">
                <Spinner className="text-slate-900" />
                <span>Signing in with Google...</span>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={onClickLoginWithGoogle}
                onError={() => console.log("Login Failed")}
                theme="outline"
                size="large"
                shape="pill"
                text="continue_with"
                width="320"
              />
            )}
          </div>

          {/* Sign up */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-center text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                to={isAdmin ? "/admin/signup" : "/user/signup"}
                className={`${t.link} transition-colors`}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-slate-500 mt-6">Protected by enterprise-grade security</p>
      </div>
    </AppBackground>
  );
};

export default Login;
