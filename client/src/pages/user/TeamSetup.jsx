import { useNavigate } from "react-router-dom";
import tournamentSetupSchema from "../../../utils/validationSchemas";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { saveTeamAPI } from "../../services/teamServices";
import { toast } from "sonner"; // make sure react-toastify is installed

const TeamSetup = () => {
  const navigate = useNavigate();

  const { mutateAsync, isLoading } = useMutation({
    mutationKey: ["saveTeam"],
    mutationFn: saveTeamAPI,
     onMutate: () => {
    toast.loading("Saving team...");
  },
    onSuccess: () => {
       toast.dismiss(); 
      toast.success("Team saved successfully!");
      // navigate("/");
    },
    onError: (err) => {
       toast.dismiss(); 
      toast.error(err?.message || "Failed to save team");
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
    defaultValues: {
      teamName: "",
      playerOneName: "",
      playerTwoName: "",
      playerOneEmail: "",
      playerTwoEmail: "",
      playerOneContact: "",
      playerTwoContact: "",
      playerOneDOB: "",
      playerTwoDOB: "",
    },
  });

  const onSubmit = async (data) => {
    console.log("Form Data:", data);
    if(data.teamName.trim() === "") {
      data.teamName = data.playerOneName + " & " + data.playerTwoName;
    }
        console.log("Updated Data:", data);

    try {
      await mutateAsync(data);
    } catch (err) {
      // handled in onError
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 p-6 space-y-6">
      <h1 className="text-3xl font-bold text-blue-800">Team Setup</h1>

      <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        {/* Team Name */}
        <div>
          <input
            type="text"
            placeholder="Team Name"
            {...register("teamName")}
            className="w-full p-2 border rounded"
          />
          {errors.teamName && (
            <p className="text-red-500 text-sm">{errors.teamName.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Player One */}
          <div>
            <h3 className="font-semibold">Player One</h3>
            <input
              type="text"
              placeholder="Player One Name"
              {...register("playerOneName")}
              className="w-full p-2 border rounded mt-1"
            />
            {errors.playerOneName && <p className="text-red-500 text-sm">{errors.playerOneName.message}</p>}

            <input
              type="email"
              placeholder="Email"
              {...register("playerOneEmail")}
              className="w-full p-2 border rounded mt-2"
            />
            {errors.playerOneEmail && <p className="text-red-500 text-sm">{errors.playerOneEmail.message}</p>}

            <input
              type="text"
              placeholder="Phone"
              {...register("playerOneContact")}
              className="w-full p-2 border rounded mt-2"
            />
            {errors.playerOneContact && <p className="text-red-500 text-sm">{errors.playerOneContact.message}</p>}

            <input
              type="date"
              {...register("playerOneDOB")}
              className="w-full p-2 border rounded mt-2"
            />
            {errors.playerOneDOB && <p className="text-red-500 text-sm">{errors.playerOneDOB.message}</p>}
          </div>

          {/* Player Two */}
          <div>
            <h3 className="font-semibold">Player Two</h3>
            <input
              type="text"
              placeholder="Player Two Name"
              {...register("playerTwoName")}
              className="w-full p-2 border rounded mt-1"
            />
            {errors.playerTwoName && <p className="text-red-500 text-sm">{errors.playerTwoName.message}</p>}

            <input
              type="email"
              placeholder="Email"
              {...register("playerTwoEmail")}
              className="w-full p-2 border rounded mt-2"
            />
            {errors.playerTwoEmail && <p className="text-red-500 text-sm">{errors.playerTwoEmail.message}</p>}

            <input
              type="text"
              placeholder="Phone"
              {...register("playerTwoContact")}
              className="w-full p-2 border rounded mt-2"
            />
            {errors.playerTwoContact && <p className="text-red-500 text-sm">{errors.playerTwoContact.message}</p>}

            <input
              type="date"
              {...register("playerTwoDOB")}
              className="w-full p-2 border rounded mt-2"
            />
            {errors.playerTwoDOB && <p className="text-red-500 text-sm">{errors.playerTwoDOB.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-700 text-white p-3 rounded-xl font-bold hover:bg-blue-800 transition w-full mt-4"
        >
          {isLoading ? "Saving..." : "Save Teams"}
        </button>
      </form>
    </div>
  );
};

export default TeamSetup;
