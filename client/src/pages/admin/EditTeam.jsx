import { useLocation, useNavigate } from "react-router-dom";
import tournamentSetupSchema from "../../../utils/validationSchemas";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { updateTeamAPI } from "../../services/teamServices";
import { toast } from "sonner"; // make sure react-toastify is installed
// import Navbar from "../../components/Navbar";
import Logout from "../../components/Logout";
import {
  X,
  Users,
  Mail,
  Phone,
  Trophy,
  Upload,
  UserPlus,
  Save,
} from "lucide-react";
import { useSelector } from "react-redux";

const TeamSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { state } = location;
  const team = state?.team;

  console.log("team", team);


  const tournament = useSelector((state) => state.tournament.tournamentData);

  const { mutateAsync, isLoading } = useMutation({
    mutationKey: ["saveTeam"],
    mutationFn: updateTeamAPI,
    onMutate: () => {
      toast.loading("Saving team...");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Team saved successfully!");
      onClose();
      // navigate("/");
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(err?.response.data.message || "Failed to save team");
    },
  });

  const schema = tournamentSetupSchema.pick([
    "teamName",
    "playerOneName",
    "playerOneEmail",
    "playerOneContact",
    "playerOneDOB",
    "playerTwoName",
    "playerTwoEmail",
    "playerTwoContact",
    "playerTwoDOB",
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: team || {
      teamName: "",
      playerOneName: "",
      playerTwoName: "",
      playerOneEmail: "",
      playerTwoEmail: "",
      playerOneContact: "",
      playerTwoContact: "",
      playerOneDOB: "",
      playerTwoDOB: "",
      tournamentId: tournament._id,
    },
  });

  const onSubmit = async (data) => {
    console.log("Form Data:", data);
    if (data.teamName.trim() === "") {
      data.teamName = data.playerOneName + " & " + data.playerTwoName;
    }
    console.log("Updated Data:", data);

    try {
      await mutateAsync(data);
    } catch (err) {
      // handled in onError
    }
  };
  const onClose = () => {
    navigate(location.state?.from || "/setup-tournament", {
      replace: true,
    });
  };

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
            Edit Team
          </h2>
        </div>

        <div className="flex gap-2">
          <Logout />
        </div>
      </div>

      <div className="p-5">
        <div className="card w-full max-w-xl mx-auto shadow-lg rounded-lg bg-blue-600 items-center">
          <div className="flex  items-center justify-between p-4">
            <div className="flex  items-center gap-3">
              <Users className="w-6 h-6 text-white" />
              <h2 className="text-2xl  text-white">Edit Team</h2>
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
              <h3 className="text-lg  pb-2 border-b">Team Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label
                    htmlFor="teamName"
                    className="flex items-center gap-2 text-gray-700 mb-2"
                  >
                    <Users className="w-4 h-4" />
                    Team Name
                  </label>
                  <div>
                    <input
                      type="text"
                      placeholder="Team Name"
                      {...register("teamName")}
                      // value={team.teamName}
                      className="w-full p-2 border rounded"
                    />
                    {errors.teamName && (
                      <p className="text-red-500 text-sm">
                        {errors.teamName.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* Team Members */}
              <h3 className="text-lg  pb-2 border-b mt-6">Team Information</h3>

              {/* Player One */}
              <div className="rounded-md bg-gray-100 p-2">
                <span className="text-sm text-gray-600 ">Member 1</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    {...register("playerOneName")}
                    className="w-full p-2 border rounded"
                    // value={team.playerOneName}
                  />
                  {errors.playerOneName && (
                    <p className="text-red-500 text-sm">
                      {errors.playerOneName.message}
                    </p>
                  )}
                  <input
                    type="email"
                    placeholder="Email"
                    {...register("playerOneEmail")}
                    className="w-full p-2 border rounded "
                    // value={team.playerOneEmail}
                  />
                  {errors.playerOneEmail && (
                    <p className="text-red-500 text-sm">
                      {errors.playerOneEmail.message}
                    </p>
                  )}

                  <input
                    type="text"
                    placeholder="Phone"
                    {...register("playerOneContact")}
                    className="w-full p-2 border rounded"
                    // value={team.playerOneContact}
                  />
                  {errors.playerOneContact && (
                    <p className="text-red-500 text-sm">
                      {errors.playerOneContact.message}
                    </p>
                  )}

                  <input
                    type="date"
                    {...register("playerOneDOB")}
                    className="w-full p-2 border rounded"
                    // value={team.playerOneDOB}
                  />
                  {errors.playerOneDOB && (
                    <p className="text-red-500 text-sm">
                      {errors.playerOneDOB.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Player Two */}
              <div className="rounded-md bg-gray-100 p-2">
                <span className="text-sm text-gray-600 ">Member 2</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Player Two Name"
                    {...register("playerTwoName")}
                    className="w-full p-2 border rounded mt-1"
                    // value={team.playerTwoName}
                  />
                  {errors.playerTwoName && (
                    <p className="text-red-500 text-sm">
                      {errors.playerTwoName.message}
                    </p>
                  )}

                  <input
                    type="email"
                    placeholder="Email"
                    {...register("playerTwoEmail")}
                    className="w-full p-2 border rounded mt-2"
                    // value={team.playerTwoEmail}
                  />
                  {errors.playerTwoEmail && (
                    <p className="text-red-500 text-sm">
                      {errors.playerTwoEmail.message}
                    </p>
                  )}

                  <input
                    type="text"
                    placeholder="Phone"
                    {...register("playerTwoContact")}
                    className="w-full p-2 border rounded mt-2"
                    // value={team.playerTwoContact}
                  />
                  {errors.playerTwoContact && (
                    <p className="text-red-500 text-sm">
                      {errors.playerTwoContact.message}
                    </p>
                  )}

                  <input
                    type="date"
                    {...register("playerTwoDOB")}
                    className="w-full p-2 border rounded mt-2"
                    // value={team.playerTwoDOB}
                  />
                  {errors.playerTwoDOB && (
                    <p className="text-red-500 text-sm">
                      {errors.playerTwoDOB.message}
                    </p>
                  )}
                </div>
              </div>
              {/* Save and Cancel */}
              <div className="flex w-full mb-3 gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex items-center gap-4 justify-center bg-gray-500 text-white p-3 rounded-xl font-bold hover:bg-red-400 transition w-full mt-4"
                >
                  <X className="w-5 h-5" />
                  {"Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-4  justify-center bg-green-700 text-white p-3 rounded-xl font-bold hover:bg-green-800 transition w-full mt-4"
                >
                  <Save className="w-5 h-5" />
                  {isLoading ? "Saving..." : "Save Teams"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamSetup;
