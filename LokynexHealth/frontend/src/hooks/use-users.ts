import { createUserApi, getUsersApi } from "@/lib/api/users";
import { CreateUserRequest } from "@/types/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useUsers(params: {
  search?: string;
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => getUsersApi(params),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => createUserApi(data),
    onSuccess: () => {
      // Invalidate the cached user list so it refetches with the new user included —
      // avoids a manual page refresh after creating.
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
