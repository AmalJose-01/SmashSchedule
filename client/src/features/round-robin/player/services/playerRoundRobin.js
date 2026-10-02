import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "../../../../services/api/axiosInstance.js";

export const getRoundRobinView = async (id) => (await apiClient.get(`/club/round-robin/${id}`)).data;

export const useRoundRobinView = (id) =>
  useQuery({
    queryKey: ["player-round-robin", id],
    queryFn: () => getRoundRobinView(id),
    enabled: !!id,
    refetchInterval: 30000, // live-ish scores during play
    staleTime: 15000,
  });

export const joinRoundRobin = async (id) => (await apiClient.post(`/club/round-robin/${id}/join`)).data;

// Player registers themselves for a round robin. Refreshes the round robin
// page and every club's event list (slot counts change).
export const useJoinRoundRobin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: joinRoundRobin,
    onSuccess: (res, id) => {
      toast.success(res?.message || "You're registered!");
      qc.invalidateQueries({ queryKey: ["player-round-robin", id] });
      qc.invalidateQueries({ queryKey: ["club-events"] });
    },
    onError: (err, id) => {
      toast.error(err.response?.data?.message || "Couldn't join this round robin");
      qc.invalidateQueries({ queryKey: ["player-round-robin", id] });
      qc.invalidateQueries({ queryKey: ["club-events"] });
    },
  });
};

export const leaveRoundRobin = async (id) => (await apiClient.delete(`/club/round-robin/${id}/join`)).data;

// Player cancels their registration (allowed only before the deadline).
export const useLeaveRoundRobin = () => {
  const qc = useQueryClient();
  const refresh = (id) => {
    qc.invalidateQueries({ queryKey: ["player-round-robin", id] });
    qc.invalidateQueries({ queryKey: ["club-events"] });
  };
  return useMutation({
    mutationFn: leaveRoundRobin,
    onSuccess: (res, id) => {
      toast.success(res?.message || "Registration cancelled");
      refresh(id);
    },
    onError: (err, id) => {
      toast.error(err.response?.data?.message || "Couldn't cancel your registration");
      refresh(id);
    },
  });
};
