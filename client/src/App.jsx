import { useState, lazy, Suspense } from "react";
import AdminRoutes from "./routes/AdminRoutes.jsx";
import UserRoutes from "./routes/UserRoutes.jsx";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TeamSetup from "./pages/admin/TeamSetup.jsx";
import { Toaster } from "sonner";
import Home from "./pages/user/Home.jsx";
import Footer from "./components/Footer.jsx";
import TournamentList from "./pages/user/TournamentList.jsx";
import GroupStageList from "./pages/user/GroupStageList.jsx";
import KnockoutResult from "./pages/user/KnockoutResult.jsx";
import SaveTeamRegistration from "./pages/user/SaveTeamRegistration.jsx";
import Success from "./pages/common/Success.jsx";
import ViewTournamentDetail from "./pages/user/ViewTournamentDetail.jsx";
import Login from "./pages/admin/Login.jsx";
import LoginSelector from "./pages/common/LoginSelector.jsx";

// Lazy-loaded: CheckoutPage pulls in Stripe.js, which would otherwise load
// (and ping Stripe's telemetry endpoint) on every page in the app, even
// tournament pages that only use Square. This way Stripe only loads when
// someone actually navigates to /checkout.
const CheckoutPage = lazy(() => import("./pages/admin/CheckoutPage.jsx"));

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="w-full h-full bg-slate-200 overflow-x-hidden">
        <Router>
          <Routes>
            <Route path="/" element={<LoginSelector />} />
            {/* <Route path="/" element={<Success />} /> */}
                        <Route path="/success" element={<Success />} />


            <Route path="/teams" element={<TeamSetup />} />
            <Route path="/save-teams" element={<SaveTeamRegistration />} />
            <Route path="/tournamentList" element={<TournamentList />} />
            <Route path="/tournamentInfo" element={<ViewTournamentDetail />} />

            <Route
              path="/groupStageList/:tournamentId"
              element={<GroupStageList />}
            />
            <Route path="/knockoutResult" element={<KnockoutResult />} />

            {/* Stripe Checkout Page — lazy-loaded so Stripe.js only loads here */}
            <Route
              path="/checkout"
              element={
                <Suspense fallback={null}>
                  <CheckoutPage />
                </Suspense>
              }
            />

            {/* Admin routes */}
            {AdminRoutes()}

            {/* User routes */}
            {UserRoutes()}

            {/* User routes */}
            {UserRoutes()}
          </Routes>
          <Footer />
        </Router>
        <Toaster richColors position="top-center" />
      </div>
    </>
  );
}

export default App;
