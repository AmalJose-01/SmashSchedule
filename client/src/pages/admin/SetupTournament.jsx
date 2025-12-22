import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getTeamListAPI } from "../../services/admin/adminTeamServices";
import ConfirmModal from "../../components/AlertView";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { setTournamentData } from "../../redux/slices/tournamentSlice";
import { useDispatch, useSelector } from "react-redux";
import { FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa"; // import the trash icon
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
  Eye,
  Upload,
  DollarSign,
  Key,
  Pencil,
  Trash2,
} from "lucide-react";
import ButtonWithIcon from "../../components/ButtonWithIcon";
import Logout from "../../components/Logout";
import { logOut } from "../../redux/slices/userSlice";
import { useTournamentInformation } from "../../hooks/useTournamentInformation";
import { useMatchSave } from "../../hooks/useMatchSave";
import { useDeleteTournament } from "../../hooks/useDeleteTournament";
import Papa from "papaparse";
import { useImportTeam } from "../../hooks/useImportTeam";

import { readExcelFile, readCsvFile } from "../../../utils/fileReaders";

import { convertToTeamsPayload } from "../../../utils/converters/convertToTeamsPayload";
import { useDeleteTeam } from "../../hooks/useDeleteTeam";

const SetupTournament = () => {
  // ---------------------------
  // LOCAL STATES
  // ---------------------------

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const tournament = useSelector((state) => state.tournament.tournamentData);
  const [tournamentDetail, setTournamentDetail] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    open: false,
    type: null,
    id: null,
    name: "",
  });

  const confirmTitle =
    confirmConfig.type === "team" ? "Delete Team" : "Delete Tournament";

  const confirmMessage =
    confirmConfig.type === "team"
      ? "Are you sure you want to delete this team? This action cannot be undone."
      : "This will permanently delete the tournament and all related data. Do you want to continue?";

  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [teamFile, setTeamFile] = useState(null);
  const [papaData, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded((prev) => !prev);

  const { handleUseMatchScheduling } = useMatchSave(tournament?._id);
  const { handleUseImportTeam, successImportTeam } = useImportTeam();

  const { tournamentInfo } = useTournamentInformation(tournament._id, "Admin");
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

  // ---------------------------
  // FETCH TEAMS
  // ---------------------------
  let loadingToast;
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["teams"],
    queryFn: () => getTeamListAPI(tournament._id),
    onSuccess: (res) => toast.success("Teams loaded!"),
    onError: (error) => {
      console.log("MUTATION ERROR:", error);
      toast.dismiss();
      if (error?.response?.status === 401) {
        toast.error(error.response.data.message || "Session expired");

        dispatch(logOut());
        navigate("/");

        return;
      }

      // Fallback for other errors
      toast.error(error?.response?.data?.message || error.message);
    },
  });

  useEffect(() => {
    if (error?.status === 401) {
      console.log("handleTournamentList", error.response.data.message);
      dispatch(logOut());
      toast.error(error.response.data.message);
    }

    if (data?.teams) {
      const players = data.teams
        .map((t) =>
          t.teamName && t._id ? { teamId: t._id, name: t.teamName } : null
        )
        .filter(Boolean);

      //  setAllPlayers(players);
      setSelectedPlayers(players);
      setData([]);
    }
  }, [data]);

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

  // ---------------------------
  // SCHEDULE TOURNAMENT
  // ---------------------------
  const onSubmit = async () => {
    if (tournamentDetail.status === "Create") {
      if (selectedPlayers.length < tournamentDetail.teamsPerGroup) {
        toast.error("Not enough teams to form groups");
        return;
      }

      setAssigning(true);

      // Shuffle teams
      const shuffledTeams = [...selectedPlayers].sort(
        () => Math.random() - 0.5
      );

      // Create groups
      const groups = [];
      const groupCount = Math.ceil(
        shuffledTeams.length / tournamentDetail.teamsPerGroup
      );

      for (let i = 0; i < groupCount; i++) groups.push([]);

      shuffledTeams.forEach((team, i) => {
        groups[i % groupCount].push(team);
      });

      console.log("Generated Groups:", groups);

      // Prepare object for DB
      const tournamentSaveData = {
        tournamentName: tournamentDetail.tournamentName,
        groups,
        tournamentID: tournamentDetail._id,
        numberOfCourts: tournamentDetail.numberOfCourts,
      };

      console.log("Final tournamentData →", tournamentSaveData);

      try {
        handleUseMatchScheduling(tournamentSaveData);
      } catch (err) {
        console.error("Error:", err);
      }
    } else {
      navigate(`/match/${tournamentDetail._id}`);
    }
    setAssigning(false);
  };

  // Trigger loading toast while fetching
  useEffect(() => {
    if (isLoading) {
      loadingToast = toast.loading("Loading players...");
    } else if (!isLoading && !isFetching) {
      toast.dismiss(loadingToast);
    }
  }, [isLoading, isFetching]);

  // Delete Session
  const {
    handleTournamentDelete,
    isLoading: isScoreLoading,
    isError: isScoreError,
    isSuccess: isScoreSuccess,
  } = useDeleteTournament();

  const { handleTeamDelete } = useDeleteTeam();

  const handleConfirmDelete = () => {
    if (!confirmConfig.id || !confirmConfig.type) return;

    if (confirmConfig.type === "tournament") {
      handleTournamentDelete(confirmConfig.id);
    }

    if (confirmConfig.type === "team") {
      handleTeamDelete(confirmConfig.id); //
    }

    setConfirmConfig({ open: false, type: null, id: null });
  };

  // ⬇️ Navigate back on success
  useEffect(() => {
    if (isScoreSuccess) {
      toast.success("Tournament deleted successfully");

      navigate("/tournament-list", { replace: true });
    }
  }, [isScoreSuccess, navigate]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["csv", "xls", "xlsx"];
    const ext = file.name.split(".").pop().toLowerCase();

    if (!allowedTypes.includes(ext)) {
      alert("Only CSV or Excel files are allowed");
      return;
    }

    if (file) {
      setTeamFile(file);

      const ext = file.name.split(".").pop().toLowerCase();

      let rows = [];
      console.log("ext==============", ext);

      if (ext === "csv") {
        rows = await readCsvFile(file);
      } else {
        rows = await readExcelFile(file);
      }

      console.log("papaData", rows);

      setData(rows);
    }
  };

  useEffect(() => {
    if (papaData.length === 0) return;

    console.log("papaData after setData:", papaData);

    // Convert to payload or do other processing
    const payload = convertToTeamsPayload(papaData, tournamentDetail._id);

    console.log("convertToTeamsPayloadsetData:", payload);

    try {
      handleUseImportTeam(payload);
      setTeamFile(null);
    } catch (err) {
      console.error("Error:", err);
    }
  }, [papaData]);

  useEffect(() => {
    if (successImportTeam) {
      setData([]); // clear parsed data
      setTeamFile(null); // clear uploaded file
      toast.success("Teams imported successfully!"); // optional
    }
  }, [successImportTeam]);

  const handleSyncTeams = () => {
    if (!papaData.length || !tournamentDetail._id) return;

    const payload = convertToTeamsPayload(papaData);
    console.log("payload", payload);

    try {
      handleUseImportTeam(payload);
    } catch (err) {
      setData([]);
      console.error("Error:", err);
    }
  };

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
            Tournament List
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              navigate("/teams", {
                replace: true,
                state: {
                  from: `/setup-tournament`,
                },
              })
            }
            className={`${
              tournamentDetail.status != "Create" ? "hidden" : ""
            } flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors`}
          >
            <UserPlus className="w-5 h-5" />
            <span className="hidden md:flex">
              {tournamentDetail.matchType === "Doubles"
                ? "Register Team"
                : "Register Player"}
            </span>
          </button>
          <button
            // onClick={() => onEdit(tournament)}
            className={`${
              tournamentDetail.status != "Create" ? "hidden" : ""
            } flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors`}
          >
            <Edit className="w-5 h-5" />
            <span className="hidden md:flex">Edit Tournament</span>
          </button>
          <Logout />
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
            <div className="text-right">
              <div className="text-sm text-blue-100 mb-1">Participants</div>
              <div className="text-3xl">
                {data?.teams?.length ? data?.teams?.length : "0"} /{""}
                {tournamentDetail.maximumParticipants}
              </div>
            </div>
          </div>
        </div>

        {/*  */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 m-4">
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
                    <div>{tournamentDetail.uniqueKey}</div>
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

            {/* TEAM LIST */}
            {data?.teams?.length > 0 ? (
              <div className="bg-white rounded-3xl shadow-lg p-6 max-h-96 overflow-y-auto mt-4">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={toggleExpand}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />

                    <h2>Registered Players ({data?.teams?.length})</h2>
                  </div>
                  {data?.teams?.length > 0 && (
                    <span className="text-gray-600">
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </span>
                  )}
                </div>
                {isExpanded && data?.teams?.length > 0 ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-2 mt-4">
                    {data?.teams?.map((team) => (
                      <li
                        key={team._id}
                        className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center w-full justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600">
                                {team.teamName.charAt(0)}
                              </span>
                            </div>

                            {team.teamName}
                          </div>

                          <div className="flex gap-2">
                            <button
                              className={`${
                                tournamentDetail.status != "Create"
                                  ? "hidden"
                                  : ""
                              } ml-auto p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center`}
                              // onClick={(e) => {
                              //   e.stopPropagation();
                              //   setConfirmConfig({
                              //     open: true,
                              //     type: "team",
                              //     id: team._id,
                              //   });
                              // }}

                              onClick={() =>
                                navigate("/edit-team", {
                                  state: { team },
                                })
                              }
                            >
                              <Pencil />
                            </button>

                            <button
                              className={`${
                                tournamentDetail.status != "Create"
                                  ? "hidden"
                                  : ""
                              } ml-auto p-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmConfig({
                                  open: true,
                                  type: "team",
                                  id: team._id,
                                });
                              }}
                            >
                              <Trash2 />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-lg p-6 max-h-96 overflow-y-auto mt-4 ml-4 mr-4">
                <h2 className="text-xl font-semibold mb-4">
                  No Teams Available. Please add teams to schedule a tournament.
                </h2>
              </div>
            )}
          </div>
          {/* Right Side */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="mb-4">Actions</h3>
            <div className="space-y-2">
              <div className="mt-5">
                <div className="flex justify-between">
                  <div>
                    <label className="flex items-center gap-2 text-gray-700 mb-2">
                      <Upload className="w-4 h-4" />
                      Import Team
                    </label>
                    <p className="text-sm text-gray-500 mb-3">
                      {teamFile
                        ? teamFile.name
                        : "Supported formats: .csv, .xls, .xlsx"}
                    </p>
                  </div>

                  {/* <ButtonWithIcon
                    title="Import"
                    icon="sync"
                    buttonBGColor="bg-green-600"
                    textColor="text-white"
                    onClick={handleSyncTeams}
                  /> */}
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer">
                    <div
                      className={`px-4 py-2 ${
                        tournamentDetail.status === "Create"
                          ? "bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                          : "bg-orange-200 text-white rounded-lg hover:bg-orange-200"
                      } border-gray-400 rounded-lg transition-colors text-center`}
                    >
                      {tournamentDetail.matchType === "Doubles"
                        ? "Upload Team"
                        : "Upload Player"}
                    </div>
                    <input
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={
                        tournamentDetail.status === "Create" ? false : true
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="border-t" />

              <button
                onClick={() => navigate("/teams")}
                className={`w-full px-4 py-2 transition-colors flex items-center justify-center gap-2 ${
                  tournamentDetail.status === "Create"
                    ? "bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    : "bg-purple-200 text-white rounded-lg hover:bg-purple-200"
                }`}
                disabled={tournamentDetail.status === "Create" ? false : true}
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden md:flex">
                  {tournamentDetail.matchType === "Doubles"
                    ? "Register Team"
                    : "Register Player"}
                </span>
              </button>
              <button
                onClick={() =>
                  navigate("/edit-tournament", {
                    state: { tournamentDetail },
                  })
                }
                className={`w-full px-4 py-2 transition-colors flex items-center justify-center gap-2 ${
                  tournamentDetail.status === "Create"
                    ? "bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    : "bg-blue-200 text-white rounded-lg hover:bg-blue-200"
                }`}
                disabled={tournamentDetail.status === "Create" ? false : true}
              >
                <Edit className="w-4 h-4" />
                Edit Details
              </button>
              <button
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                onClick={() => onSubmit()}
              >
                {tournamentDetail.status === "Create" ? (
                  <Trophy className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {tournamentDetail.status === "Create"
                  ? "Start Tournament"
                  : "View Matches"}
              </button>

              <div className="border-t" />

              <button
                className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                onClick={() =>
                  setConfirmConfig({
                    open: true,
                    type: "tournament",
                    id: tournamentDetail._id,
                  })
                }
              >
                Delete Tournament
              </button>
            </div>
          </div>
        </div>

        <ConfirmModal
          isOpen={confirmConfig.open}
          title={confirmTitle}
          message={confirmMessage}
          confirmText="YES"
          cancelText="NO"
          danger
          loading={isScoreLoading}
          onConfirm={handleConfirmDelete}
          onCancel={() =>
            setConfirmConfig({ open: false, type: null, id: null })
          }
        />
      </div>
    </div>
  );
};

export default SetupTournament;
