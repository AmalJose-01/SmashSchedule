// MasterRoutes.jsx — master admin console (unlisted: not linked from the public pages)
import { Navigate, Route } from "react-router-dom";
import MasterProtectedRoute from "../components/MasterProtectedRoute";
import ErrorBoundary from "../components/ErrorBoundary";
import MasterLogin from "../features/master/pages/MasterLogin";
import MasterConsole from "../features/master/pages/MasterConsole";
import MasterHandoff from "../features/master/pages/MasterHandoff";

const MasterRoutes = () => (
  <>
    <Route path="/master" element={<Navigate to="/master/console" replace />} />
    <Route path="/master/login" element={<MasterLogin />} />
    <Route
      path="/master/console"
      element={
        <MasterProtectedRoute>
          <ErrorBoundary>
            <MasterConsole />
          </ErrorBoundary>
        </MasterProtectedRoute>
      }
    />
    {/* Public on purpose: it only consumes the one-time token in the URL fragment. */}
    <Route path="/master/handoff" element={<MasterHandoff />} />
  </>
);

export default MasterRoutes;
