import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


import {  useSelector } from "react-redux";
import {
  ListChecks,
  Edit,
  UserPlus,
  Trophy,
  FileText,
  Calendar,
  Clock,
  MapPin,
  Users,
  Layers,
  Grid3x3,

  DollarSign,
  Key,
} from "lucide-react";
import AppBackground from "../../components/AppBackground";
import PageHeader from "../../components/PageHeader";
import { useTournamentInformation } from "../../hooks/useTournamentInformation";


const ViewTournamentDetail = () => {
  // ---------------------------
  // LOCAL STATES
  // ---------------------------

  const navigate = useNavigate();

  const tournament = useSelector((state) => state.tournament.tournamentData);
  const [tournamentDetail, setTournamentDetail] = useState(null);
  const { tournamentInfo } = useTournamentInformation(tournament._id, "");
  const getStatusColor = (status) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-500/15 border-blue-500/30 text-blue-300";
      case "Ongoing":
        return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
      case "GroupStage":
        return "bg-yellow-500/15 border-yellow-500/30 text-yellow-300";
      case "KnockoutStage":
        return "bg-orange-500/15 border-orange-500/30 text-orange-300";
      case "finished":
        return "bg-slate-500/15 border-slate-500/30 text-slate-300";
      default:
        return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
    }
  };

  const getPlayTypeDisplay = (playType) => {
    switch (playType) {
      case "group":
        return "Group Stage Only";
      case "knockout":
        return "Knockout Only";
      case "group-knockout":
        return "Group + Knockout";
      default:
        return playType;
    }
  };

  useEffect(() => {
    if (!tournament?._id) return;
    try {
      if (!tournamentInfo) return;
      setTournamentDetail(tournamentInfo.tournaments ?? tournamentInfo);
    } catch (err) {
      console.error("Error fetching tournament detail:", err);
      toast.error("Failed to load tournament details");
    }
  }, [tournamentInfo]);


  // Wait until tournamentDetail is loaded
  if (!tournamentDetail) {
    return (
      <AppBackground variant="user">
        <div className="min-h-screen flex items-center justify-center text-slate-400">Loading tournament...</div>
      </AppBackground>
    );
  }

  // ---------------------------
  // RENDER UI
  // ---------------------------
  return (
    <AppBackground variant="user">
      <PageHeader
        variant="user"
        title="Tournament Detail"
        subtitle={tournamentDetail.tournamentName}
        onBack={() => navigate(-1)}
        profileMenu
      />

      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-6">
        {/* Hero */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/15 via-yellow-500/5 to-emerald-500/15 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
            {tournamentDetail.tournamentName}
          </h1>
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className={`px-3 py-1 rounded-full border font-medium ${getStatusColor(tournamentDetail.status)}`}>
              {tournamentDetail.status}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              {tournamentDetail.matchType}
            </span>
            <span
              className={`px-3 py-1 rounded-full border ${
                tournamentDetail.isPublic
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                  : "bg-slate-500/15 border-slate-500/30 text-slate-300"
              }`}
            >
              {tournamentDetail.isPublic ? "Public" : "Private"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card icon={FileText} title="Tournament Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={Calendar} label="Date" value={tournamentDetail.date || "Not set"} />
              <InfoRow icon={Clock} label="Time" value={tournamentDetail.time || "Not set"} />
              <InfoRow icon={MapPin} label="Location" value={tournamentDetail.location || "Not set"} />
              <InfoRow icon={Users} label="Max Participants" value={tournamentDetail.maximumParticipants} />
              <InfoRow icon={DollarSign} label="Registration Fee" value={tournamentDetail.registrationFee || "Not set"} />
              <InfoRow icon={Key} label="Secret Key" value="****" />
            </div>
            {tournamentDetail.description && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Description</div>
                <p className="text-sm text-slate-200 whitespace-pre-line">{tournamentDetail.description}</p>
              </div>
            )}
          </Card>

          <Card icon={Trophy} title="Tournament Format">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={Layers} label="Play Type" value={getPlayTypeDisplay(tournamentDetail.playType)} />
              <InfoRow icon={Users} label="Match Type" value={tournamentDetail.matchType} />
              <InfoRow icon={Grid3x3} label="Teams per Group" value={tournamentDetail.teamsPerGroup} />
              <InfoRow icon={Trophy} label="Qualified to Knockout" value={tournamentDetail.numberOfPlayersQualifiedToKnockout} />
              <InfoRow icon={MapPin} label="Number of Courts" value={tournamentDetail.numberOfCourts} />
            </div>
          </Card>
        </div>
      </div>
    </AppBackground>
  );
};

// ── Dark glass card + info row (player area: emerald / yellow accents) ──
const Card = ({ icon: Icon, title, children }) => (
  <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 p-5 sm:p-6">
    <h2 className="flex items-center gap-2 font-semibold text-white mb-4 pb-3 border-b border-slate-700/50">
      <Icon className="w-5 h-5 text-emerald-400" />
      {title}
    </h2>
    {children}
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 min-w-0">
    <Icon className="w-5 h-5 text-emerald-400/70 mt-0.5 flex-shrink-0" />
    <div className="min-w-0">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-sm text-slate-100 break-words">{value ?? "—"}</div>
    </div>
  </div>
);

export default ViewTournamentDetail;
