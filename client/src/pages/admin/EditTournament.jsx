import {
  Table,
  Trophy,
  Users,
  X,
  Shield,
  Calendar,
  Clock,
  MapPin,
  Grid3x3,
  Layers,
  Save,
  DollarSign,
} from "lucide-react";
import ButtonWithIcon from "../../components/ButtonWithIcon";
import Logout from "../../components/Logout";
import tournamentSetupSchema from "../../../utils/validationSchemas";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveTournamentAPI } from "../../services/admin/adminTeamServices";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logOut } from "../../redux/slices/userSlice";
import { useEffect, useState } from "react";

import { useLocation } from "react-router-dom";

const EditTournament = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { state } = useLocation();
  const tournamentDetail = state?.tournamentDetail;


  const [matchTypeValue, setMatchTypeValue] = useState(tournamentDetail.matchType ? tournamentDetail.matchType : "Singles"); // state to hold selected value
  const [playTypeValue, setPlayTypeValue] = useState(tournamentDetail.playType ? tournamentDetail.playType : "Round Robbin"); // state to hold selected value



  
  // ---------------------------
  // FORM VALIDATION (YUP)
  // ---------------------------
  const schema = tournamentSetupSchema.pick([
    "tournamentName",
    "teamsPerGroup",
    "playType",
    "numberOfPlayersQualifiedToKnockout",
    "numberOfCourts",
    "date",
    "time",
    "location",
    "maximumParticipants",
    "matchType",
    "description",
    "registrationFee",
  ]);

  // ---------------------------
  // SAVE TOURNAMENT MUTATION
  // ---------------------------
  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["saveTournament"],
    mutationFn: saveTournamentAPI,
    onMutate: () =>
      toast.loading("Saving tournament...", { id: "saveTournament" }),
    onSuccess: () => {
      toast.dismiss();
      toast.success("Tournament saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminTournamentList"] });
      navigate(location.state?.from || "/setup-tournament", {
        replace: true,
      });
    },
    onError: (error) => {
      toast.dismiss();

      if (error?.response?.status === 401) {
        toast.dismiss();

        toast.error(error.response.data.message || "Session expired");

        dispatch(logOut());
        navigate("/");

        return;
      }

      toast.error(
        error?.response?.data?.message || "Error loading tournament details"
      );
    },
  });

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
      playType: "Round Robbin",
      numberOfPlayersQualifiedToKnockout: 2,
      numberOfCourts: 1,
      date: "",
      time: "",
      location: "",
      maximumParticipants: "",
      matchType: "Singles",
      description: "",
      registrationFee: "",
    },
  });

  const onClose = () => {
    navigate("/setup-tournament");
  };

  const onSubmit = async (data) => {
    console.log("Save Data:", data);

    try {
      await mutateAsync(data);
    } catch (err) {
      // handled in onError
    }
  };

  useEffect(() => {}, [matchTypeValue, playTypeValue]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white ">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4  shadow-lg sticky top-0">
        <div className="flex items-center gap-4">
          <Trophy
            className="w-8 h-8 text-blue-600"
            onClick={() => navigate("/")}
          />

          <h2 className="text-xl font-semibold text-blue-800">
            Edit Tournament
          </h2>
        </div>

        <div className="flex gap-2">
          <Logout />
        </div>
      </div>

      {/* Content View */}
      <div className="card w-full max-w-xl mx-auto shadow-lg rounded-lg bg-blue-600 items-center mt-5 ">
        <div className="flex  items-center justify-between p-4">
          <div className="flex  items-center gap-3">
            <Trophy className="w-6 h-6 text-white" />
            <h2 className="text-2xl  text-white">Tournament Detail</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-600 hover:bg-opacity-20 rounded-lg transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex w-full bg-white rounded-b-lg">
          <form
            className="flex flex-col w-full mt-3 p-3 gap-3"
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Team Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label
                  htmlFor="teamName"
                  className="flex items-center gap-2 text-gray-700 mb-2"
                >
                  <Shield className="w-4 h-4" />
                  Tournament Name
                </label>
                <div>
                  <input
                    type="text"
                    value={tournamentDetail.tournamentName
}
                    placeholder="Tournament Name"
                    {...register("tournamentName")}
                    className="w-full p-2 border rounded"
                  />
                  {errors.tournamentName && (
                    <p className="text-red-500 text-sm">
                      {errors.tournamentName.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </div>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={tournamentDetail.date}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register("date")}
                />
                {errors.date && (
                  <p className="text-red-600 text-sm">{errors.date.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <Clock className="w-4 h-4" />
                  Time
                </div>
                <input
                  type="time"
                  id="time"
                  name="time"
                    value={tournamentDetail.time}
                  //   value={formData.time}
                  //   onChange={handleChange}
                  required
                  {...register("time")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.time && (
                  <p className="text-red-500 text-sm">{errors.time.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <div>
                  <input
                    type="text"
                    placeholder="Tournament Name"
                    {...register("location")}
                    className="w-full p-2 border rounded"
                      value={tournamentDetail.location}
                  />
                  {errors.location && (
                    <p className="text-red-500 text-sm">
                      {errors.location.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <Users className="w-4 h-4" />
                  Maximum Participants/Team
                </div>
                <input
                  type="number"
                  id="maxParticipants"
                  name="maxParticipants"
                    value={tournamentDetail.maximumParticipants}
                  // value={formData.maxParticipants}
                  // onChange={handleChange}
                  required
                  min="2"
                  {...register("maximumParticipants")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter max number of participants"
                />
                {errors.maximumParticipants && (
                  <p className="text-red-600 text-sm">
                    {errors.maximumParticipants.message}
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4" />
                  Registration Fee
                </div>
                <input
                  type="number"
                  id=" registrationFee"
                  name=" registrationFee"
                    value={tournamentDetail.registrationFee}
                  required
                  {...register("registrationFee")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter max number of participants"
                />
                {errors.registrationFee && (
                  <p className="text-red-600 text-sm">
                    {errors.registrationFee.message}
                  </p>
                )}
              </div>
            </div>

            {/* Tournament Format Section */}
            <div className="pt-4 border-t">
              <h3 className="mb-4 text-gray-900">Tournament Format</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <Users className="w-4 h-4" />
                    Match Type
                  </div>
                  <select
                    id="matchType"
                    {...register("matchType", { required: true })} // register only once
                    value={matchTypeValue} // bind to state for display
                    onChange={(e) => {
                      setMatchTypeValue(e.target.value); // update local state
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Singles">Singles</option>
                    <option value="Doubles">Doubles</option>
                  </select>
                  {errors.matchType && (
                    <p className="text-red-600 text-sm">
                      {errors.matchType.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <Grid3x3 className="w-4 h-4" />
                    {matchTypeValue === "Singles"
                      ? "Player per Group"
                      : "Teams per Group"}
                  </div>
                  <input
                    type="number"
                    id="teamsPerGroup"
                    name="teamsPerGroup"
                      value={tournamentDetail.teamsPerGroup}
                    required
                    min="2"
                    {...register("teamsPerGroup")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter max number of participants"
                  />
                  {errors.teamsPerGroup && (
                    <p className="text-red-600 text-sm">
                      {errors.teamsPerGroup.message}
                    </p>
                  )}
                </div>

                <div
                  className={`${
                    playTypeValue === "group-knockout" ? "" : "col-span-2"
                  }`}
                >
                  <div className={`flex items-center gap-2 text-gray-700 mb-2`}>
                    <Layers className="w-4 h-4" />
                    Play Type
                  </div>
                  <select
                    {...register("playType", { required: true })}
                    value={playTypeValue}
                    onChange={(e) => {
                      setPlayTypeValue(e.target.value);
                      setValue("playType", e.target.value); // sync with react-hook-form
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="round-robin">Round Robin</option>
                    <option value="group">Group Stage</option>
                    <option value="knockout">Knockout</option>
                    <option value="group-knockout">Group + Knockout</option>
                  </select>
                  {errors.playType && (
                    <p className="text-red-600 text-sm">
                      {errors.playType.message}
                    </p>
                  )}
                </div>

                {playTypeValue === "group-knockout" && (
                  <div>
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <Trophy className="w-4 h-4" />
                      Qualified to Knockout
                    </div>
                    <input
                      type="number"
                      min="1"
                        value={tournamentDetail.numberOfPlayersQualifiedToKnockout}
                      {...register("numberOfPlayersQualifiedToKnockout")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.numberOfPlayersQualifiedToKnockout && (
                      <p className="text-red-600 text-sm">
                        {errors.numberOfPlayersQualifiedToKnockout.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="col-span-2">
                  <div className="flex  items-center gap-2 text-gray-700 mb-2">
                    <MapPin className="w-4 h-4" />
                    Number of Courts Available
                  </div>
                  <input
                    type="number"
                    id="numberOfCourts"
                    name="numberOfCourts"
                      value={tournamentDetail.numberOfCourts}
                    // value={formData.courtsAvailable}
                    // onChange={handleChange}
                    required
                    min="1"
                    {...register("numberOfCourts")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter number of courts"
                  />
                  {errors.numberOfCourts && (
                    <p className="text-red-600 text-sm">
                      {errors.numberOfCourts.message}
                    </p>
                  )}
                </div>

                {/*  */}
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-gray-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                    value={tournamentDetail.description}
                  // value={formData.description}
                  // onChange={handleChange}
                  rows={4}
                  {...register("description")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter tournament description and rules"
                />
                {errors.description && (
                  <p className="text-red-600 text-sm">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="flex gap-4 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="flex items-center gap-4 justify-center bg-gray-500 text-white p-3 rounded-xl font-bold hover:bg-red-400 transition w-full mt-4"
                >
                  <X className="w-5 h-5" />
                  {"Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-4  justify-center bg-green-700 text-white p-3 rounded-xl font-bold hover:bg-green-800 transition w-full mt-4"
                >
                  <Save className="w-5 h-5" />
                  {isPending ? "Saving..." : "Save Teams"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTournament;
