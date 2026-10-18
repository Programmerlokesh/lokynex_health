import { superAdminApiClient as api } from "@/lib/superadmin-api-client";
import {
  CreateOwnerRequest,
  OwnerDto,
  OwnerLedgerAnalytics,
  OwnerLedgerEntriesPage,
  OwnerLedgerEntriesParams,
  OwnerLedgerFilters,
  SaveOwnerLedgerEntryRequest,
  UpdateOwnerRequest,
} from "@/types/owner";
import { PagedResult } from "@/types/user";

// ---------- SuperAdmin: manage owners ----------
export async function getOwnersApi(params: {
  search?: string;
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PagedResult<OwnerDto>> {
  const res = await api.get<PagedResult<OwnerDto>>("/Owners", { params });
  return res.data;
}

export async function getOwnerByIdApi(id: string): Promise<OwnerDto> {
  const res = await api.get<OwnerDto>(`/Owners/${id}`);
  return res.data;
}

export async function createOwnerApi(
  data: CreateOwnerRequest,
): Promise<{ id: string }> {
  const res = await api.post<{ id: string }>("/Owners", data);
  return res.data;
}

export async function updateOwnerApi(
  id: string,
  data: UpdateOwnerRequest,
): Promise<void> {
  await api.put(`/Owners/${id}`, data);
}

export async function setOwnerStatusApi(
  id: string,
  status: "Active" | "Inactive",
): Promise<void> {
  await api.patch(`/Owners/${id}/status`, { status });
}

// ---------- Owner: own profile ----------
export async function getMyOwnerProfileApi(): Promise<OwnerDto> {
  const res = await api.get<OwnerDto>("/owner/me");
  return res.data;
}

// ---------- Ledger (Owner uses /owner/ledger, SuperAdmin /Owners/{id}/ledger) ----------
const ledgerBase = (ownerId?: string) =>
  ownerId ? `/Owners/${ownerId}/ledger` : "/owner/ledger";

export async function getOwnerLedgerAnalyticsApi(
  ownerId: string | undefined,
  params: OwnerLedgerFilters & { granularity?: string },
): Promise<OwnerLedgerAnalytics> {
  const res = await api.get<OwnerLedgerAnalytics>(
    `${ledgerBase(ownerId)}/analytics`,
    { params },
  );
  return res.data;
}

export async function getOwnerLedgerEntriesApi(
  ownerId: string | undefined,
  params: OwnerLedgerEntriesParams,
): Promise<OwnerLedgerEntriesPage> {
  const res = await api.get<OwnerLedgerEntriesPage>(
    `${ledgerBase(ownerId)}/entries`,
    { params },
  );
  return res.data;
}

export async function recordOwnerLedgerEntryApi(
  data: SaveOwnerLedgerEntryRequest,
): Promise<{ id: string }> {
  const res = await api.post<{ id: string }>("/owner/ledger", data);
  return res.data;
}

export async function updateOwnerLedgerEntryApi(
  id: string,
  data: SaveOwnerLedgerEntryRequest,
): Promise<void> {
  await api.put(`/owner/ledger/${id}`, data);
}

export async function deleteOwnerLedgerEntryApi(id: string): Promise<void> {
  await api.delete(`/owner/ledger/${id}`);
}
