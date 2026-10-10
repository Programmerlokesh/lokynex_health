"use client";

import { getApiErrorMessage } from "@/lib/api-error";
import { normalizePhone, shareOnWhatsApp } from "@/lib/blood-report/share";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { useState } from "react";

/**
 * Two-step on purpose: (1) build the PDF, (2) tap Send.
 * Browsers only allow "share" / "open window" right after a real tap,
 * and building the PDF can take a few seconds.
 */
export function WhatsAppDialog({
  defaultPhone,
  message,
  filename,
  makePdf,
  onSent,
  onClose,
}: {
  defaultPhone: string;
  message: string;
  filename: string;
  makePdf: () => Promise<Blob>;
  onSent: (phone: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [phone, setPhone] = useState(defaultPhone);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function prepare() {
    setError(null);
    setBusy(true);
    try {
      setBlob(await makePdf());
    } catch (e) {
      setError(
        axios.isAxiosError(e)
          ? getApiErrorMessage(e, "Could not save the report.")
          : e instanceof Error
            ? e.message
            : "Could not create the PDF.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!blob) return;
    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError(
        "Enter a valid mobile number (10 digits, or with country code).",
      );
      return;
    }
    setError(null);
    const result = await shareOnWhatsApp({
      blob,
      filename,
      phone: normalized,
      message,
    });
    if (result === "cancelled") return;
    if (result === "opened") {
      setNote(
        "PDF downloaded and WhatsApp chat opened. Attach the downloaded PDF in the chat and press send.",
      );
    }
    onSent(normalized);
    if (result === "shared") onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>Send on WhatsApp</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
        <TextField
          label="Patient WhatsApp number"
          size="small"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          slotProps={{ htmlInput: { inputMode: "tel" } }}
          helperText="10-digit Indian number is fine (91 is added automatically)."
          sx={{ mt: 1 }}
        />

        <Box
          sx={{
            fontSize: 13,
            bgcolor: "action.hover",
            borderRadius: 2,
            p: 1.5,
          }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5 }}>
            Message
          </Typography>
          <Typography sx={{ fontSize: 13, wordBreak: "break-word" }}>
            {message}
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {note && <Alert severity="success">{note}</Alert>}
        {blob && !note && (
          <Alert severity="info">
            PDF is ready. On a phone the share sheet opens with the PDF attached
            (choose WhatsApp). On a computer the PDF is downloaded and the chat
            opens.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: "wrap", gap: 1 }}>
        <Button color="inherit" onClick={onClose}>
          Close
        </Button>
        {!blob ? (
          <Button
            variant="contained"
            disabled={busy}
            onClick={() => void prepare()}
            startIcon={busy ? <CircularProgress size={16} /> : undefined}
            sx={{ borderRadius: "999px", fontWeight: 800 }}
          >
            {busy ? "Preparing..." : "1) Create PDF"}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={() => void send()}
            sx={{ borderRadius: "999px", fontWeight: 800 }}
          >
            2) Send on WhatsApp
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
