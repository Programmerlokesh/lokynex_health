import { apiClient } from "@/lib/api-client";
import { PatientDto } from "@/types/patient";

/** Phone-prefix search. Returns each guardian with their family members. */
export async function searchPatientsApi(phone: string): Promise<PatientDto[]> {
  const response = await apiClient.get<PatientDto[]>("/Patients/search", {
    params: { phone, limit: 8 },
  });
  return response.data;
}
