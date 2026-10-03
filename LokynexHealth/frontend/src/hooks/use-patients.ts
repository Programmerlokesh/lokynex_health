import { searchPatientsApi } from "@/lib/api/patients";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

/** Starts at 3 digits so a single keystroke never scans the table. */
export function usePatientSearch(phone: string) {
  const term = phone.replace(/[^\d+]/g, "");
  return useQuery({
    queryKey: ["patients", term],
    queryFn: () => searchPatientsApi(term),
    enabled: term.length >= 3,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}
