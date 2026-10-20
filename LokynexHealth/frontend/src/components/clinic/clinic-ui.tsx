"use client";

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
  Snackbar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useCallback, useState, type ReactNode } from "react";

/** Tiny snackbar helper: const { toast, toastNode } = useToast(); toast("Saved"); toast("Oops","error") */
export function useToast() {
  const [state, setState] = useState<{
    msg: string;
    severity: "success" | "error" | "info";
  } | null>(null);
  const toast = useCallback(
    (msg: string, severity: "success" | "error" | "info" = "success") =>
      setState({ msg, severity }),
    [],
  );
  const toastNode = (
    <Snackbar
      open={!!state}
      autoHideDuration={4000}
      onClose={() => setState(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      {state ? (
        <Alert
          severity={state.severity}
          variant="filled"
          onClose={() => setState(null)}
          sx={{ width: "100%" }}
        >
          {state.msg}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
  return { toast, toastNode };
}

/** Phone = full-screen dialog, desktop = normal dialog. */
export function useDialogFullScreen() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down("sm"));
}

export function ConfirmDialog(props: {
  open: boolean;
  title: string;
  text: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{props.text}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={props.onClose} disabled={props.busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={props.danger ? "error" : "primary"}
          onClick={props.onConfirm}
          disabled={props.busy}
        >
          {props.confirmLabel ?? "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function StatusChip({ status }: { status: string }) {
  const color =
    status === "Active" || status === "Completed"
      ? "success"
      : status === "Booked"
        ? "info"
        : status === "Suspended"
          ? "warning"
          : "default";
  return (
    <Chip
      size="small"
      label={status}
      color={color as "success" | "info" | "warning" | "default"}
      variant="outlined"
    />
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <Box
      sx={{ py: 6, textAlign: "center", color: "text.secondary", fontSize: 14 }}
    >
      {text}
    </Box>
  );
}
