import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getRoundRobinTournamentsAPI,
  getRoundRobinTournamentByIdAPI,
  createRoundRobinTournamentAPI,
  updateRoundRobinTournamentAPI,
  deleteRoundRobinTournamentAPI,
  finalizeRoundRobinTournamentAPI,
  getRoundRobinMembersAPI,
  getRoundRobinMemberByIdAPI,
  createRoundRobinMemberAPI,
  updateRoundRobinMemberAPI,
  deleteRoundRobinMemberAPI,
  bulkImportRoundRobinMembersAPI,
  addMembersToTournamentAPI,
  getTournamentPlayersAPI,
  removePlayerFromTournamentAPI,
  generateGroupsAPI,
  saveGroupsAPI,
  getGroupsAPI,
  getMatchesAPI,
  getStandingsAPI,
  recordMatchScoreAPI,
  updateMatchAPI,
} from "./roundRobin.services.js";

export const rrKeys = {
  tournaments: ["rr-tournaments"],
  tournament: (id) => ["rr-tournament", id],
  members: ["rr-members"],
  member: (id) => ["rr-member", id],
  players: (tournamentId) => ["rr-players", tournamentId],
  groups: (tournamentId) => ["rr-groups", tournamentId],
  matches: (tournamentId) => ["rr-matches", tournamentId],
  standings: (tournamentId) => ["rr-standings", tournamentId],
};

// ── Tournaments ──────────────────────────────────────────────────────────────
export const useGetRoundRobinTournaments = () =>
  useQuery({
    queryKey: rrKeys.tournaments,
    queryFn: getRoundRobinTournamentsAPI,
    staleTime: 1000 * 60 * 2,
  });

export const useGetRoundRobinTournament = (id) =>
  useQuery({
    queryKey: rrKeys.tournament(id),
    queryFn: () => getRoundRobinTournamentByIdAPI(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });

export const useCreateRoundRobinTournament = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRoundRobinTournamentAPI,
    onSuccess: () => {
      toast.success("Tournament created");
      queryClient.invalidateQueries({ queryKey: rrKeys.tournaments });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to create tournament"),
  });
};

export const useUpdateRoundRobinTournament = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRoundRobinTournamentAPI,
    onSuccess: (_, { id }) => {
      toast.success("Tournament updated");
      queryClient.invalidateQueries({ queryKey: rrKeys.tournaments });
      queryClient.invalidateQueries({ queryKey: rrKeys.tournament(id) });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update tournament"),
  });
};

export const useDeleteRoundRobinTournament = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRoundRobinTournamentAPI,
    onSuccess: () => {
      toast.success("Tournament deleted");
      queryClient.invalidateQueries({ queryKey: rrKeys.tournaments });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to delete tournament"),
  });
};

export const useFinalizeRoundRobinTournament = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: finalizeRoundRobinTournamentAPI,
    onSuccess: (_, id) => {
      toast.success("Tournament finalized");
      queryClient.invalidateQueries({ queryKey: rrKeys.tournament(id) });
      queryClient.invalidateQueries({ queryKey: rrKeys.tournaments });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to finalize tournament"),
  });
};

// ── Members ──────────────────────────────────────────────────────────────────
export const useGetRoundRobinMembers = () =>
  useQuery({
    queryKey: rrKeys.members,
    queryFn: getRoundRobinMembersAPI,
    staleTime: 1000 * 60 * 2,
  });

export const useGetRoundRobinMember = (memberId) =>
  useQuery({
    queryKey: rrKeys.member(memberId),
    queryFn: () => getRoundRobinMemberByIdAPI(memberId),
    enabled: !!memberId,
  });

export const useCreateRoundRobinMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRoundRobinMemberAPI,
    onSuccess: () => {
      toast.success("Member added");
      queryClient.invalidateQueries({ queryKey: rrKeys.members });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to add member"),
  });
};

export const useUpdateRoundRobinMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRoundRobinMemberAPI,
    onSuccess: () => {
      toast.success("Member updated");
      queryClient.invalidateQueries({ queryKey: rrKeys.members });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update member"),
  });
};

