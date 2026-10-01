// Register / edit a player in a Singles tournament.
//   /register-player             → new player (POST /admin/players)
//   /edit-player  state:{player} → edit       (PUT  /admin/update-player)
// Players are stored in the "tournamentplayers" collection. Doubles
// tournaments keep using the team form (/teams).
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Award, Calendar, Hash, Mail, Phone, Save, User, UserPlus, X } from "lucide-react";
import AppBackground from "../../components/AppBackground";
import PageHeader from "../../components/PageHeader";
import { savePlayersAPI, updatePlayerAPI } from "../../services/admin/adminTeamServices";

// Name, email and contact number are required; the rest is optional.
const schema = Yup.object({
  name: Yup.string().trim().required("Player name is required"),
  email: Yup.string().trim().email("Invalid email format").required("Email is required"),
  contact: Yup.string()
    .trim()
    .required("Contact number is required")
    .test("digits", "Enter a valid contact number", (v) => (v || "").replace(/\D/g, "").length >= 8),
  dob: Yup.string()
    .test("past", "Date of birth cannot be in the future", (v) => !v || new Date(v) <= new Date()),
  grade: Yup.string().trim(),
  memberNo: Yup.string().trim(),
});

const inputCls = (err) =>
  `w-full bg-slate-900/50 border rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${err ? "border-red-500" : "border-slate-600"}`;

const Field = ({ icon: Icon, label, error, children }) => (
  <div>
    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
      {Icon && <Icon className="w-4 h-4 text-cyan-400" />}
      {label}
    </label>
    {children}
    {error?.message && <p className="text-red-400 text-xs mt-1">{error.message}</p>}
  </div>
);

// "2001-05-09T00:00:00.000Z" / "2001-05-09" → "2001-05-09" for <input type="date">
const toDateInput = (v) => (v ? String(v).slice(0, 10) : "");

const PlayerRegistration = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const queryClient = useQueryClient();
  const tournament = useSelector((s) => s.tournament.tournamentData);
  const player = state?.player ?? null;
  const isEdit = !!player;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: player?.name ?? player?.teamName ?? "",
      email: player?.email ?? "",
      contact: player?.contact ?? "",
      dob: toDateInput(player?.dob),
      grade: player?.grade ?? "",
      memberNo: player?.memberNo ?? "",
    },
  });

  const goBack = () => navigate("/setup-tournament", { replace: true });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values) =>
      isEdit
        ? updatePlayerAPI({ _id: player._id, tournamentId: tournament._id, ...values })
        : savePlayersAPI({ tournamentId: tournament._id, players: [values] }),
    onSuccess: () => {
      toast.success(isEdit ? "Player updated" : "Player registered");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      goBack();
    },
    onError: (err) => {
      const data = err?.response?.data;
      const reason = data?.skippedPlayers?.[0]?.reason;
      toast.error(reason || data?.message || "Failed to save player");
    },
  });

  if (!tournament?._id) return <Navigate to="/tournament-list" replace />;

  const onSubmit = async (values) => {
    try {
      await mutateAsync({ ...values, dob: toDateInput(values.dob) });
    } catch {
      // handled in onError
    }
  };

  return (
    <AppBackground>
      <PageHeader
        title={isEdit ? "Edit Player" : "Register Player"}
        subtitle={tournament.tournamentName}
        onBack={goBack}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
        <section className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-5 sm:p-6 space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white pb-3 border-b border-slate-700/50">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            Player Information
          </h2>

          <Field icon={User} label="Full Name" error={errors.name}>
            <input type="text" placeholder="Player name" {...register("name")} className={inputCls(errors.name)} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field icon={Mail} label="Email" error={errors.email}>
              <input type="email" placeholder="player@email.com" {...register("email")} className={inputCls(errors.email)} />
            </Field>
            <Field icon={Phone} label="Contact Number" error={errors.contact}>
              <input type="tel" placeholder="04xx xxx xxx" {...register("contact")} className={inputCls(errors.contact)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field icon={Calendar} label="Date of Birth" error={errors.dob}>
              <input type="date" {...register("dob")} className={inputCls(errors.dob)} />
            </Field>
            <Field icon={Award} label="Grade" error={errors.grade}>
              <input type="text" placeholder="e.g. A" maxLength={5} {...register("grade")} className={`${inputCls(errors.grade)} uppercase`} />
            </Field>
            <Field icon={Hash} label="Member No." error={errors.memberNo}>
              <input type="text" placeholder="Badminton Victoria no." {...register("memberNo")} className={inputCls(errors.memberNo)} />
            </Field>
          </div>
          <p className="text-xs text-slate-500">Name, email and contact number are required.</p>
        </section>

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
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Register Player"}
          </button>
        </div>
      </form>
    </AppBackground>
  );
};

export default PlayerRegistration;
