"use client";

import {
  DIRECTORY_LABEL,
  DirectoryFormDialog,
} from "@/components/directory/directory-form-dialog";
import {
  useDeleteDirectoryRecord,
  useSetDirectoryStatus,
} from "@/hooks/use-directory";
import { getApiErrorMessage } from "@/lib/api-error";
import { DirectoryKind, DirectoryRecord } from "@/types/directory";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { memo, useCallback, useState } from "react";

type RowHandlers = {
  onEdit: (row: DirectoryRecord) => void;
  onDelete: (row: DirectoryRecord) => void;
  onToggle: (row: DirectoryRecord, checked: boolean) => void;
};

type RowProps = RowHandlers & {
  kind: DirectoryKind;
  row: DirectoryRecord;
  index: number;
  busy: boolean;
};

function extraOf(kind: DirectoryKind, row: DirectoryRecord): string {
  if (kind === "technician" && "branchName" in row) return row.branchName;
  if (kind === "doctor" && "specialization" in row)
    return row.specialization ?? "—";
  return "";
}

function RowActions({
  row,
  busy,
  onEdit,
  onDelete,
  onToggle,
}: RowHandlers & { row: DirectoryRecord; busy: boolean }) {
  const active = row.status === "Active";
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.25,
        whiteSpace: "nowrap",
      }}
    >
      <Tooltip title={active ? "Deactivate" : "Activate"}>
        <span>
          <Switch
            size="small"
            checked={active}
            disabled={busy}
            onChange={(e) => onToggle(row, e.target.checked)}
          />
        </span>
      </Tooltip>
      <Tooltip title="Edit">
        <IconButton size="small" onClick={() => onEdit(row)}>
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton size="small" color="error" onClick={() => onDelete(row)}>
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      label={status}
      size="small"
      color={status === "Active" ? "success" : "default"}
      variant="outlined"
    />
  );
}

const DesktopRow = memo(function DesktopRow({
  kind,
  row,
  index,
  busy,
  ...handlers
}: RowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 15) * 0.03 }}
      style={{
        display: "table-row",
        opacity: row.status === "Active" ? 1 : 0.6,
      }}
    >
      <TableCell sx={{ fontWeight: 500 }}>{row.fullName}</TableCell>
      <TableCell>{row.phone}</TableCell>
      <TableCell>{row.whatsappNumber ?? "—"}</TableCell>
      <TableCell>{row.email ?? "—"}</TableCell>
      {kind !== "referral" && <TableCell>{extraOf(kind, row)}</TableCell>}
      <TableCell
        sx={{
          maxWidth: 200,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={row.address ?? undefined}
      >
        {row.address ?? "—"}
      </TableCell>
      <TableCell>
        <StatusChip status={row.status} />
      </TableCell>
      <TableCell align="right">
        <RowActions row={row} busy={busy} {...handlers} />
      </TableCell>
    </motion.tr>
  );
});

const MobileCard = memo(function MobileCard({
  kind,
  row,
  busy,
  ...handlers
}: Omit<RowProps, "index">) {
  const extra = extraOf(kind, row);
  const line = (label: string, value: string | null | undefined) =>
    value ? (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ wordBreak: "break-word" }}
      >
        <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
          {label}:{" "}
        </Box>
        {value}
      </Typography>
    ) : null;

  return (
    <Paper
      sx={{
        p: 1.5,
        borderRadius: 3,
        boxShadow: "0 4px 16px rgba(23,43,77,0.06)",
        opacity: row.status === "Active" ? 1 : 0.7,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 1,
        }}
      >
        <Typography sx={{ fontWeight: 600, wordBreak: "break-word" }}>
          {row.fullName}
        </Typography>
        <StatusChip status={row.status} />
      </Box>
      <Box
        sx={{ mt: 0.5, display: "flex", flexDirection: "column", gap: 0.25 }}
      >
        {line("Mobile", row.phone)}
        {line("WhatsApp", row.whatsappNumber)}
        {line("Email", row.email)}
        {kind === "doctor" &&
          line("Specialization", extra !== "—" ? extra : null)}
        {kind === "technician" && line("Branch", extra)}
        {line("Address", row.address)}
      </Box>
      <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
        <RowActions row={row} busy={busy} {...handlers} />
      </Box>
    </Paper>
  );
});

export function DirectoryTable({
  kind,
  rows,
}: {
  kind: DirectoryKind;
  rows: DirectoryRecord[];
}) {
  const label = DIRECTORY_LABEL[kind];
  const [editing, setEditing] = useState<DirectoryRecord | null>(null);
  const [deleting, setDeleting] = useState<DirectoryRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const status = useSetDirectoryStatus(kind);
  const remove = useDeleteDirectoryRecord(kind);
  const { mutate: mutateStatus } = status; // stable reference -> memo rows stay memoized

  const onEdit = useCallback((row: DirectoryRecord) => setEditing(row), []);
  const onDelete = useCallback((row: DirectoryRecord) => setDeleting(row), []);
  const onToggle = useCallback(
    (row: DirectoryRecord, checked: boolean) =>
      mutateStatus(
        { id: row.id, isActive: checked },
        {
          onError: (err) =>
            setToast(getApiErrorMessage(err, "Could not update status.")),
        },
      ),
    [mutateStatus],
  );

  function closeDelete() {
    setDeleting(null);
    remove.reset();
  }

  function confirmDelete() {
    if (!deleting) return;
    remove.mutate(deleting.id, { onSuccess: closeDelete });
  }

  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No records found.
      </Typography>
    );
  }

  const busyId = status.isPending ? status.variables?.id : undefined;

  return (
    <>
      {/* Desktop / tablet: table */}
      <TableContainer
        component={Paper}
        sx={{
          display: { xs: "none", md: "block" },
          borderRadius: 3,
          boxShadow: "0 4px 16px rgba(23,43,77,0.06)",
          overflowX: "auto",
        }}
      >
        <Table size="small" sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Mobile</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>WhatsApp</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              {kind === "doctor" && (
                <TableCell sx={{ fontWeight: 600 }}>Specialization</TableCell>
              )}
              {kind === "technician" && (
                <TableCell sx={{ fontWeight: 600 }}>Branch</TableCell>
              )}
              <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <DesktopRow
                key={row.id}
                kind={kind}
                row={row}
                index={i}
                busy={busyId === row.id}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggle={onToggle}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Phone: cards */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {rows.map((row) => (
          <MobileCard
            key={row.id}
            kind={kind}
            row={row}
            busy={busyId === row.id}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={onToggle}
          />
        ))}
      </Box>

      {editing && (
        <DirectoryFormDialog
          key={editing.id}
          kind={kind}
          record={editing}
          onClose={() => setEditing(null)}
        />
      )}

      <Dialog open={!!deleting} onClose={closeDelete} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Delete {label}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {kind === "technician" ? (
              <>
                Permanently delete <strong>{deleting?.fullName}</strong>? This
                cannot be undone. If it is already used in orders, use the
                switch to deactivate instead.
              </>
            ) : (
              <>
                Remove <strong>{deleting?.fullName}</strong> from your
                lab&apos;s list? Other labs are not affected, and your past
                orders will still show this {label.toLowerCase()}.
              </>
            )}
          </DialogContentText>
          {remove.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {getApiErrorMessage(
                remove.error,
                "Could not delete. Please try again.",
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeDelete} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={remove.isPending}
          >
            {remove.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={6000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setToast(null)}
          sx={{ width: "100%" }}
        >
          {toast}
        </Alert>
      </Snackbar>
    </>
  );
}