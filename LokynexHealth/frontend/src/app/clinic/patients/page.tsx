"use client";

import { PageTitle } from "@/components/clinic/clinic-shell";
import { EmptyState } from "@/components/clinic/clinic-ui";
import { useClinicPatientHistory, useClinicPatients } from "@/hooks/use-clinic";
import { useDebounce } from "@/hooks/use-debounce";
import { fmtRxDate } from "@/lib/clinic/prescription-html";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Pagination,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";

function History({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = useClinicPatientHistory(id);
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>
        {data?.patient.name ?? "Patient"}
      </DialogTitle>
      <DialogContent dividers>
        {isLoading || !data ? (
          <CircularProgress />
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {[
                data.patient.age != null && `${data.patient.age} yrs`,
                data.patient.gender,
                data.patient.phone,
                data.patient.address,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Typography>
            <Typography variant="subtitle2" fontWeight={800}>
              Visits ({data.prescriptions.length})
            </Typography>
            <List dense>
              {data.prescriptions.map((p) => (
                <ListItemButton
                  key={p.id}
                  component={Link}
                  href={`/clinic/prescriptions/${p.id}`}
                >
                  <ListItemText
                    primary={`${fmtRxDate(p.visitDate)} · ${p.rxNo}`}
                    secondary={`${p.doctorName}${p.diagnosis ? ` — ${p.diagnosis}` : ""}`}
                  />
                </ListItemButton>
              ))}
              {!data.prescriptions.length && (
                <Typography variant="body2" color="text.secondary">
                  No prescriptions yet.
                </Typography>
              )}
            </List>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const q = useDebounce(search.trim(), 300);
  const { data } = useClinicPatients({
    search: q || undefined,
    pageNumber: page,
    pageSize: 20,
  });

  return (
    <>
      <PageTitle
        title="Patients"
        subtitle="Saved automatically when you write a prescription"
      />
      <TextField
        size="small"
        fullWidth
        placeholder="Search by name or mobile number"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        sx={{ mb: 2, maxWidth: 480 }}
      />
      {!data?.items.length ? (
        <EmptyState text="No patients found." />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          {data.items.map((p) => (
            <Paper
              key={p.id}
              variant="outlined"
              onClick={() => setOpen(p.id)}
              sx={{
                p: 1.75,
                borderRadius: 3,
                cursor: "pointer",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              <Typography fontWeight={800} noWrap>
                {p.name}
                {p.age != null ? ` (${p.age})` : ""}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {p.phone}
                {p.address ? ` · ${p.address}` : ""}
              </Typography>
              <Box sx={{ mt: 0.75, display: "flex", gap: 0.75 }}>
                <Chip
                  size="small"
                  label={`${p.visitCount} visit${p.visitCount === 1 ? "" : "s"}`}
                />
                {p.lastVisitAt && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Last: ${fmtRxDate(p.lastVisitAt)}`}
                  />
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      )}
      {!!data && data.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={data.totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
          />
        </Box>
      )}
      {open && <History id={open} onClose={() => setOpen(null)} />}
    </>
  );
}
