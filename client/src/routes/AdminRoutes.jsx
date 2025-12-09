// AdminRoutes.jsx
import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import SetupTournament from "../pages/admin/SetupTournament";
import MatchHome from "../pages/admin/MatchHome";
import KnockoutFixtures from "../pages/admin/KnockoutFixtures";
import { useSelector } from "react-redux";
import Login from "../pages/admin/Login";

const AdminRoutes = () => {
  const user = useSelector((state) => state.user.user);

  return (
    <>
      <Route
        path="/create-tournament"
        element={
          <ProtectedRoute role="admin">
            <SetupTournament />
          </ProtectedRoute>
        }
      />
      <Route
        path="/match/:tournamentId"
        element={
          <ProtectedRoute role="admin">
            <MatchHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/knockout"
        element={
          <ProtectedRoute role="admin">
            <KnockoutFixtures />
          </ProtectedRoute>
        }
      />

      <Route
        path="/login"
        element={
          !user ? <Login /> : <Navigate to="/create-tournament" replace />
          // !user ? <Login /> : <Navigate to="/checkout" replace />
        }
      />

      {/* Add more admin routes here */}
    </>
  );
};

export default AdminRoutes;
