// UserRoutes.jsx
import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import UserDashboard from "../pages/user/UserDashboard";
import TournamentList from "../pages/user/TournamentList";
import GroupStageList from "../pages/user/GroupStageList";
import KnockoutResult from "../pages/user/KnockoutResult";
import ViewTournamentDetail from "../pages/user/ViewTournamentDetail";
import SaveTeamRegistration from "../pages/user/SaveTeamRegistration";
import JoinTournament from "../pages/user/JoinTournament";
import { useSelector } from "react-redux";
import Login from "../pages/admin/Login";
import MemberRegistration from "../features/membership/users/pages/MemberRegistration";
import MemberProfile from "../features/membership/users/my-profile/pages/MemberProfile";
import ClubSearch from "../features/club-profile/users/pages/ClubSearch";
import UserProfile from "../features/user-profile/pages/UserProfile.jsx";
import FindClub from "../features/find-club/pages/FindClub.jsx";
import MyClubs from "../features/my-clubs/pages/MyClubs.jsx";
import ClubEventsPage from "../features/my-clubs/pages/ClubEventsPage.jsx";
import RoundRobinView from "../features/round-robin/player/pages/RoundRobinView.jsx";
import UserMembershipHome from "../features/user-membership/pages/UserMembershipHome";
import UserSignup from "../features/user-signup/pages/UserSignup";

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
        path="/user/signup"
        element={
          !user || user.accountType !== "user" ? (
            <UserSignup />
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
        path="/join-tournament"
        element={
          <ProtectedRoute role="user">
            <JoinTournament />
          </ProtectedRoute>
        }
      />
      <Route
        path="/save-teams"
        element={<SaveTeamRegistration />}
      />
      <Route
        path="/user/my-clubs"
        element={
          <ProtectedRoute role="user">
            <MyClubs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/club/:clubId/events"
        element={
          <ProtectedRoute role="user">
            <ClubEventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/round-robin/:id"
        element={
          <ProtectedRoute role="user">
            <RoundRobinView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/find-club"
        element={
          <ProtectedRoute role="user">
            <FindClub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/club-search"
        element={<ClubSearch />}
      />
      <Route
        path="/user/memberships"
        element={
          <ProtectedRoute role="user">
            <UserMembershipHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/membership"
        element={<MemberRegistration />}
      />
      <Route
        path="/user/profile"
        element={
          <ProtectedRoute role="user">
            {/* Personal details (UserDetail). The old membership-based
                MemberProfile page is no longer routed here — players don't
                register memberships for now. */}
            <UserProfile />
          </ProtectedRoute>
        }
      />
    </>
  );
};

export default UserRoutes;