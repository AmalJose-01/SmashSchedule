import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getMembersAPI,
    createMemberAPI,
    updateMemberAPI,
    deleteMemberAPI,
    addMembersToTournamentAPI,
    bulkImportMembersAPI,
    getTournamentPlayersAPI,
    removePlayerFromTournamentAPI,
    bulkAddPlayersToTournamentAPI,
} from "../../services/admin/roundRobinService";
import { toast } from "sonner";

export const useGetTournamentPlayers = (tournamentId) => {
    return useQuery({
        queryKey: ["tournamentPlayers", tournamentId],
        queryFn: () => getTournamentPlayersAPI(tournamentId),
        enabled: !!tournamentId,
    });
};

export const useRemovePlayerFromTournament = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ tournamentId, playerId }) => removePlayerFromTournamentAPI(tournamentId, playerId),
        onSuccess: (_, variables) => {
            toast.success("Player removed from tournament");
            queryClient.invalidateQueries(["tournamentPlayers", variables.tournamentId]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to remove player");
        },
    });
};

export const useAddMembersToTournament = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addMembersToTournamentAPI,
        onSuccess: (data, variables) => {
            toast.success(data.message || "Members added to tournament");
            queryClient.invalidateQueries(["tournamentPlayers", variables.tournamentId]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to add members");
        },
    });
};

export const useBulkAddPlayersToTournament = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: bulkAddPlayersToTournamentAPI,
        onSuccess: (data, variables) => {
            toast.success(data.message || "Bulk import completed");
            queryClient.invalidateQueries(["tournamentPlayers", variables.tournamentId]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to bulk add players");
        },
    });
};

export const useGetMembers = () => {
    return useQuery({
        queryKey: ["roundRobinMembers"],
        queryFn: getMembersAPI,
        select: (data) => data.members,
    });
};

export const useCreateMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createMemberAPI,
        onSuccess: () => {
            toast.success("Member created successfully");
            queryClient.invalidateQueries(["roundRobinMembers"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to create member");
        },
    });
};

export const useUpdateMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }) => updateMemberAPI(id, data),
        onSuccess: () => {
            toast.success("Member updated successfully");
            queryClient.invalidateQueries(["roundRobinMembers"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update member");
        },
    });
};

export const useDeleteMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteMemberAPI,
        onSuccess: () => {
            toast.success("Member deleted successfully");
            queryClient.invalidateQueries(["roundRobinMembers"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to delete member");
        },
    });
};

export const useBulkImportMembers = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: bulkImportMembersAPI,
        onSuccess: (data) => {
            toast.success(data.message || "Import completed");
            queryClient.invalidateQueries(["roundRobinMembers"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to import members");
        },
    });
};
