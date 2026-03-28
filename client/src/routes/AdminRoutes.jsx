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
import Dashboard from "../pages/admin/Dashboard";
import AdminMembershipDashboard from "../features/membership/admin/pages/AdminMembershipDashboard";
import MembershipTypeManagement from "../features/membership-type/pages/MembershipTypeManagement";
import ClubProfile from "../features/club-profile/admin/pages/ClubProfile";
import AdminMembersList from "../features/admin-memberslist/pages/AdminMembersList";

const AdminRoutes = () => {
  const user = useSelector((state) => state.user.user);

  return (
    <>
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="admin">
            <Dashboard />
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
        path="/admin-membership"
        element={
          <ProtectedRoute role="admin">
            <AdminMembershipDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/membership-types"
        element={
          <ProtectedRoute role="admin">
            <MembershipTypeManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/club-profile"
        element={
          <ProtectedRoute role="admin">
            <ClubProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/members-list"
        element={
          <ProtectedRoute role="admin">
            <AdminMembersList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/login"
        element={
          !user || user.accountType !== "admin" ? (
            <Login />
          ) : !user.isVerified ? (
            <Navigate to="/checkout" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* Add more admin routes here */}
    </>
  );
};

export default AdminRoutes;
