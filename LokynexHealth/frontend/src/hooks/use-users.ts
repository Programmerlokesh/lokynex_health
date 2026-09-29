import {
  changeMyPasswordApi,
  createUserApi,
  deleteUserApi,
  getMyProfileApi,
  getUserPermissionsApi,
  getUsersApi,
  resetUserPasswordApi,
  toggleUserStatusApi,
  updateMyProfileApi,
  updateUserApi,
  updateUserPermissionsApi,
} from "@/lib/api/users";
import {
  ChangeOwnPasswordRequest,
  CreateUserRequest,
  ResetUserPasswordRequest,
  ToggleUserStatusRequest,
  UpdateOwnProfileRequest,
  UpdateUserPermissionsRequest,
  UpdateUserRequest,
} from "@/types/user";
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

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      updateUserApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ToggleUserStatusRequest }) =>
      toggleUserStatusApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUserApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// LabAdmin resetting SOMEONE ELSE's password — the only way it ever changes.
export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ResetUserPasswordRequest;
    }) => resetUserPasswordApi(id, data),
  });
}

// Fetches a user's current role + permission grid, for the Edit User dialog.
// Disabled by default — only fetch once a specific user is opened for edit.
export function useUserPermissions(userId: string | null) {
  return useQuery({
    queryKey: ["user-permissions", userId],
    queryFn: () => getUserPermissionsApi(userId as string),
    enabled: !!userId,
  });
}

export function useUpdateUserPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateUserPermissionsRequest;
    }) => updateUserPermissionsApi(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({
        queryKey: ["user-permissions", variables.id],
      });
    },
  });
}

// ---------- Self-service (the logged-in user's own profile) ----------

export function useMyProfile() {
  return useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfileApi,
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateOwnProfileRequest) => updateMyProfileApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });
}

// LabAdmin changing their own password.
export function useChangeMyPassword() {
  return useMutation({
    mutationFn: (data: ChangeOwnPasswordRequest) => changeMyPasswordApi(data),
  });
}
