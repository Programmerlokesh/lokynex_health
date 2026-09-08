import { getBranchesApi, updateBranchApi } from "@/lib/api/branches";
import { UpdateBranchRequest } from "@/types/branch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useBranches(params: {
  search?: string;
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["branches", params],
    queryFn: () => getBranchesApi(params),
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBranchRequest }) =>
      updateBranchApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}
