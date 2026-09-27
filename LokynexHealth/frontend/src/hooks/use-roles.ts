import { getRolesApi } from "@/lib/api/roles";
import { useQuery } from "@tanstack/react-query";

// Roles rarely change — a longer staleTime avoids refetching every time the
// Create/Edit User dialog opens.
export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: getRolesApi,
    staleTime: 5 * 60 * 1000,
  });
}
