import { useLocation, useNavigate } from "react-router-dom";
import tournamentSetupSchema from "../../../utils/validationSchemas";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { updateTeamAPI } from "../../services/teamServices";
import { toast } from "sonner"; // make sure react-toastify is installed
import AppBackground from "../../components/AppBackground.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import { X, Users, Save } from "lucide-react";
import { useSelector } from "react-redux";

const TeamSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { state } = location;
  const team = state?.team;


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
    if (data.teamName.trim() === "") {
      data.teamName = data.playerOneName + " & " + data.playerTwoName;
    }

    try {
      await mutateAsync(data);
    } catch {
      // handled in onError
    }
  };
  const onClose = () => {
    navigate(location.state?.from || "/setup-tournament", {
      replace: true,
    });
  };

  const inputCls =
    "w-full bg-slate-900/50 border border-slate-600 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all";
  const errCls = "text-red-400 text-xs mt-1";

  return (
    <AppBackground>
      <PageHeader title="Edit Team" subtitle={team?.teamName} onBack={onClose} />

      <div className="px-3 py-6">
        <div className="w-full max-w-xl mx-auto bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-700/50">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Edit Team</h2>
          </div>

          <form className="flex flex-col p-6 gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="teamName" className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
                <Users className="w-4 h-4" />
                Team Name
              </label>
              <input id="teamName" type="text" placeholder="Team Name" {...register("teamName")} className={inputCls} />
              {errors.teamName && <p className={errCls}>{errors.teamName.message}</p>}
            </div>

            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-700/50 mt-2">
              Team Members
            </h3>

            <div className="rounded-xl bg-slate-900/40 border border-slate-700/50 p-3">
              <span className="block text-sm font-medium text-cyan-300 mb-2">Member 1</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <input type="text" placeholder="Full Name" {...register("playerOneName")} className={inputCls} />
                  {errors.playerOneName && <p className={errCls}>{errors.playerOneName.message}</p>}
                </div>
                <div>
                  <input type="email" placeholder="Email" {...register("playerOneEmail")} className={inputCls} />
                  {errors.playerOneEmail && <p className={errCls}>{errors.playerOneEmail.message}</p>}
                </div>
                <div>
                  <input type="text" placeholder="Phone" {...register("playerOneContact")} className={inputCls} />
                  {errors.playerOneContact && <p className={errCls}>{errors.playerOneContact.message}</p>}
                </div>
                <div>
                  <input type="date" {...register("playerOneDOB")} className={inputCls} />
                  {errors.playerOneDOB && <p className={errCls}>{errors.playerOneDOB.message}</p>}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900/40 border border-slate-700/50 p-3">
              <span className="block text-sm font-medium text-cyan-300 mb-2">Member 2</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <input type="text" placeholder="Full Name" {...register("playerTwoName")} className={inputCls} />
                  {errors.playerTwoName && <p className={errCls}>{errors.playerTwoName.message}</p>}
                </div>
                <div>
                  <input type="email" placeholder="Email" {...register("playerTwoEmail")} className={inputCls} />
                  {errors.playerTwoEmail && <p className={errCls}>{errors.playerTwoEmail.message}</p>}
                </div>
                <div>
                  <input type="text" placeholder="Phone" {...register("playerTwoContact")} className={inputCls} />
                  {errors.playerTwoContact && <p className={errCls}>{errors.playerTwoContact.message}</p>}
                </div>
                <div>
                  <input type="date" {...register("playerTwoDOB")} className={inputCls} />
                  {errors.playerTwoDOB && <p className={errCls}>{errors.playerTwoDOB.message}</p>}
                </div>
              </div>
            </div>

            <div className="flex w-full gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border border-slate-600 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
              >
                <Save className="w-4 h-4" />
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppBackground>
  );
};

export default TeamSetup;
