import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchClubsAPI } from "./master.services";

export const useMasterClubs = (env, { search, status, page, limit = 20 }, enabled) =>
  useQuery({
    queryKey: ["master-clubs", env?.key, search, status, page, limit],
    queryFn: () => fetchClubsAPI(env, { search, status, page, limit }),
    enabled: !!env && enabled,
    placeholderData: keepPreviousData,
    retry: 1,
    staleTime: 15000,
  });
