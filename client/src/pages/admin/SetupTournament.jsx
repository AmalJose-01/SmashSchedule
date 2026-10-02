import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getTeamListAPI } from "../../services/admin/adminTeamServices";
import ConfirmModal from "../../components/AlertView";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { setTournamentData } from "../../redux/slices/tournamentSlice";
import { useDispatch, useSelector } from "react-redux";
import {
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AppBackground from "../../components/AppBackground";
import PageHeader from "../../components/PageHeader";
import { logOut } from "../../redux/slices/userSlice";
import { useTournamentInformation } from "../../hooks/useTournamentInformation";
import { useMatchSave } from "../../hooks/useMatchSave";
import { useDeleteTournament } from "../../hooks/useDeleteTournament";
import Papa from "papaparse";
import { useImportTeam } from "../../hooks/useImportTeam";

import { readExcelFile, readCsvFile } from "../../../utils/fileReaders";

import { convertToTeamsPayload } from "../../../utils/converters/convertToTeamsPayload";
import { convertToPlayersPayload } from "../../../utils/converters/convertToPlayersPayload";
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
  const { handleUseImportTeam, successImportTeam, importError } =
    useImportTeam();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const { tournamentInfo } = useTournamentInformation(tournament._id, "Admin");
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
        return "bg-cyan-500/15 border-cyan-500/30 text-cyan-300";
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


        console.log("papaData after setData:");

    if (isUploading) {
      toast.warning("Upload already in progress. Please wait.");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;
    if (isFull) {
      toast.error(`Tournament is full (max ${maxParticipants} participants)`);
      e.target.value = "";
      return;
    }
    setIsUploading(true);

    const allowedTypes = ["csv", "xls", "xlsx"];
    const ext = file.name.split(".").pop().toLowerCase();

    if (!allowedTypes.includes(ext)) {
      toast.error("Only CSV or Excel files are allowed");
      setIsUploading(false);
      e.target.value = "";
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
       e.target.value = "";
    }
  };

  useEffect(() => {
    if (papaData.length === 0) return;

    console.log("papaData after setData:", papaData);

    // Convert to payload or do other processing
    // Singles → players ("tournamentplayers"), Doubles → teams
    // Only import as many rows as there are places left (Max Participants).
    const max = Number(tournamentDetail.maximumParticipants) || 0;
    const registered = data?.teams?.length ?? 0;
    let rows = papaData;
    if (max > 0) {
      const left = Math.max(0, max - registered);
      if (left === 0) {
        toast.error(`Tournament is full (max ${max} participants)`);
        setData([]);
        setTeamFile(null);
        setIsUploading(false);
        return;
      }
      if (rows.length > left) {
        toast.info(`Only ${left} place${left !== 1 ? "s" : ""} left — importing the first ${left} of ${rows.length} rows.`, { duration: 8000 });
        rows = rows.slice(0, left);
      }
    }

    const payload =
      tournamentDetail.matchType === "Doubles"
        ? convertToTeamsPayload(rows, tournamentDetail._id)
        : convertToPlayersPayload(rows, tournamentDetail._id);

    console.log("convertToTeamsPayloadsetData:", payload);

    try {
      handleUseImportTeam(payload);
      // setTeamFile(null);
    } catch (err) {
      console.error("Error:", err);
    }
  }, [papaData,setTeamFile]);

  useEffect(() => {
    if (successImportTeam || importError) {
      setData([]); // clear parsed data
      setTeamFile(null); // clear uploaded file
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      //  if (successImportTeam){
      //    toast.success("Teams imported successfully!"); // optional
      //  }
     
    }
  }, [successImportTeam, importError]);

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
    return (
      <AppBackground>
        <div className="min-h-screen flex items-center justify-center text-slate-400">
          Loading tournament...
        </div>
      </AppBackground>
    );
  }

  const isCreate = tournamentDetail.status === "Create";
  const teamCount = data?.teams?.length ?? 0;
  const isDoubles = tournamentDetail.matchType === "Doubles";
  // Never accept more than "Max Participants".
  const maxParticipants = Number(tournamentDetail.maximumParticipants) || 0;
  const isFull = maxParticipants > 0 && teamCount >= maxParticipants;
  const canAdd = isCreate && !isFull;
  const registerLabel = isDoubles ? "Register Team" : "Register Player";
  // Singles register players (own page + collection), Doubles register teams.
  const goRegister = () =>
    isFull
      ? toast.error(`Tournament is full (max ${maxParticipants} participants)`)
      : isDoubles
      ? navigate("/teams", { replace: true, state: { from: `/setup-tournament` } })
      : navigate("/register-player");

  // ---------------------------
  // RENDER UI
  // ---------------------------
  return (
    <AppBackground>
      <PageHeader
        title={tournamentDetail.tournamentName}
        subtitle="Tournament setup"
        onBack={() => navigate("/tournament-list")}
        actions={
          isCreate && (
            <>
              <button
                onClick={goRegister}
                className="flex items-center gap-2 h-10 px-3 sm:px-4 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm font-medium hover:bg-white/10 hover:text-white transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden md:inline">{registerLabel}</span>
              </button>
              <button
                onClick={() => navigate("/edit-tournament", { state: { tournamentDetail } })}
                className="flex items-center gap-2 h-10 px-3 sm:px-4 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm font-medium hover:bg-white/10 hover:text-white transition-all"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden md:inline">Edit Details</span>
              </button>
            </>
          )
        }
      />

      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-emerald-500/15 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
                {tournamentDetail.tournamentName}
              </h1>
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span className={`px-3 py-1 rounded-full border font-medium ${getStatusColor(tournamentDetail.status)}`}>
                  {tournamentDetail.status}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200">
                  <Trophy className="w-3.5 h-3.5 text-cyan-400" />
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
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Participants</div>
              <div className="text-3xl font-semibold text-white">
                {teamCount}
                <span className="text-slate-400"> / {tournamentDetail.maximumParticipants}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card icon={FileText} title="Tournament Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow icon={Calendar} label="Date" value={tournamentDetail.date || "Not set"} />
                <InfoRow icon={Clock} label="Time" value={tournamentDetail.time || "Not set"} />
                <InfoRow icon={MapPin} label="Location" value={tournamentDetail.location || "Not set"} />
                <InfoRow icon={Users} label="Max Participants" value={tournamentDetail.maximumParticipants} />
                <InfoRow icon={DollarSign} label="Registration Fee" value={tournamentDetail.registrationFee || "Not set"} />
                <InfoRow icon={Key} label="Secret Key" value={tournamentDetail.uniqueKey} />
              </div>
              {tournamentDetail.description && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-1">Description</div>
                  <p className="text-sm text-slate-200 whitespace-pre-line">{tournamentDetail.description}</p>
                </div>
              )}
            </Card>

            {/* Tournament Format */}
            <Card icon={Trophy} title="Tournament Format">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow icon={Layers} label="Play Type" value={getPlayTypeDisplay(tournamentDetail.playType)} />
                <InfoRow icon={Users} label="Match Type" value={tournamentDetail.matchType} />
                <InfoRow icon={Grid3x3} label="Teams per Group" value={tournamentDetail.teamsPerGroup} />
                <InfoRow icon={Trophy} label="Qualified to Knockout" value={tournamentDetail.numberOfPlayersQualifiedToKnockout} />
                <InfoRow icon={MapPin} label="Number of Courts" value={tournamentDetail.numberOfCourts} />
              </div>
            </Card>

            {/* TEAM LIST */}
            {teamCount > 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 p-6 max-h-[28rem] overflow-y-auto">
                <button
                  type="button"
                  className="w-full flex justify-between items-center"
                  onClick={toggleExpand}
                >
                  <span className="flex items-center gap-2 font-semibold text-white">
                    <Users className="w-5 h-5 text-cyan-400" />
                    {isDoubles ? "Registered Teams" : "Registered Players"} ({teamCount})
                  </span>
                  <span className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </span>
                </button>
                {isExpanded && (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                    {data.teams.map((team) => (
                      <li
                        key={team._id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400/30 to-emerald-500/30 border border-cyan-400/30 flex items-center justify-center text-cyan-200 font-semibold">
                            {team.teamName.charAt(0)}
                          </div>
                          <span className="text-sm text-slate-100 truncate">{team.teamName}</span>
                          {team.grade && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                              {team.grade}
                            </span>
                          )}
                        </div>

                        {isCreate && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              aria-label="Edit"
                              className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                              onClick={() =>
                                team.entryType === "player"
                                  ? navigate("/edit-player", { state: { player: team } })
                                  : navigate("/edit-team", { state: { team } })
                              }
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              aria-label="Delete"
                              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmConfig({ open: true, type: "team", id: team._id });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl">
                <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-300 text-sm">
                  No teams yet. Add teams to schedule the tournament.
                </p>
              </div>
            )}
          </div>

          {/* Right Side — Actions */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 p-6 h-fit lg:sticky lg:top-24">
            <h3 className="font-semibold text-white mb-4">Actions</h3>
            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  Import Team
                </label>
                <p className="text-xs text-slate-400 mb-3 truncate">
                  {teamFile ? teamFile.name : "Supported formats: .csv, .xls, .xlsx"}
                </p>
                {isCreate && isFull && (
                  <p className="text-xs text-amber-300 mb-2">
                    Tournament is full ({teamCount}/{maxParticipants}). Increase Max Participants to add more.
                  </p>
                )}
                <label className={canAdd ? "block cursor-pointer" : "block cursor-not-allowed"}>
                  <div
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-center transition-all ${
                      canAdd
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-600"
                        : "bg-white/5 border border-white/10 text-slate-500"
                    }`}
                  >
                    {isUploading
                      ? "Uploading..."
                      : tournamentDetail.matchType === "Doubles"
                        ? "Upload Team"
                        : "Upload Player"}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={!canAdd}
                  />
                </label>
              </div>

              <div className="border-t border-slate-700/50" />

              <button
                onClick={goRegister}
                disabled={!canAdd}
                className={secondaryBtn}
              >
                <UserPlus className="w-4 h-4" />
                {registerLabel}
              </button>
              <button
                onClick={() => navigate("/edit-tournament", { state: { tournamentDetail } })}
                disabled={!isCreate}
                className={secondaryBtn}
              >
                <Edit className="w-4 h-4" />
                Edit Details
              </button>
              <button
                onClick={() => onSubmit()}
                disabled={assigning}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white text-sm font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all disabled:opacity-50"
              >
                {isCreate ? <Trophy className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {isCreate ? "Start Tournament" : "View Matches"}
              </button>

              <div className="border-t border-slate-700/50" />

              <button
                className="w-full px-4 py-2.5 rounded-xl border border-red-500/40 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                onClick={() =>
                  setConfirmConfig({ open: true, type: "tournament", id: tournamentDetail._id })
                }
              >
                Delete Tournament
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmConfig.open}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Delete"
        cancelText="Cancel"
        danger
        loading={isScoreLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmConfig({ open: false, type: null, id: null })}
      />
    </AppBackground>
  );
};

// ── Small layout helpers (same dark glass style as the rest of the app) ──
const secondaryBtn =
  "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600 bg-white/5 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/5";

const Card = ({ icon: Icon, title, children }) => (
  <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 p-6">
    <h2 className="flex items-center gap-2 font-semibold text-white mb-4 pb-3 border-b border-slate-700/50">
      <Icon className="w-5 h-5 text-cyan-400" />
      {title}
    </h2>
    {children}
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 min-w-0">
    <Icon className="w-5 h-5 text-cyan-400/70 mt-0.5 flex-shrink-0" />
    <div className="min-w-0">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-sm text-slate-100 break-words">{value ?? "—"}</div>
    </div>
  </div>
);

export default SetupTournament;
