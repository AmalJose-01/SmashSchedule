import { useQuery } from "@tanstack/react-query";
import { searchClubs } from "./clubSearch.services.js";

export const clubSearchQueryKeys = {
  all: ["club-search"],
  results: (params) => [...clubSearchQueryKeys.all, params],
};

export const useSearchClubs = (params = {}) => {
  return useQuery({
    queryKey: clubSearchQueryKeys.results(params),
    queryFn: () => searchClubs(params),
    staleTime: 1000 * 60 * 2,
    enabled: true, // always fetch — shows all clubs by default
  });
};
