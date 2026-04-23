import { Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useUserSignup } from "../hooks/useUserSignup.js";
import "./UserSignup.css";

const UserSignup = () => {
  const {
    formData,
    showPassword,
    showConfirmPassword,
    isLoading,
    setShowPassword,
    setShowConfirmPassword,
    handleInputChange,
    handleSubmit,
  } = useUserSignup();

  return (
    <div className="signup-wrapper">
      <div className="signup-card">
        {/* Header */}
        <div className="signup-header">
          <User size={64} color="#ffffff" />
          <h2>Create Account</h2>
          <p>Sign up to get started with Club Hero</p>
        </div>

        {/* Body */}
        <div className="signup-body">
          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="signup-field">
              <label>
                <Mail size={14} />
                Email Address
              </label>
              <div className="signup-input-wrap">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="signup-field">
              <label>
                <Lock size={14} />
                Password
              </label>
              <div className="signup-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Min 8 chars, upper, lower, number, special"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="signup-field">
              <label>
                <Lock size={14} />
                Confirm Password
              </label>
              <div className="signup-input-wrap">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="signup-submit" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <div className="signup-footer">
            Already have an account?{" "}
            <Link to="/user/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSignup;
