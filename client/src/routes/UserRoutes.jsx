// UserRoutes.jsx
import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import UserDashboard from "../pages/user/UserDashboard";
import TournamentList from "../pages/user/TournamentList";
import GroupStageList from "../pages/user/GroupStageList";
import KnockoutResult from "../pages/user/KnockoutResult";
import ViewTournamentDetail from "../pages/user/ViewTournamentDetail";
import SaveTeamRegistration from "../pages/user/SaveTeamRegistration";
import { useSelector } from "react-redux";
import Login from "../pages/admin/Login";
import MemberRegistration from "../features/membership/users/pages/MemberRegistration";
import MemberProfile from "../features/my-profile/pages/MemberProfile";

const UserRoutes = () => {
  const user = useSelector((state) => state.user.user);

  return (
    <>
      <Route
        path="/user/login"
        element={
          !user || user.accountType !== "user" ? (
            <Login />
          ) : (
            <Navigate to="/user/dashboard" replace />
          )
        }
      />
      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute role="user">
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournamentList"
        element={<TournamentList />}
      />
      <Route
        path="/tournamentInfo"
        element={<ViewTournamentDetail />}
      />
      <Route
        path="/groupStageList/:tournamentId"
        element={<GroupStageList />}
      />
      <Route
        path="/knockoutResult"
        element={<KnockoutResult />}
      />
      <Route
        path="/save-teams"
        element={<SaveTeamRegistration />}
      />
      <Route
        path="/user/membership"
        element={<MemberRegistration />}
      />
      <Route
        path="/user/profile"
        element={<MemberProfile />}
      />
    </>
  );
};

export default UserRoutes;