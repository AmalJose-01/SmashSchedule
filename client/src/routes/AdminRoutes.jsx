// AdminRoutes.jsx
import { Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import SetupTournament from "../pages/admin/SetupTournament";
import MatchHome from "../pages/admin/MatchHome";
import KnockoutFixtures from "../pages/admin/KnockoutFixtures";

const AdminRoutes = () => {
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






 {/* <Route path="/match/:tournamentId" element={<MatchHome />} />

            <Route path="/create-tournament" element={<SetupTournament />} />
            <Route path="/teams" element={<TeamSetup />} />
            <Route path="/knockout" element={<KnockoutFixtures />} /> */}

      {/* Add more admin routes here */}
    </>
  );
};

export default AdminRoutes;