export const useDeleteRoundRobinMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRoundRobinMemberAPI,
    onSuccess: () => {
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: rrKeys.members });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to remove member"),
  });
};

export const useBulkImportRoundRobinMembers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkImportRoundRobinMembersAPI,
    onSuccess: (data) => {
      const { success, failed } = data.data;
      toast.success(`Imported ${success} member(s)${failed > 0 ? `, ${failed} skipped` : ""}`);
      queryClient.invalidateQueries({ queryKey: rrKeys.members });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Bulk import failed"),
  });
};

// ── Tournament Players ────────────────────────────────────────────────────────
export const useAddMembersToTournament = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addMembersToTournamentAPI,
    onSuccess: (_, { tournamentId }) => {
      toast.success("Players added to tournament");
      queryClient.invalidateQueries({ queryKey: rrKeys.players(tournamentId) });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to add players"),
  });
};

export const useGetTournamentPlayers = (tournamentId) =>
  useQuery({
    queryKey: rrKeys.players(tournamentId),
    queryFn: () => getTournamentPlayersAPI(tournamentId),
    enabled: !!tournamentId,
    staleTime: 1000 * 60 * 2,
  });

export const useRemovePlayerFromTournament = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removePlayerFromTournamentAPI,
    onSuccess: (_, { tournamentId }) => {
      toast.success("Player removed");
      queryClient.invalidateQueries({ queryKey: rrKeys.players(tournamentId) });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to remove player"),
  });
};

// ── Groups ────────────────────────────────────────────────────────────────────
export const useGenerateGroups = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateGroupsAPI,
    onSuccess: (_, tournamentId) => {
      toast.success("Groups and matches generated");
      queryClient.invalidateQueries({ queryKey: rrKeys.tournament(tournamentId) });
      queryClient.invalidateQueries({ queryKey: rrKeys.groups(tournamentId) });
      queryClient.invalidateQueries({ queryKey: rrKeys.matches(tournamentId) });
      queryClient.invalidateQueries({ queryKey: rrKeys.standings(tournamentId) });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to generate groups"),
  });
};

export const useSaveGroups = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveGroupsAPI,
    onSuccess: (_, { tournamentId }) => {
      toast.success("Groups saved and matches generated");
      queryClient.invalidateQueries({ queryKey: rrKeys.groups(tournamentId) });
      queryClient.invalidateQueries({ queryKey: rrKeys.matches(tournamentId) });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to save groups"),
  });
};

export const useGetGroups = (tournamentId) =>
  useQuery({
    queryKey: rrKeys.groups(tournamentId),
    queryFn: () => getGroupsAPI(tournamentId),
    enabled: !!tournamentId,
    staleTime: 1000 * 60 * 2,
  });

// ── Matches & Standings ───────────────────────────────────────────────────────
export const useGetMatches = (tournamentId) =>
  useQuery({
    queryKey: rrKeys.matches(tournamentId),
    queryFn: () => getMatchesAPI(tournamentId),
    enabled: !!tournamentId,
    staleTime: 1000 * 60,
  });

export const useGetStandings = (tournamentId) =>
  useQuery({
    queryKey: rrKeys.standings(tournamentId),
    queryFn: () => getStandingsAPI(tournamentId),
    enabled: !!tournamentId,
    staleTime: 1000 * 60,
  });

export const useRecordMatchScore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recordMatchScoreAPI,
    onSuccess: (data, { tournamentId }) => {
      toast.success("Score recorded");
      if (tournamentId) {
        queryClient.invalidateQueries({ queryKey: rrKeys.matches(tournamentId) });
        queryClient.invalidateQueries({ queryKey: rrKeys.standings(tournamentId) });
        queryClient.invalidateQueries({ queryKey: rrKeys.groups(tournamentId) });
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to record score"),
  });
};

export const useUpdateMatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMatchAPI,
    onSuccess: (_, { tournamentId }) => {
      toast.success("Match updated");
      if (tournamentId) {
        queryClient.invalidateQueries({ queryKey: rrKeys.matches(tournamentId) });
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update match"),
  });
};
