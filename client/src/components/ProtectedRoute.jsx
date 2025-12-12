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
  }, [user, navigate]);

  // While redirecting, render nothing
  if (!user) return null;

  // Role-based redirect
  if (role && user.accountType !== role) {
    return <Navigate to="/not-authorized" replace />;
  }
   // Admin but NOT verified → redirect to checkout
  if (user.accountType === "admin" && !user.isVerified) {
    return <Navigate to="/checkout" replace />;
  }


  return children;
};

export default ProtectedRoute;
