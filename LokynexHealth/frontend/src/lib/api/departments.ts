import { apiClient } from "@/lib/api-client";
import { CreateTestRequest, DepartmentDto, TestDto } from "@/types/department";
import { PagedResult } from "@/types/user";

export async function getDepartmentsApi(): Promise<DepartmentDto[]> {
  const response = await apiClient.get<DepartmentDto[]>("/Departments");
  return response.data;
}

export async function createDepartmentApi(
  name: string,
): Promise<{ id: string }> {
  const response = await apiClient.post<{ id: string }>("/Departments", {
    name,
  });
  return response.data;
}

export async function updateDepartmentStatusApi(
  id: string,
  status: string,
): Promise<void> {
  await apiClient.patch(`/Departments/${id}/status`, { status });
}

export async function getTestsApi(params: {
  departmentId?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PagedResult<TestDto>> {
  const response = await apiClient.get<PagedResult<TestDto>>("/Tests", {
    params,
  });
  return response.data;
}

export async function createTestApi(
  data: CreateTestRequest,
): Promise<{ id: string }> {
  const response = await apiClient.post<{ id: string }>("/Tests", data);
  return response.data;
}
