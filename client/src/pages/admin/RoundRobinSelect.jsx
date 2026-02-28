import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetMembers, useAddMembersToTournament, useGetTournamentPlayers, useRemovePlayerFromTournament } from "../../hooks/roundRobin/useRoundRobin";
import { ArrowLeft, CheckCircle, Search, UserPlus } from "lucide-react";
import { useEffect } from "react";

const RoundRobinSelect = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const tournamentId = location.state?.tournamentId;

    if (!tournamentId) {
        navigate("/setup-tournament"); // fallback if no ID
        return null;
    }

    const { data: members, isLoading } = useGetMembers();
    const { data: tournamentData } = useGetTournamentPlayers(tournamentId);
    const addMutation = useAddMembersToTournament();
    const removeMutation = useRemovePlayerFromTournament();

    const [selectedIds, setSelectedIds] = useState([]);
    const [initialSelectedIds, setInitialSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Pre-select players already in the tournament
    useEffect(() => {
        if (tournamentData?.teams && members) {
            // Match tournament players with pool members by email to find their IDs in the pool
            const existingEmails = tournamentData.teams.map(p => p.email);
            const preSelectedIds = members
                .filter(m => existingEmails.includes(m.email))
                .map(m => m._id);

            setSelectedIds(preSelectedIds);
            setInitialSelectedIds(preSelectedIds);
        }
    }, [tournamentData, members]);

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = (filtered) => {
        if (selectedIds.length === filtered.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filtered.map(m => m._id));
        }
    };

    const handleConfirm = async () => {
        console.log("initialSelectedIds", initialSelectedIds);
        console.log("selectedIds", selectedIds);
        const newlySelected = selectedIds.filter(id => !initialSelectedIds.includes(id));
        const deselected = initialSelectedIds.filter(id => !selectedIds.includes(id));
console.log("deselected", deselected);

        if (newlySelected.length === 0 && deselected.length === 0) return;

        try {
            // Remove deselected players
            for (const playerId of deselected) {
                await removeMutation.mutateAsync({ tournamentId, playerId });
            }

            // Add newly selected players
            if (newlySelected.length > 0) {
                await addMutation.mutateAsync({
                    tournamentId,
                    memberIds: newlySelected,
                });
            }

            navigate("/setup-tournament", { replace: true });
        } catch (error) {
            // Error toasts are handled by the mutation hooks
        }
    };

    const filteredMembers = members?.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-full">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Select Players for Tournament</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <div className="relative flex-1 min-w-[250px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search existing players..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => navigate("/round-robin-manage")}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium flex items-center gap-2"
                            >
                                <UserPlus className="w-4 h-4" /> Manage Pool
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={addMutation.isPending || removeMutation.isPending}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                {addMutation.isPending || removeMutation.isPending ? "Saving..." : `Save Selection (${selectedIds.length})`}
                                <CheckCircle className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-4 w-12">
                                        <input
                                            type="checkbox"
                                            onChange={() => handleSelectAll(filteredMembers)}
                                            checked={filteredMembers.length > 0 && selectedIds.length === filteredMembers.length}
                                            className="w-4 h-4 cursor-pointer"
                                        />
                                    </th>
                                    <th className="p-4 font-semibold text-gray-600">Name</th>
                                    <th className="p-4 font-semibold text-gray-600">Grade</th>
                                    <th className="p-4 font-semibold text-gray-600">Email</th>
                                    <th className="p-4 font-semibold text-gray-600">Contact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading...</td></tr>
                                ) : filteredMembers.length === 0 ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">No members found matching your search.</td></tr>
                                ) : (
                                    filteredMembers.map((member) => (
                                        <tr
                                            key={member._id}
                                            className={`hover:bg-blue-50 transition cursor-pointer ${selectedIds.includes(member._id) ? "bg-blue-50" : ""}`}
                                            onClick={() => toggleSelection(member._id)}
                                        >
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(member._id)}
                                                    onChange={() => { }} // handled by row click
                                                    className="w-4 h-4 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-4 font-medium text-gray-800">{member.name}</td>
                                            <td className="p-4 text-gray-600"><span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold">{member.grade}</span></td>
                                            <td className="p-4 text-gray-600">{member.email}</td>
                                            <td className="p-4 text-gray-600">{member.contact}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoundRobinSelect;
