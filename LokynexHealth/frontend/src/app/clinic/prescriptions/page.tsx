"use client";

import { PageTitle } from "@/components/clinic/clinic-shell";
import {
  ConfirmDialog,
  EmptyState,
  useToast,
} from "@/components/clinic/clinic-ui";
import {
  useClinicDoctors,
  useClinicMe,
  usePrescriptionMutations,
  usePrescriptions,
} from "@/hooks/use-clinic";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { canDo } from "@/lib/clinic/permissions";
import { fmtRxDate } from "@/lib/clinic/prescription-html";
import type { PrescriptionListItem } from "@/types/clinic";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PrescriptionsPage() {
  const router = useRouter();
  const { toast, toastNode } = useToast();
  const { data: me } = useClinicMe();
  const { data: doctors } = useClinicDoctors();
  const { remove } = usePrescriptionMutations();
  const [search, setSearch] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [del, setDel] = useState<PrescriptionListItem | null>(null);
  const q = useDebounce(search.trim(), 300);

  const { data } = usePrescriptions({
    search: q || undefined,
    doctorId: doctorId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    pageNumber: page,
    pageSize: 15,
  });
  const canCreate = canDo(
    me?.permissions,
    me?.isAdmin,
    "prescriptions",
    "create",
  );
  const canEdit = canDo(me?.permissions, me?.isAdmin, "prescriptions", "edit");
  const canDelete = canDo(
    me?.permissions,
    me?.isAdmin,
    "prescriptions",
    "delete",
  );
  const reset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };

  const actions = (p: PrescriptionListItem) => (
    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      <Tooltip title="View / print">
        <IconButton
          size="small"
          component={Link}
          href={`/clinic/prescriptions/${p.id}`}
        >
          <VisibilityOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {canEdit && (
        <Tooltip title="Edit">
          <IconButton
            size="small"
            component={Link}
            href={`/clinic/prescriptions/${p.id}/edit`}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {canDelete && (
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => setDel(p)}>
            <DeleteOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  return (
    <>
      <PageTitle
        title="Prescriptions"
        subtitle="Every prescription of this clinic"
        actions={
          canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push("/clinic/prescriptions/new")}
            >
              New prescription
            </Button>
          )
        }
      />
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 4,
          mb: 2,
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr 1fr", md: "2fr 1.4fr 1fr 1fr" },
        }}
      >
        <TextField
          size="small"
          label="Search name, mobile, Rx no, diagnosis"
          value={search}
          onChange={(e) => reset(setSearch)(e.target.value)}
          sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
        />
        <TextField
          select
          size="small"
          label="Doctor"
          value={doctorId}
          onChange={(e) => reset(setDoctorId)(e.target.value)}
          sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
        >
          <MenuItem value="">All doctors</MenuItem>
          {(doctors ?? []).map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.fullName}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          type="date"
          label="From"
          value={dateFrom}
          onChange={(e) => reset(setDateFrom)(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          size="small"
          type="date"
          label="To"
          value={dateTo}
          onChange={(e) => reset(setDateTo)(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Paper>

      {!data?.items.length ? (
        <EmptyState text="No prescriptions found." />
      ) : (
        <>
          {/* desktop table */}
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 4, display: { xs: "none", md: "block" } }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rx No.</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Diagnosis</TableCell>
                  <TableCell align="center">Med / Tests</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{p.rxNo}</TableCell>
                    <TableCell>{fmtRxDate(p.visitDate)}</TableCell>
                    <TableCell>
                      {p.patientName}
                      {p.patientAge != null ? ` (${p.patientAge})` : ""}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        {p.patientPhone}
                      </Typography>
                    </TableCell>
                    <TableCell>{p.doctorName}</TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" noWrap>
                        {p.diagnosis || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {p.medicineCount} / {p.testCount}
                    </TableCell>
                    <TableCell align="right">{actions(p)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {/* phone cards */}
          <Box sx={{ display: { xs: "grid", md: "none" }, gap: 1 }}>
            {data.items.map((p) => (
              <Paper
                key={p.id}
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 3 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }} noWrap>
                      {p.patientName}
                      {p.patientAge != null ? ` (${p.patientAge})` : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.rxNo} · {fmtRxDate(p.visitDate)} · {p.patientPhone}
                    </Typography>
                  </Box>
                  {actions(p)}
                </Box>
                <Typography variant="body2" sx={{ mt: 0.5 }} noWrap>
                  {p.diagnosis || "—"}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.75, mt: 0.75 }}>
                  <Chip size="small" label={p.doctorName} />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${p.medicineCount} medicines`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${p.testCount} tests`}
                  />
                </Box>
              </Paper>
            ))}
          </Box>
          {data.totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                count={data.totalPages}
                page={page}
                onChange={(_, v) => setPage(v)}
              />
            </Box>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!del}
        title="Delete prescription?"
        text={
          del
            ? `${del.rxNo} for ${del.patientName} will be removed permanently.`
            : ""
        }
        confirmLabel="Delete"
        danger
        busy={remove.isPending}
        onClose={() => setDel(null)}
        onConfirm={() =>
          del &&
          remove.mutate(del.id, {
            onSuccess: () => {
              setDel(null);
              toast("Prescription deleted");
            },
            onError: (e) => {
              setDel(null);
              toast(getApiErrorMessage(e), "error");
            },
          })
        }
      />
      {toastNode}
    </>
  );
}
