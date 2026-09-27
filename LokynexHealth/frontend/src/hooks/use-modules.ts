import { getModulesApi } from "@/lib/api/modules";
import { useQuery } from "@tanstack/react-query";

// Modules are effectively static (seeded once per tenant) — safe to cache.
export function useModules() {
  return useQuery({
    queryKey: ["modules"],
    queryFn: getModulesApi,
    staleTime: 5 * 60 * 1000,
  });
}
