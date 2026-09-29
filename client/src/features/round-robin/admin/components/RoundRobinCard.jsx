import React from "react";
import { Shuffle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardTile from "../../../../components/DashboardTile.jsx";

const RoundRobinCard = ({ isClubComplete }) => {
  const navigate = useNavigate();

  return (
    <DashboardTile
      icon={Shuffle}
      gradient="from-emerald-400 to-teal-500"
      title="Round Robin"
      description="Run dedicated round robin tournaments with player pools, auto-grouping, and live standings."
      locked={!isClubComplete}
      onClick={() =>
        isClubComplete ? navigate("/round-robin/dashboard") : navigate("/admin/club-profile")
      }
    />
  );
};

export default RoundRobinCard;
