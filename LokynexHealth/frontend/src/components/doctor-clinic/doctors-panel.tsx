"use client";

import { useDebounce } from "@/hooks/use-debounce";
import { useDoctorsList, useSetDoctorStatus } from "@/hooks/use-directory";
import { getApiErrorMessage } from "@/lib/api-error";
import { DoctorFullDto } from "@/types/directory";
import AddIcon from "@mui/icons-material/Add";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
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
import { useState } from "react";
import { DoctorFormDialog } from "./doctor-form-dialog";

function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      label={status}
      size="small"
      variant="outlined"
      color={status === "Active" ? "success" : "default"}
    />
  );
}

export function DoctorsPanel() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading } = useDoctorsList(debouncedSearch);
  const setStatus = useSetDoctorStatus();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DoctorFullDto | null>(null);
  const [toDeactivate, setToDeactivate] = useState<DoctorFullDto | null>(null);

  const rows = data?.items ?? [];

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(d: DoctorFullDto) {
    setEditing(d);
    setFormOpen(true);
  }
  function activate(d: DoctorFullDto) {
    setStatus.mutate({ id: d.id, isActive: true });
  }
  function confirmDeactivate() {
    if (!toDeactivate) return;
    setStatus.mutate(
      { id: toDeactivate.id, isActive: false },
      { onSuccess: () => setToDeactivate(null) },
    );
  }

  function renderActions(d: DoctorFullDto) {
    return (
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
        <Tooltip title="Edit">
          <IconButton
            size="small"
            onClick={() => openEdit(d)}
            aria-label="Edit doctor"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {d.status === "Active" ? (
          <Button
            size="small"
            color="error"
            startIcon={<BlockIcon fontSize="small" />}
            onClick={() => setToDeactivate(d)}
          >
            Deactivate
          </Button>
        ) : (
          <Button
            size="small"
            color="success"
            startIcon={<CheckCircleOutlineIcon fontSize="small" />}
            disabled={setStatus.isPending}
            onClick={() => activate(d)}
          >
            Activate
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
        }}
      >
        <TextField
          placeholder="Search by name, email, or phone..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: "100%", maxWidth: { sm: 380 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          Add Doctor
        </Button>
      </Box>

      {setStatus.isError && (
        <Alert severity="error" onClose={() => setStatus.reset()}>
          {getApiErrorMessage(
            setStatus.error,
            "Could not change doctor status.",
          )}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={26} />
        </Box>
      ) : rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No doctors found.
        </Typography>
      ) : (
        <>
          {/* Desktop / tablet: table */}
          <TableContainer
            component={Paper}
            sx={{
              display: { xs: "none", md: "block" },
              borderRadius: 3,
              boxShadow: "0 4px 16px rgba(23,43,77,0.06)",
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Specialization</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{d.fullName}</TableCell>
                    <TableCell>{d.specialization ?? "—"}</TableCell>
                    <TableCell>{d.phone}</TableCell>
                    <TableCell>{d.email ?? "—"}</TableCell>
                    <TableCell>
                      <StatusChip status={d.status} />
                    </TableCell>
                    <TableCell>{renderActions(d)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile: cards */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {rows.map((d) => (
              <Paper
                key={d.id}
                variant="outlined"
                sx={{ p: 1.75, borderRadius: 3 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      {d.fullName}
                    </Typography>
                    {d.specialization && (
                      <Typography variant="body2" color="text.secondary">
                        {d.specialization}
                      </Typography>
                    )}
                  </Box>
                  <StatusChip status={d.status} />
                </Box>
                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  {d.phone}
                </Typography>
                {d.email && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ wordBreak: "break-all" }}
                  >
                    {d.email}
                  </Typography>
                )}
                <Box sx={{ mt: 1 }}>{renderActions(d)}</Box>
              </Paper>
            ))}
          </Box>
        </>
      )}

      <DoctorFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        doctor={editing}
      />

      <Dialog
        open={!!toDeactivate}
        onClose={() => setToDeactivate(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Deactivate doctor?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{toDeactivate?.fullName}</strong> will no longer appear in
            booking and schedule lists, and new appointments cannot be booked
            with this doctor. Old bookings and reports are kept. Doctors are
            shared by every lab, so this applies to all labs. You can activate
            the doctor again any time.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setToDeactivate(null)} color="inherit">
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={setStatus.isPending}
            onClick={confirmDeactivate}
          >
            {setStatus.isPending ? "Deactivating..." : "Deactivate"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
