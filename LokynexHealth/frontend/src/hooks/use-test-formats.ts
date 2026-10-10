import {
  getTestFormatApi,
  getTestFormatsApi,
  saveTestFormatApi,
} from "@/lib/api/test-formats";
import { SaveTestFormatRequest } from "@/types/test-format";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export function useTestFormats(search: string) {
  return useQuery({
    queryKey: ["test-formats", "list", search],
    queryFn: () => getTestFormatsApi(search),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}

export function useTestFormat(testId: string | null) {
  return useQuery({
    queryKey: ["test-formats", "detail", testId],
    queryFn: () => getTestFormatApi(testId as string),
    enabled: !!testId,
    staleTime: 0,
    refetchOnMount: "always",
    // an editor is open: never replace what the user is typing
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useSaveTestFormat(testId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveTestFormatRequest) =>
      saveTestFormatApi(testId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["test-formats"] });
      // blood report entry screens must pick up the new format
      qc.invalidateQueries({ queryKey: ["blood-report-form"] });
      qc.invalidateQueries({ queryKey: ["report-options"] });
    },
  });
}
