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
import Logout from "../../components/Logout";
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
        return "bg-blue-100 text-blue-800";
      case "Ongoing":
        return "bg-green-100 text-green-800";
      case "GroupStage":
        return "bg-yellow-100 text-yellow-800";
      case "KnockoutStage":
        return "bg-orange-100 text-orange-800";
      case "finished":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    return <div>Loading tournament...</div>;
  }
  // ---------------------------
  // RENDER UI
  // ---------------------------

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4  shadow-lg sticky top-0">
        <div className="flex items-center gap-4">
          <ListChecks
            className="w-8 h-8 text-blue-600"
            onClick={() => navigate("/")}
          />

          <h2 className="text-xl font-semibold text-blue-800">
            Tournament Detail
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              navigate("/save-teams", {
                replace: true,
                state: {
                  from: `/tournamentInfo`,
                },
              })
            }
            className={`${
              tournamentDetail.status != "Create" ? "hidden" : ""
            } flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors`}
          >
            <UserPlus className="w-5 h-5" />
            <span className="hidden md:flex">{tournamentDetail.matchType === "Doubles" ? "Register Team" : "Register Player"}</span>
          </button>
         
        </div>
      </div>

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-3">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 mb-6 text-white m-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl mb-2">
                {tournamentDetail.tournamentName}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                    tournamentDetail.status
                  )} bg-white`}
                >
                  {tournamentDetail.status}
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {tournamentDetail.matchType}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    tournamentDetail.isPublic ? "bg-green-500" : "bg-gray-500"
                  }`}
                >
                  {tournamentDetail.isPublic ? "Public" : "Private"}
                </span>
              </div>
            </div>
            
          </div>
        </div>

        {/*  */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 m-4">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Tournament Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Date</div>
                    <div>{tournamentDetail.date || "Not set"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Time</div>
                    <div>{tournamentDetail.time || "Not set"}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Location</div>
                    <div>{tournamentDetail.location || "Not set"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">
                      Max Participants
                    </div>
                    <div>{tournamentDetail.maximumParticipants}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">
                      Registration Fee
                    </div>
                    <div>{tournamentDetail.registrationFee || "Not set"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Secret Key</div>
                    <div>{"****"}</div>
                  </div>
                </div>
              </div>
              {tournamentDetail.description && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600 mb-1">Description</div>
                  <p className="text-gray-700">
                    {tournamentDetail.description}
                  </p>
                </div>
              )}
            </div>

            {/* Tournament Format */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-blue-600" />
                Tournament Format
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Layers className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Play Type</div>
                    <div>{getPlayTypeDisplay(tournamentDetail.playType)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Match Type</div>
                    <div>{tournamentDetail.matchType}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Grid3x3 className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Teams per Group</div>
                    <div>{tournamentDetail.teamsPerGroup}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">
                      Qualified to Knockout
                    </div>
                    <div>
                      {tournamentDetail.numberOfPlayersQualifiedToKnockout}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">
                      Number of Courts
                    </div>
                    <div>{tournamentDetail.numberOfCourts}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTournamentDetail;
