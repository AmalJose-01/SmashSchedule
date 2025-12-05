import { useState } from "react";
import AdminRoutes from "./routes/AdminRoutes.jsx";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import TeamSetup from "./pages/user/TeamSetup";
import { Toaster } from "sonner";
import Home from "./pages/user/Home.jsx";
import Login from "./pages/admin/Login.jsx";
import Footer from "./components/Footer.jsx"
function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="w-full h-full bg-slate-200 overflow-x-hidden">
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/teams" element={<TeamSetup />} />

            {/* Logins admin access */}
            {AdminRoutes()}

            {/* <Route path="/match/:tournamentId" element={<MatchHome />} />

            <Route path="/create-tournament" element={<SetupTournament />} />
            <Route path="/teams" element={<TeamSetup />} />
            <Route path="/knockout" element={<KnockoutFixtures />} /> */}
          </Routes>
          <Footer />
        </Router>
        <Toaster richColors position="top-center" />
      </div>
    </>
  );
}

export default App;
