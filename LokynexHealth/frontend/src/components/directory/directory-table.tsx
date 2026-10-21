"use client";

import {
  Avatar,
  EmptyState,
  kitCardSx,
  StatusPill,
} from "@/components/common/page-kit";
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
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
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
  Snackbar,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
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

const DirectoryCard = memo(function DirectoryCard({
  kind,
  row,
  busy,
  ...handlers
}: Omit<RowProps, "index">) {
  const extra = extraOf(kind, row);
  const active = row.status === "Active";
  const info = (icon: React.ReactNode, text: string | null | undefined) =>
    text ? (
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "flex-start",
          color: "text.secondary",
          minWidth: 0,
        }}
      >
        <Box sx={{ display: "flex", mt: "2px" }}>{icon}</Box>
        <Typography sx={{ fontSize: 13, wordBreak: "break-word" }}>
          {text}
        </Typography>
      </Box>
    ) : null;

  return (
    <Box
      sx={{
        ...kitCardSx,
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        opacity: active ? 1 : 0.72,
      }}
    >
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
        <Avatar name={row.fullName} size={46} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 15.5,
              lineHeight: 1.25,
              wordBreak: "break-word",
            }}
          >
            {row.fullName}
          </Typography>
          {extra && extra !== "—" && (
            <Chip
              label={extra}
              size="small"
              variant="outlined"
              color={kind === "doctor" ? "primary" : "default"}
              sx={{ mt: 0.5, maxWidth: "100%" }}
            />
          )}
        </Box>
        <StatusPill active={active} label={row.status} />
      </Box>

      <Box sx={{ display: "grid", gap: 0.6 }}>
        {info(<CallOutlinedIcon sx={{ fontSize: 16 }} />, row.phone)}
        {row.whatsappNumber &&
          info(
            <WhatsAppIcon sx={{ fontSize: 16, color: "#16A34A" }} />,
            row.whatsappNumber,
          )}
        {info(<MailOutlinedIcon sx={{ fontSize: 16 }} />, row.email)}
        {info(<PlaceOutlinedIcon sx={{ fontSize: 16 }} />, row.address)}
      </Box>

      <Box
        sx={{
          mt: "auto",
          pt: 1,
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <RowActions row={row} busy={busy} {...handlers} />
      </Box>
    </Box>
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
    return <EmptyState text="No records found." />;
  }

  const busyId = status.isPending ? status.variables?.id : undefined;

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, 1fr)",
            xl: "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
        {rows.map((row) => (
          <DirectoryCard
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
