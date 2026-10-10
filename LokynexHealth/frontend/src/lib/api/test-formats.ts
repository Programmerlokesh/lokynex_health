import { apiClient } from "@/lib/api-client";
import {
  SaveTestFormatRequest,
  TestFormatDto,
  TestFormatListItemDto,
} from "@/types/test-format";

export async function getTestFormatsApi(
  search: string,
): Promise<TestFormatListItemDto[]> {
  const res = await apiClient.get<TestFormatListItemDto[]>("/TestFormats", {
    params: { search: search || undefined },
  });
  return res.data;
}

export async function getTestFormatApi(testId: string): Promise<TestFormatDto> {
  const res = await apiClient.get<TestFormatDto>(`/TestFormats/${testId}`);
  return res.data;
}

export async function saveTestFormatApi(
  testId: string,
  data: SaveTestFormatRequest,
): Promise<void> {
  await apiClient.put(`/TestFormats/${testId}`, data);
}
