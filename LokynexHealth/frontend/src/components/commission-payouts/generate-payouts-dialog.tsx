"use client";

import { useBranches } from "@/hooks/use-branches";
import { useGeneratePayouts } from "@/hooks/use-commission-payouts";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useState } from "react";

export function GeneratePayoutsDialog() {
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [branchId, setBranchId] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const { data: branches } = useBranches({ pageSize: 100 });
  const generatePayouts = useGeneratePayouts();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dateFrom || !dateTo) return;

    generatePayouts.mutate(
      { dateFrom, dateTo, branchId: branchId || undefined },
      { onSuccess: (data) => setResult(data.generated) },
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
        Generate Payouts
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>
          Generate Commission Payouts
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {result !== null && (
              <Alert severity="success">
                {result} new payout{result === 1 ? "" : "s"} generated from
                orders in this date range. Already-generated items were skipped
                automatically.
              </Alert>
            )}
            {generatePayouts.isError && (
              <Alert severity="error">
                Could not generate payouts. Please try again.
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
            <TextField
              select
              label="Branch (optional)"
              size="small"
              fullWidth
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches?.items.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.branchName}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} color="inherit">
              Close
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={generatePayouts.isPending || !dateFrom || !dateTo}
            >
              {generatePayouts.isPending ? "Generating..." : "Generate"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
