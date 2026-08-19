import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const user = useSelector((state) => state.user.user);
  const navigate = useNavigate();

  // ✅ useEffect handles redirect safely
  useEffect(() => {
    if (!user) {
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
