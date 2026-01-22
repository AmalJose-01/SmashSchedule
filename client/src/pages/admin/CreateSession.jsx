import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { X, Save, Calendar, Clock, Type, AlignLeft } from "lucide-react";
import { toast } from "sonner";
import Logout from "../../components/Logout";

const CreateSession = () => {
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            sessionName: "",
            date: "",
            time: "",
            description: "",
            maxParticipants: 10,
        },
    });

    const onSubmit = async (data) => {
        console.log("Create Session Data:", data);
        // TODO: Connect to backend API when available
        // await createSessionAPI(data);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        toast.success("Session created successfully! (Mock)");
        navigate("/admin-home");
    };

    const onClose = () => {
        navigate("/admin-home");
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Calendar
                        className="w-8 h-8 text-blue-600 cursor-pointer"
                        onClick={() => navigate("/admin-home")}
                    />
                    <h2 className="text-xl font-bold text-slate-800">
                        Create New Session
                    </h2>
                </div>

                <div className="flex gap-2">
                    <Logout />
                </div>
            </div>

            {/* Content View */}
            <div className="card w-full max-w-2xl mx-auto shadow-xl rounded-2xl bg-white mt-8 overflow-hidden border border-slate-100">
                <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-6 h-6" />
                        <h2 className="text-2xl font-bold">Session Details</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 flex flex-col gap-6">
                    {/* Session Name */}
                    <div>
                        <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                            <Type className="w-4 h-4" />
                            Session Name
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., Friday Night Training"
                            {...register("sessionName", { required: "Session Name is required" })}
                            className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        {errors.sessionName && (
                            <p className="text-red-500 text-sm mt-1">{errors.sessionName.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Date */}
                        <div>
                            <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                                <Calendar className="w-4 h-4" />
                                Date
                            </label>
                            <input
                                type="date"
                                {...register("date", { required: "Date is required" })}
                                className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            {errors.date && (
                                <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                            )}
                        </div>

                        {/* Time */}
                        <div>
                            <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                                <Clock className="w-4 h-4" />
                                Time
                            </label>
                            <input
                                type="time"
                                {...register("time", { required: "Time is required" })}
                                className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            {errors.time && (
                                <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                            <AlignLeft className="w-4 h-4" />
                            Description
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Enter details about this session..."
                            {...register("description")}
                            className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4 mt-4 pt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex justify-center items-center gap-2"
                        >
                            <X className="w-5 h-5" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-200"
                        >
                            <Save className="w-5 h-5" />
                            {isSubmitting ? "Creating..." : "Create Session"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSession;
