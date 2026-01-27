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
  User,
  Medal,
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

const CreateTournament = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [matchTypeValue, setMatchTypeValue] = useState("Singles"); // state to hold selected value
  const [playTypeValue, setPlayTypeValue] = useState("Round Robbin"); // state to hold selected value

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
      navigate(location.state?.from || "/tournament-list", {
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
    navigate("/tournament-list");
  };

  const onSubmit = async (data) => {
    console.log("Save Data:", data);

    try {
      await mutateAsync(data);
    } catch (err) {
      // handled in onError
    }
  };

  useEffect(() => { }, [matchTypeValue, playTypeValue]);

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
            Create New Tournament
          </h2>
        </div>

        <div className="flex gap-2">
          <Logout />
        </div>
      </div>

      {/* Content View */}
      <div className="p-5">
      <div className="card w-full max-w-full mx-auto shadow-lg rounded-lg bg-blue-600 items-center">
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
                  htmlFor="tournamentName"
                  className="flex items-center gap-2 text-gray-700 mb-2"
                >
                  <Shield className="w-4 h-4" />
                  Tournament Name
                </label>
                <div>
                  <input
                    type="text"
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

            {/* Age Group and Grade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <User className="w-4 h-4" />
                  Age Group
                </div>
                <select
                  {...register("ageGroup")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select Age Group</option>
                  <option value="U9">U9</option>
                  <option value="U11">U11</option>
                  <option value="U13">U13</option>
                  <option value="U15">U15</option>
                  <option value="U17">U17</option>
                  <option value="U19">U19</option>
                  <option value="Open">Open</option>
                  <option value="35+">35+</option>
                  <option value="40+">40+</option>
                  <option value="45+">45+</option>
                  <option value="50+">50+</option>
                  <option value="55+">55+</option>
                  <option value="60+">60+</option>
                  <option value="65+">65+</option>
                  <option value="70+">70+</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                  <option value="Masters">Masters</option>
                </select>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <Medal className="w-4 h-4" />
                  Grade
                </div>
                <select
                  {...register("grade")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select Grade</option>
                  <option value="Standard">Standard</option>
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                  <option value="D">Grade D</option>
                  <option value="E">Grade E</option>
                </select>
              </div>
            </div>



            {/* Tournament Format */}
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
                    <option value="Mixed Doubles">Mixed Doubles</option>
                    <option value="Mens Singles">Men's Singles</option>
                    <option value="Mens Doubles">Men's Doubles</option>
                    <option value="Womens Singles">Women's Singles</option>
                    <option value="Womens Doubles">Women's Doubles</option>
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

                <div className={`${playTypeValue === "group-knockout" ? "" : "col-span-2"}`}>
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
                 
                
                 
                 
                  {/* <input
                    type="number"
                    id="numberOfCourts"
                    name="numberOfCourts"
                    // value={formData.courtsAvailable}
                    // onChange={handleChange}
                    required
                    min="1"
                    {...register("numberOfCourts")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter number of courts"
                    // onFocus={  navigate("/select-Venue")}
                  /> */}


<input
  type="number"
  readOnly
  {...register("numberOfCourts")}
  onClick={() => navigate("/select-Venue")}
  placeholder="Select courts"
  className="w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer bg-gray-50"
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
    </div>
  );
};

export default CreateTournament;
