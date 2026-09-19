"use client";

import { useSyncLedger } from "@/hooks/use-ledger";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useState } from "react";

export function SyncLedgerDialog() {
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const syncLedger = useSyncLedger();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dateFrom || !dateTo) return;

    syncLedger.mutate(
      { dateFrom, dateTo },
      { onSuccess: (data) => setResult(data.synced) },
    );
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
  }

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<AutorenewIcon />}
        onClick={() => setOpen(true)}
      >
        Sync from Orders
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>
          Sync Ledger from Orders &amp; Payouts
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {result !== null && (
              <Alert severity="success">
                {result} new ledger {result === 1 ? "entry" : "entries"}{" "}
                created. Already-synced orders and payouts were skipped
                automatically.
              </Alert>
            )}
            {syncLedger.isError && (
              <Alert severity="error">
                Could not sync the ledger. Please try again.
              </Alert>
            )}

            <TextField
              label="Date From"
              type="date"
              size="small"
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <TextField
              label="Date To"
              type="date"
              size="small"
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} color="inherit">
              Close
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={syncLedger.isPending || !dateFrom || !dateTo}
            >
              {syncLedger.isPending ? "Syncing..." : "Sync"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}