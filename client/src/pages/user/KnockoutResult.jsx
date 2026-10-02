import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useGetKnockoutList } from "../../hooks/useGetKnockoutList";
import { useNavigate } from "react-router-dom";
import { Trophy } from "lucide-react";
import AppBackground from "../../components/AppBackground";
import PageHeader from "../../components/PageHeader";
import KnockoutBracket from "../../components/KnockoutBracket";

export function getRoundName(round) {
  switch (round) {
    case 0:
      return "Round of 32";
    case 1:
      return "Round of 16";
    case 2:
      return "Quarterfinals";
    case 3:
      return "Semifinals";
    case 4:
      return "Final";
    case 5:
      return "Champion";
    default:
      return `Round ${round}`;
  }
}

const KnockoutResult = () => {
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();

  const tournamentData = useSelector(
    (state) => state.tournament.tournamentData
  );

  const { handleKnockoutList } = useGetKnockoutList(
    tournamentData?._id,
    "User"
  );

  const knockoutList = handleKnockoutList();

  useEffect(() => {
    if (knockoutList?.matches) {
      setMatches(knockoutList.matches);
    }
  }, [knockoutList]);


  return (
    <AppBackground variant="user">
      <PageHeader
        variant="user"
        title="Knockout Stage"
        subtitle={tournamentData?.tournamentName}
        onBack={() => navigate(-1)}
        profileMenu
      />

      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6">
        {matches.length > 0 ? (
          <KnockoutBracket matches={matches} variant="user" />
        ) : (
          <div className="text-center py-16 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl">
            <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">Knockout fixtures not available yet.</p>
          </div>
        )}
      </div>
    </AppBackground>
  );
};

export default KnockoutResult;
