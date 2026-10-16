import { Navigate } from "react-router-dom";
import { useMasterSession } from "../features/master/services/masterSession";

// Gate for /master/* pages: needs a master session (separate from the normal login).
const MasterProtectedRoute = ({ children }) => {
  const session = useMasterSession();
  if (!session) return <Navigate to="/master/login" replace />;
  return children;
};

export default MasterProtectedRoute;
