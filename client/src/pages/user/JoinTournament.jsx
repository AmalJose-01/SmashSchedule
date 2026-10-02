// Player joins a (group / knockout) tournament.
//   Singles → one player   → POST /tournament/players
//   Doubles → a team of 2  → POST /tournament/teams
// The tournament comes from the Redux store (set on Tournament Detail).
import { Navigate, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar, Mail, Phone, Save, User, UserPlus, Users, X } from "lucide-react";
import AppBackground from "../../components/AppBackground";
import PageHeader from "../../components/PageHeader";
import { joinAsPlayerAPI, saveTeamAPI } from "../../services/teamServices";

const phone = (label) =>
  Yup.string()
    .trim()
    .required(`${label} is required`)
    .test("digits", "Enter a valid contact number", (v) => (v || "").replace(/\D/g, "").length >= 8);
const dob = (label) =>
  Yup.string()
    .required(`${label} is required`)
    .test("past", "Date of birth cannot be in the future", (v) => !v || new Date(v) <= new Date());

const singlesSchema = Yup.object({
  name: Yup.string().trim().required("Name is required"),
  email: Yup.string().trim().email("Invalid email").required("Email is required"),
  contact: phone("Contact number"),
  dob: dob("Date of birth"),
});

const doublesSchema = Yup.object({
  teamName: Yup.string().trim(),
  playerOneName: Yup.string().trim().required("Name is required"),
  playerOneEmail: Yup.string().trim().email("Invalid email").required("Email is required"),
  playerOneContact: phone("Contact number"),
  playerOneDOB: dob("Date of birth"),
  playerTwoName: Yup.string().trim().required("Partner name is required"),
  playerTwoEmail: Yup.string()
    .trim()
    .email("Invalid email")
    .required("Partner email is required")
    .notOneOf([Yup.ref("playerOneEmail")], "Partner needs a different email"),
  playerTwoContact: phone("Partner contact number"),
  playerTwoDOB: dob("Partner date of birth"),
});

const inputCls = (err) =>
  `w-full bg-slate-900/50 border rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all ${err ? "border-red-500" : "border-slate-600"}`;

const Field = ({ icon: Icon, label, error, children }) => (
  <div>
    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
      {Icon && <Icon className="w-4 h-4 text-emerald-400" />}
      {label}
    </label>
    {children}
    {error?.message && <p className="text-red-400 text-xs mt-1">{error.message}</p>}
  </div>
);

const Card = ({ icon: Icon, title, children }) => (
  <section className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-5 sm:p-6 space-y-4">
    <h2 className="flex items-center gap-2 text-lg font-semibold text-white pb-3 border-b border-slate-700/50">
      <Icon className="w-5 h-5 text-emerald-400" />
      {title}
    </h2>
    {children}
  </section>
);

// One player's fields; `p` is the field-name prefix ("" for singles).
const PlayerFields = ({ register, errors, names }) => (
  <>
    <Field icon={User} label="Full Name" error={errors[names.name]}>
      <input type="text" placeholder="Full name" {...register(names.name)} className={inputCls(errors[names.name])} />
    </Field>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field icon={Mail} label="Email" error={errors[names.email]}>
        <input type="email" placeholder="you@email.com" {...register(names.email)} className={inputCls(errors[names.email])} />
      </Field>
      <Field icon={Phone} label="Contact Number" error={errors[names.contact]}>
        <input type="tel" placeholder="04xx xxx xxx" {...register(names.contact)} className={inputCls(errors[names.contact])} />
      </Field>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field icon={Calendar} label="Date of Birth" error={errors[names.dob]}>
        <input type="date" {...register(names.dob)} className={inputCls(errors[names.dob])} />
      </Field>
    </div>
  </>
);

const JoinTournament = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tournament = useSelector((s) => s.tournament.tournamentData);
  const user = useSelector((s) => s.user.user);
  const isDoubles = tournament?.matchType === "Doubles";

  // Pre-fill with the logged-in player's details.
  const myName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.name || "";
  const myEmail = user?.emailID || user?.email || "";
  const myPhone = user?.phoneNumber || user?.contact || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(isDoubles ? doublesSchema : singlesSchema),
    defaultValues: isDoubles
      ? { teamName: "", playerOneName: myName, playerOneEmail: myEmail, playerOneContact: myPhone, playerOneDOB: "",
          playerTwoName: "", playerTwoEmail: "", playerTwoContact: "", playerTwoDOB: "" }
      : { name: myName, email: myEmail, contact: myPhone, dob: "" },
  });

  const goBack = () => navigate("/tournamentInfo", { replace: true });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values) =>
      isDoubles
        ? saveTeamAPI({
            ...values,
            teamName: values.teamName?.trim() || `${values.playerOneName} & ${values.playerTwoName}`,
            tournamentId: tournament._id,
          })
        : joinAsPlayerAPI({ ...values, tournamentId: tournament._id }),
    onSuccess: () => {
      toast.success(isDoubles ? "Your team is registered!" : "You're registered!");
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", tournament._id] });
      goBack();
    },
    onError: (err) => {
      const data = err?.response?.data;
      toast.error(data?.skippedPlayers?.[0]?.reason || data?.message || "Couldn't register — please try again");
    },
  });

  if (!tournament?._id) return <Navigate to="/user/my-clubs" replace />;

  const onSubmit = async (values) => {
    try {
      await mutateAsync(values);
    } catch {
      /* handled in onError */
    }
  };

  return (
    <AppBackground variant="user">
      <PageHeader
        variant="user"
        title={isDoubles ? "Register Team" : "Join Tournament"}
        subtitle={tournament.tournamentName}
        onBack={goBack}
        profileMenu
      />

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-6">
        {isDoubles ? (
          <>
            <Card icon={Users} title="Team">
              <Field label="Team Name (optional)" error={errors.teamName}>
                <input type="text" placeholder="Leave empty to use both names" {...register("teamName")} className={inputCls(errors.teamName)} />
              </Field>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <Card icon={User} title="Player 1 (you)">
                <PlayerFields register={register} errors={errors}
                  names={{ name: "playerOneName", email: "playerOneEmail", contact: "playerOneContact", dob: "playerOneDOB" }} />
              </Card>
              <Card icon={UserPlus} title="Player 2 (partner)">
                <PlayerFields register={register} errors={errors}
                  names={{ name: "playerTwoName", email: "playerTwoEmail", contact: "playerTwoContact", dob: "playerTwoDOB" }} />
              </Card>
            </div>
          </>
        ) : (
          <Card icon={UserPlus} title="Your Details">
            <PlayerFields register={register} errors={errors} names={{ name: "name", email: "email", contact: "contact", dob: "dob" }} />
          </Card>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={isPending}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-600 bg-white/5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40 transition-all"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-yellow-500 hover:from-emerald-600 hover:to-yellow-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? "Registering..." : isDoubles ? "Register Team" : "Join Tournament"}
          </button>
        </div>
      </form>
    </AppBackground>
  );
};

export default JoinTournament;
