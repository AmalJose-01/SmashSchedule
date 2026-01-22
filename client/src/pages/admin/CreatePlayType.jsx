import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
    X,
    Save,
    ClipboardList,
    Type,
    List,
    Hash,
    CheckSquare,
    Trophy,
    Scale
} from "lucide-react";
import { toast } from "sonner";
import Logout from "../../components/Logout";

const CreatePlayType = () => {
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            name: "",
            matchFormat: "Best of 3",
            scoringSystem: "Rally Point",
            rule: "BWF",
            maxScore: 21,
            twoPointsDifference: true,
            winPoint: 3,
            drawPoint: 1,
            walkoverPoint: 3,
        },
    });

    const ruleValue = watch("rule");

    // If rule is "BWF", we might want to lock some fields or auto-fill them.
    // For now, leaving them editable but could add logic here.

    const onSubmit = async (data) => {
        console.log("Create Play Type Data:", data);
        // TODO: Connect to backend API when available

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        toast.success("Play Type created successfully! (Mock)");
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
                    <ClipboardList
                        className="w-8 h-8 text-blue-600 cursor-pointer"
                        onClick={() => navigate("/admin-home")}
                    />
                    <h2 className="text-xl font-bold text-slate-800">
                        Create Play Type
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
                        <ClipboardList className="w-6 h-6" />
                        <h2 className="text-2xl font-bold">Scoring Rules & Format</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 flex flex-col gap-6">
                    {/* Name */}
                    <div>
                        <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                            <Type className="w-4 h-4 text-blue-500" />
                            Name
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., Standard BWF, Quick Match"
                            {...register("name", { required: "Name is required" })}
                            className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Match Format */}
                        <div>
                            <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                                <Trophy className="w-4 h-4 text-blue-500" />
                                Match Format
                            </label>
                            <select
                                {...register("matchFormat", { required: "Match Format is required" })}
                                className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                            >
                                <option value="Single Set">Single Set</option>
                                <option value="Best of 3">Best of 3</option>
                                <option value="Best of 5">Best of 5</option>
                            </select>
                            {errors.matchFormat && (
                                <p className="text-red-500 text-sm mt-1">{errors.matchFormat.message}</p>
                            )}
                        </div>

                        {/* Scoring System */}
                        <div>
                            <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                                <Scale className="w-4 h-4 text-blue-500" />
                                Scoring System
                            </label>
                            <select
                                {...register("scoringSystem", { required: "Scoring System is required" })}
                                className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                            >
                                <option value="Rally Point">Rally Point</option>
                                <option value="Service Over">Service Over</option>
                            </select>
                            {errors.scoringSystem && (
                                <p className="text-red-500 text-sm mt-1">{errors.scoringSystem.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Rule */}
                        <div>
                            <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                                <List className="w-4 h-4 text-blue-500" />
                                Rule
                            </label>
                            <select
                                {...register("rule", { required: "Rule is required" })}
                                className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                            >
                                <option value="BWF">BWF</option>
                                <option value="Custom">Custom</option>
                            </select>
                            {errors.rule && (
                                <p className="text-red-500 text-sm mt-1">{errors.rule.message}</p>
                            )}
                        </div>

                        {/* Maximum Score */}
                        <div>
                            <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                                <Hash className="w-4 h-4 text-blue-500" />
                                Maximum Score
                            </label>
                            <input
                                type="number"
                                placeholder="e.g., 21"
                                {...register("maxScore", { required: "Maximum Score is required", min: 1 })}
                                className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            {errors.maxScore && (
                                <p className="text-red-500 text-sm mt-1">{errors.maxScore.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Win Points */}
                        <div>
                            <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                                <Trophy className="w-4 h-4 text-green-500" />
                                Win Points
                            </label>
                            <input
                                type="number"
                                placeholder="e.g., 3"
                                {...register("winPoint", { required: "Required", min: 0 })}
                                className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            />
                            {errors.winPoint && (
                                <p className="text-red-500 text-sm mt-1">{errors.winPoint.message}</p>
                            )}
                        </div>

                        {/* Draw Points */}
                        <div>
                            <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                                <Scale className="w-4 h-4 text-yellow-500" />
                                Draw Points
                            </label>
                            <input
                                type="number"
                                placeholder="e.g., 1"
                                {...register("drawPoint", { required: "Required", min: 0 })}
                                className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                            />
                            {errors.drawPoint && (
                                <p className="text-red-500 text-sm mt-1">{errors.drawPoint.message}</p>
                            )}
                        </div>

                        {/* Walkover Points */}
                        <div>
                            <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                                <CheckSquare className="w-4 h-4 text-blue-500" />
                                Walkover Points
                            </label>
                            <input
                                type="number"
                                placeholder="e.g., 3"
                                {...register("walkoverPoint", { required: "Required", min: 0 })}
                                className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            {errors.walkoverPoint && (
                                <p className="text-red-500 text-sm mt-1">{errors.walkoverPoint.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Two Points Difference */}
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <input
                            type="checkbox"
                            id="twoPointsDifference"
                            {...register("twoPointsDifference")}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="twoPointsDifference" className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer select-none">
                            <CheckSquare className="w-4 h-4 text-blue-500" />
                            Need Two Points Difference (Deuce)
                        </label>
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
                            {isSubmitting ? "Saving..." : "Create Play Type"}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default CreatePlayType;
