import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getTeamListAPI } from "../../services/admin/adminTeamServices";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import tournamentSetupSchema from "../../../utils/validationSchemas";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useTournament } from "../../hooks/useTournament";
import { setTournamentData } from "../../redux/slices/tournamentSlice";
import { useDispatch } from "react-redux";
import { FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa"; // import the trash icon
import { Settings } from "lucide-react";
import ButtonWithIcon from "../../components/ButtonWithIcon";
import { useDeleteTournament } from "../../hooks/useDeleteTournament";
import Logout from "../../components/Logout";
import { saveTournamentAPI } from "../../services/admin/adminTeamServices";
import { logOut } from "../../redux/slices/userSlice";

const SetupTournament = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { handleTournamentList, isLoading: isTournamentLoading , error:tournamentListError } =
    useTournament("Admin");

  const {
    handleTournamentDelete,
    isLoading: isScoreLoading,
    isError: isScoreError,
    isSuccess: isScoreSuccess,
  } = useDeleteTournament();

  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded((prev) => !prev);

  // ---------------------------
  // SAVE TOURNAMENT MUTATION
  // ---------------------------
  const { mutateAsync } = useMutation({
    mutationKey: ["saveTournament"],
    mutationFn: saveTournamentAPI,
    onMutate: () =>
      toast.loading("Saving tournament...", { id: "saveTournament" }),
    onSuccess: () => {
      toast.dismiss();
      toast.success("Tournament saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminTournamentList"] });
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(err?.message || "Failed to save tournament");
    },
  });

  // ---------------------------
  // FORM VALIDATION (YUP)
  // ---------------------------
  const schema = tournamentSetupSchema.pick([
    "tournamentName",
    "teamsPerGroup",
    "playType",
    "playersToQualify",
    "numberOfCourts",
  ]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      tournamentName: "My Tournament",
      teamsPerGroup: 4,
      playType: "group-knockout",
      playersToQualify: 2,
      numberOfCourts: 1,
    },
  });

  // ---------------------------
  // LOCAL STATES
  // ---------------------------
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [assigning, setAssigning] = useState(false);

  // ---------------------------
  // FETCH TEAMS
  // ---------------------------
  let loadingToast;
  const { data, isLoading, isFetching ,error} = useQuery({
    queryKey: ["teams"],
    queryFn: getTeamListAPI,
    onSuccess: (res) => toast.success("Teams loaded!"),
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Error loading teams"),
  });

  useEffect(() => {
    if(error?.status === 401){
  console.log("handleTournamentList",error.response.data.message);
  dispatch(logOut())
  toast.error(error.response.data.message)

}
    if (data?.teams) {
      const players = data.teams
        .map((t) =>
          t.teamName && t._id ? { teamId: t._id, name: t.teamName } : null
        )
        .filter(Boolean);

      setAllPlayers(players);
      setSelectedPlayers(players);
    }
  }, [data]);

  const tournaments = handleTournamentList();

  useEffect(() => {




  }, [tournaments]);

  // ---------------------------
  // SCHEDULE TOURNAMENT
  // ---------------------------
  const onSubmit = async (saveData) => {
    console.log("saveData", saveData);

    if (selectedPlayers.length < saveData.teamsPerGroup) {
      toast.error("Not enough teams to form groups");
      return;
    }

    setAssigning(true);

    // Shuffle teams
    const shuffledTeams = [...selectedPlayers].sort(() => Math.random() - 0.5);

    // Create groups
    const groups = [];
    const groupCount = Math.ceil(shuffledTeams.length / saveData.teamsPerGroup);

    for (let i = 0; i < groupCount; i++) groups.push([]);

    shuffledTeams.forEach((team, i) => {
      groups[i % groupCount].push(team);
    });

    console.log("Generated Groups:", groups);

    // Prepare object for DB
    const tournamentData = {
      tournamentName: saveData.tournamentName,
      teamsPerGroup: saveData.teamsPerGroup,
      playType: saveData.playType,
      groups,
      numberOfPlayersQualifiedToKnockout: saveData.playersToQualify,
      numberOfCourts: saveData.numberOfCourts,

    };

    console.log("Final tournamentData →", tournamentData);

    try {
      await mutateAsync(tournamentData);
    } catch (err) {
      console.error("Error:", err);
      toast.dismiss("saveTournament");
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

  const handleDeleteTournament = (tournamentId) => {
    handleTournamentDelete(tournamentId);
  };

 



  // ---------------------------
  // RENDER UI
  // ---------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white ">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4  shadow-lg sticky top-0">
        <div className="flex items-center gap-4">
          <Settings
            className="w-8 h-8 text-blue-600"
            onClick={() => navigate("/")}
          />

          <h2 className="text-xl font-semibold text-blue-800">
            Setup Tournament
          </h2>
        </div>

        <div className="flex gap-2">
          {" "}
          <ButtonWithIcon
            title="Add Team"
            icon="plus"
            buttonBGColor="bg-green-600"
            textColor="text-white"
            onClick={() => navigate("/teams")}
          />
          <Logout />
        </div>
      </div>

      {/* Tournament List */}
      {tournaments?.length > 0 ? (
        <div className="bg-white rounded-3xl shadow-lg p-6 mt-4 ml-4 mr-4">
          <h2 className="text-xl font-semibold mb-4">Existing Tournaments</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tournaments.map((tournament) => (
              <li
                key={tournament.tournamentId}
                className="p-4 bg-blue-50 rounded-lg border border-gray-200 text-bold"
                onClick={() => {
                  console.log("tournament", tournament);

                  dispatch(setTournamentData(tournament));

                  navigate(`/match/${tournament.tournamentId}`);
                }}
              >
                <div className="flex flex-row justify-between">
                  <h4>{tournament.name}</h4>
                  <button
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent li click
                      handleDeleteTournament(tournament.tournamentId);
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg p-6 max-h-96 overflow-y-auto mt-4 ml-4 mr-4">
          <h2 className="text-xl font-semibold mb-4">
            No tournaments available.
          </h2>
        </div>
      )}

      {/* TEAM LIST */}
      {data?.teams?.length > 0 ? (
        <div className="bg-white rounded-3xl shadow-lg p-6 max-h-96 overflow-y-auto mt-4 ml-4 mr-4">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={toggleExpand}
          >
            <h2 className="text-xl font-semibold mb-4">
              All Teams ({data?.teams?.length})
            </h2>
            {data?.teams?.length > 0 && (
              <span className="text-gray-600">
                {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
              </span>
            )}
          </div>
          {isExpanded && data?.teams?.length > 0 ? (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {data?.teams?.map((team) => (
                <li
                  key={team._id}
                  className="p-2 bg-blue-50 rounded-lg border border-gray-200 text-center"
                >
                  {team.teamName}
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

      {/* SETTINGS */}
      <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4 mt-4 ml-4 mr-4 mb-8">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Tournament Name */}
          <div>
            <label className="font-semibold">Tournament Name:</label>
            <input
              type="text"
              {...register("tournamentName")}
              className=" w-full p-1 border rounded"
            />
            {errors.tournamentName && (
              <p className="text-red-600 text-sm">
                {errors.tournamentName.message}
              </p>
            )}
          </div>

          {/* Teams per group */}
          <div>
            <label className="font-semibold">Teams per Group:</label>
            <input
              type="number"
              min="2"
              max="8"
              {...register("teamsPerGroup")}
              className="ml-2 w-20 p-1 border rounded"
            />
          </div>

          {/* Play type */}
          <div>
            <label className="font-semibold">Play Type:</label>
            <select
              {...register("playType")}
              className="ml-2 p-1 border rounded"
            >
              <option value="group">Group Stage</option>
              <option value="knockout">Knockout</option>
              <option value="group-knockout">Group + Knockout</option>
            </select>
          </div>

          {/* Number of players Qualified to knockout */}
          <div>
            <label className="font-semibold">
              Number of players Qualified to knockout:
            </label>
            <input
              type="number"
              min="2"
              max="8"
              {...register("playersToQualify")}
              className="ml-2 w-20 p-1 border rounded"
            />
          </div>
          {/* Number of players Qualified to knockout */}
          <div>
            <label className="font-semibold">Number of courts available:</label>
            <input
              type="number"
              min="2"
              max="20"
              {...register("numberOfCourts")}
              className="ml-2 w-20 p-1 border rounded"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            // onClick={handleSchedule}
            disabled={assigning}
            className="bg-blue-700 text-white p-3 rounded-xl font-bold hover:bg-blue-800 transition w-full"
          >
            {assigning ? "Assigning Groups..." : "Schedule Tournament"}
          </button>

          {assigning && (
            <div className="mt-4 p-4 bg-blue-100 rounded-xl text-center font-semibold animate-pulse">
              Creating groups, please wait...
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SetupTournament;
