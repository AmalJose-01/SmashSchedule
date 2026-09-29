import { useQuery } from "@tanstack/react-query";
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
