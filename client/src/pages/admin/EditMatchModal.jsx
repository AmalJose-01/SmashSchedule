import React, { useState, useEffect } from "react";
import { X, Calendar, MapPin, Trophy } from "lucide-react";
import { toast } from "sonner";
import { updateKnockoutMatchAPI } from "../../services/admin/adminTeamServices";
import { useQuery } from "@tanstack/react-query";
// Sub-component for Venue/Court selection
import useGetVenue from "../../hooks/venue/useGetVenue";
import useGetDetailVenue from "../../hooks/venue/useVenueDetail";
import { useDispatch } from "react-redux";
import { setVenueData } from "../../redux/slices/venueSlice";

const EditMatchModal = ({ match, isOpen, onClose, onUpdate }) => {
    if (!isOpen || !match) return null;

    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [courtType, setCourtType] = useState("manual"); // 'manual' or 'venue'
    const [selectedVenue, setSelectedVenue] = useState("");
    const [selectedCourt, setSelectedCourt] = useState("");
    const [manualCourt, setManualCourt] = useState("");
    const [isWalkover, setIsWalkover] = useState(false);
    const [winner, setWinner] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Initialize state from match data
    useEffect(() => {
        if (match) {
            setStartTime(match.startTime ? new Date(match.startTime).toISOString().slice(0, 16) : "");
            setEndTime(match.endTime ? new Date(match.endTime).toISOString().slice(0, 16) : "");
            setManualCourt(match.courtNumber || "");
            setSelectedVenue(match.venueId || "");
            setSelectedCourt(match.courtId || "");
            setCourtType(match.venueId ? "venue" : "manual");
            setIsWalkover(match.isWalkover || false);
            setWinner(match.winner || "");
        }
    }, [match]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const payload = {
                startTime,
                endTime,
                isWalkover,
                winner: isWalkover ? winner : null,
            };

            if (courtType === "manual") {
                payload.courtNumber = manualCourt;
                payload.venueId = null;
                payload.courtId = null;
            } else {
                payload.venueId = selectedVenue;
                payload.courtId = selectedCourt;
                // payload.courtNumber = ... // Could get from court object if needed
            }

            await updateKnockoutMatchAPI(match._id, payload);
            toast.success("Match updated successfully!");
            onUpdate(); // Refresh parent
            onClose();
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || "Failed to update match");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center text-white">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Calendar className="w-5 h-5" /> Schedule Match
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    {/* Teams */}
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                        <span className="font-semibold text-gray-800">{match.teamsHome?.teamName}</span>
                        <span className="text-gray-400 font-bold">VS</span>
                        <span className="font-semibold text-gray-800">{match.teamsAway?.teamName}</span>
                    </div>

                    {/* Time Scheduling */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                                type="datetime-local"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input
                                type="datetime-local"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Court Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Court Assignment</label>
                        <div className="flex gap-4 mb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="courtType"
                                    value="manual"
                                    checked={courtType === "manual"}
                                    onChange={() => setCourtType("manual")}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span>Manual Entry</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="courtType"
                                    value="venue"
                                    checked={courtType === "venue"}
                                    onChange={() => setCourtType("venue")}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span>Select from Venue</span>
                            </label>
                        </div>

                        {courtType === "manual" ? (
                            <input
                                type="text"
                                placeholder="Enter Court Name/Number"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={manualCourt}
                                onChange={(e) => setManualCourt(e.target.value)}
                            />
                        ) : (
                            <VenueCourtSelector
                                selectedVenue={selectedVenue}
                                setSelectedVenue={setSelectedVenue}
                                selectedCourt={selectedCourt}
                                setSelectedCourt={setSelectedCourt}
                            />
                        )}
                    </div>

                    {/* Walkover Section */}
                    <div className="border-t pt-4">
                        <label className="flex items-center gap-2 cursor-pointer mb-3">
                            <input
                                type="checkbox"
                                checked={isWalkover}
                                onChange={(e) => setIsWalkover(e.target.checked)}
                                className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                            />
                            <span className="font-bold text-red-600">Mark as Walkover</span>
                        </label>

                        {isWalkover && (
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200 animate-in fade-in slide-in-from-top-2">
                                <p className="text-sm text-red-800 mb-2 font-medium">Who gets the walkover?</p>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-red-100 transition flex-1 border border-red-200 bg-white">
                                        <input
                                            type="radio"
                                            name="winner"
                                            value="home"
                                            checked={winner === "home"}
                                            onChange={() => setWinner("home")}
                                            className="text-red-600"
                                        />
                                        <span className="text-sm font-semibold">{match.teamsHome?.teamName}</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-red-100 transition flex-1 border border-red-200 bg-white">
                                        <input
                                            type="radio"
                                            name="winner"
                                            value="away"
                                            checked={winner === "away"}
                                            onChange={() => setWinner("away")}
                                            className="text-red-600"
                                        />
                                        <span className="text-sm font-semibold">{match.teamsAway?.teamName}</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md shadow-blue-200 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const VenueCourtSelector = ({ selectedVenue, setSelectedVenue, selectedCourt, setSelectedCourt }) => {
    const { venues } = useGetVenue();
    const dispatch = useDispatch();

    // When venue changes, we need to allow useGetDetailVenue to fetch courts for that venue
    // The existing hook useGetDetailVenue relies on Redux state `venue.venueData.id`
    // So we need to dispatch an action to update that state when a venue is selected here.

    useEffect(() => {
        if (selectedVenue) {
            dispatch(setVenueData({ id: selectedVenue }));
        }
    }, [selectedVenue, dispatch]);

    const { venueDetail, isLoading: isLoadingCourts } = useGetDetailVenue();

    return (
        <div className="space-y-3">
            <select
                className="w-full p-2 border rounded-lg bg-white"
                value={selectedVenue}
                onChange={(e) => {
                    setSelectedVenue(e.target.value);
                    setSelectedCourt(""); // Reset court when venue changes
                }}
            >
                <option value="">Select Venue</option>
                {venues?.map(venue => (
                    <option key={venue._id} value={venue._id}>{venue.venueName}</option>
                ))}
            </select>

            <select
                className="w-full p-2 border rounded-lg bg-white"
                value={selectedCourt}
                onChange={(e) => setSelectedCourt(e.target.value)}
                disabled={!selectedVenue}
            >
                <option value="">{isLoadingCourts ? "Loading Courts..." : "Select Court"}</option>
                {venueDetail?.courts?.map(court => (
                    <option key={court._id} value={court._id}>
                        {court.name} - {court.courtType} {court.gameStatus ? '(Busy)' : '(Free)'}
                    </option>
                ))}
            </select>

            {/* Show warning if court is busy */}
            {venueDetail?.courts?.find(c => c._id === selectedCourt)?.gameStatus && (
                <p className="text-red-500 text-xs text-right font-medium">Warning: This court is currently marked as busy.</p>
            )}
        </div>
    )
}

export default EditMatchModal;
