import {
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
import AppBackground from "../../components/AppBackground";
import PageHeader from "../../components/PageHeader";
import AddressSearch from "../../components/AddressSearch";
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

// Same dark field style as the round robin create page.
const inputCls = (err) =>
  `w-full bg-slate-900/50 border rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${err ? "border-red-500" : "border-slate-600"}`;

const cardCls =
  "bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-5 sm:p-6 space-y-4";
const cardTitleCls =
  "flex items-center gap-2 text-lg font-semibold text-white pb-3 border-b border-slate-700/50";

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

const CreateTournament = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [matchTypeValue, setMatchTypeValue] = useState("Singles"); // state to hold selected value
  const [playTypeValue, setPlayTypeValue] = useState("group"); // state to hold selected value

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
      playType: "group",
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

  useEffect(() => {}, [matchTypeValue, playTypeValue]);

  return (
    <AppBackground>
      <PageHeader
        title="Create New Tournament"
        subtitle="Tournament details, format and courts"
        onBack={onClose}
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6"
      >
        {/* Two cards side by side on large screens, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ── Tournament Detail ── */}
          <section className={cardCls}>
            <h2 className={cardTitleCls}>
              <Trophy className="w-5 h-5 text-cyan-400" />
              Tournament Detail
            </h2>

            <Field icon={Shield} label="Tournament Name" error={errors.tournamentName}>
              <input
                type="text"
                placeholder="Tournament Name"
                {...register("tournamentName")}
                className={inputCls(errors.tournamentName)}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field icon={Calendar} label="Date" error={errors.date}>
                <input type="date" required {...register("date")} className={inputCls(errors.date)} />
              </Field>
              <Field icon={Clock} label="Time" error={errors.time}>
                <input type="time" required {...register("time")} className={inputCls(errors.time)} />
              </Field>
            </div>

            <Field icon={MapPin} label="Location" error={errors.location}>
              {/* Google address search (same as Club Profile). The picked
                  address — or whatever is typed — is saved as "location". */}
              <input type="hidden" {...register("location")} />
              <AddressSearch
                placeholder="Search venue address..."
                className={inputCls(errors.location)}
                onTextChange={(text) => setValue("location", text, { shouldValidate: !!errors.location })}
                onAddressSelect={(place) =>
                  setValue("location", place.address, { shouldValidate: true, shouldDirty: true })
                }
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field icon={Users} label="Maximum Participants/Team" error={errors.maximumParticipants}>
                <input
                  type="number"
                  required
                  min="2"
                  {...register("maximumParticipants")}
                  className={inputCls(errors.maximumParticipants)}
                  placeholder="Max participants"
                />
              </Field>
              <Field icon={DollarSign} label="Registration Fee" error={errors.registrationFee}>
                <input
                  type="number"
                  required
                  {...register("registrationFee")}
                  className={inputCls(errors.registrationFee)}
                  placeholder="0 = free"
                />
              </Field>
            </div>
          </section>

          {/* ── Tournament Format ── */}
          <section className={cardCls}>
            <h2 className={cardTitleCls}>
              <Layers className="w-5 h-5 text-cyan-400" />
              Tournament Format
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field icon={Users} label="Match Type" error={errors.matchType}>
                <select
                  {...register("matchType", { required: true })}
                  value={matchTypeValue}
                  onChange={(e) => {
                    setMatchTypeValue(e.target.value);
                    setValue("matchType", e.target.value);
                  }}
                  className={inputCls(errors.matchType)}
                >
                  <option value="Singles">Singles</option>
                  <option value="Doubles">Doubles</option>
                </select>
              </Field>

              <Field
                icon={Grid3x3}
                label={matchTypeValue === "Singles" ? "Players per Group" : "Teams per Group"}
                error={errors.teamsPerGroup}
              >
                <input
                  type="number"
                  required
                  min="2"
                  {...register("teamsPerGroup")}
                  className={inputCls(errors.teamsPerGroup)}
                  placeholder="e.g. 4"
                />
              </Field>

              <div className={playTypeValue === "group-knockout" ? "" : "sm:col-span-2"}>
                <Field icon={Layers} label="Play Type" error={errors.playType}>
                  <select
                    {...register("playType", { required: true })}
                    value={playTypeValue}
                    onChange={(e) => {
                      setPlayTypeValue(e.target.value);
                      setValue("playType", e.target.value);
                    }}
                    className={inputCls(errors.playType)}
                  >
                    <option value="group">Group Stage</option>
                    <option value="knockout">Knockout</option>
                    <option value="group-knockout">Group + Knockout</option>
                  </select>
                </Field>
              </div>

              {playTypeValue === "group-knockout" && (
                <Field
                  icon={Trophy}
                  label="Qualified to Knockout"
                  error={errors.numberOfPlayersQualifiedToKnockout}
                >
                  <input
                    type="number"
                    min="1"
                    {...register("numberOfPlayersQualifiedToKnockout")}
                    className={inputCls(errors.numberOfPlayersQualifiedToKnockout)}
                  />
                </Field>
              )}

              <div className="sm:col-span-2">
                <Field icon={MapPin} label="Number of Courts Available" error={errors.numberOfCourts}>
                  <input
                    type="number"
                    required
                    min="1"
                    {...register("numberOfCourts")}
                    className={inputCls(errors.numberOfCourts)}
                    placeholder="Enter number of courts"
                  />
                </Field>
              </div>
            </div>

            <Field label="Description" error={errors.description}>
              <textarea
                rows={3}
                {...register("description")}
                className={`${inputCls(errors.description)} resize-none`}
                placeholder="Enter tournament description and rules"
              />
            </Field>
          </section>
        </div>

        {/* Actions — full width under both cards */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
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
            {isPending ? "Saving..." : "Create Tournament"}
          </button>
        </div>
      </form>
    </AppBackground>
  );
};

export default CreateTournament;
