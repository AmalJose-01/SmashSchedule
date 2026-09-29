import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { rememberRedirect } from "../utils/postLoginRedirect";

const ProtectedRoute = ({ children, role }) => {
  const user = useSelector((state) => state.user.user);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ useEffect handles redirect safely
  useEffect(() => {
    if (!user) {
      // e.g. a scanned club QR opened while logged out — come back after login
      if (role === "user") rememberRedirect(location.pathname + location.search);
      navigate("/", { replace: true });
    }
  }, [user]);

  // While redirecting, render nothing
  if (!user) return null;

  // Role-based redirect
  if (role && user.accountType !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
