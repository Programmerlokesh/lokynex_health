import {
  createDepartmentApi,
  createTestApi,
  getDepartmentsApi,
  getTestsApi,
  updateDepartmentStatusApi,
} from "@/lib/api/departments";
import { CreateTestRequest } from "@/types/department";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

export function useTests(params: {
  departmentId?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["tests", params],
    queryFn: () => getTestsApi(params),
  });
}

export function useCreateTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTestRequest) => createTestApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] }); // testCount changes too
    },
  });
}
