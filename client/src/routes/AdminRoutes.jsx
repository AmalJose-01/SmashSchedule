// AdminRoutes.jsx
import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import SetupTournament from "../pages/admin/SetupTournament";
import MatchHome from "../pages/admin/MatchHome";
import KnockoutFixtures from "../pages/admin/KnockoutFixtures";
import { useSelector } from "react-redux";
import Login from "../pages/admin/Login";
import CreateTournament from "../pages/admin/CreateTournament";
import AdminTournamentList from "../pages/admin/AdminTournamentList";
import EditTournament from "../pages/admin/EditTournament";
import EditTeam from "../pages/admin/EditTeam";
import AdminHome from "../pages/admin/AdminHome";
import CreateSession from "../pages/admin/CreateSession";
import CreatePlayType from "../pages/admin/CreatePlayType";

const AdminRoutes = () => {
  const user = useSelector((state) => state.user.user);

  return (
    <>
      <Route
        path="/admin-home"
        element={
          <ProtectedRoute role="admin">
            <AdminHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-session"
        element={
          <ProtectedRoute role="admin">
            <CreateSession />
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-play-type"
        element={
          <ProtectedRoute role="admin">
            <CreatePlayType />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tournament-list"
        element={
          <ProtectedRoute role="admin">
            <AdminTournamentList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/setup-tournament"
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
        path="/create-tournament"
        element={
          <ProtectedRoute role="admin">
            <CreateTournament />
          </ProtectedRoute>
        }
      />

      <Route
        path="/edit-tournament"
        element={
          <ProtectedRoute role="admin">
            <EditTournament />
          </ProtectedRoute>
        }
      />

      <Route
        path="/edit-team"
        element={
          <ProtectedRoute role="admin">
            <EditTeam />
          </ProtectedRoute>
        }
      />

      <Route
        path="/login"
        element={
          !user ? (
            <Login />
          ) : user.accountType === "admin" && !user.isVerified ? (
            <Navigate to="/checkout" replace />
          ) : (
            <Navigate to="/admin-home" replace />
          )
        }
      />



      {/* Add more admin routes here */}
    </>
  );
};

export default AdminRoutes;
