import {
  createDepartmentApi,
  createTestApi,
  deleteDepartmentApi,
  getDepartmentsApi,
  getTestCommissionsApi,
  getTestsApi,
  updateDepartmentStatusApi,
  updateTestApi,
} from "@/lib/api/departments";
import { CreateTestRequest, UpdateTestRequest } from "@/types/department";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: getDepartmentsApi,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDepartmentApi,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
}

export function useUpdateDepartmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateDepartmentStatusApi(id, status),
    onSuccess: () => {
      // Both caches must refresh: department status changed, AND cascade
      // may have flipped every child test's status too (Section 4 backend rule).
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
  });
}

export function useTests(
  params: {
    departmentId?: string;
    search?: string;
    pageNumber?: number;
    pageSize?: number;
  },
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["tests", params],
    queryFn: () => getTestsApi(params),
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useCreateTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTestRequest) => createTestApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] }); // testCount changes too
      queryClient.invalidateQueries({ queryKey: ["commission-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["effective-commissions"] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDepartmentApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      queryClient.invalidateQueries({ queryKey: ["commission-overrides"] });
    },
  });
}

export function useUpdateTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestRequest }) =>
      updateTestApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      queryClient.invalidateQueries({ queryKey: ["test-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["commission-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["effective-commissions"] });
    },
  });
}

export function useTestCommissions(testId: string | null) {
  return useQuery({
    queryKey: ["test-commissions", testId],
    queryFn: () => getTestCommissionsApi(testId as string),
    enabled: !!testId,
    // always read fresh data when the edit dialog opens
    staleTime: 0,
    gcTime: 0,
  });
}
