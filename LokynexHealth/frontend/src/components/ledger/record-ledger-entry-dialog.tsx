"use client";

import { useBranches } from "@/hooks/use-branches";
import { useRecordLedgerEntry } from "@/hooks/use-ledger";
import AddIcon from "@mui/icons-material/Add";
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

const ENTRY_TYPES = ["Income", "Expense", "CommissionPayout", "Refund"];

export function RecordLedgerEntryDialog() {
  const [open, setOpen] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [entryType, setEntryType] = useState("Income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const { data: branches } = useBranches({ pageSize: 100 });
  const recordEntry = useRecordLedgerEntry();

  function resetForm() {
    setBranchId("");
    setEntryDate("");
    setEntryType("Income");
    setAmount("");
    setDescription("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!entryDate || !amount) return;

    // Expense / CommissionPayout / Refund are outflows — store as negative,
    // matching the sign convention already used by the auto-sync job.
    const isOutflow = entryType !== "Income";
    const signedAmount = isOutflow
      ? -Math.abs(Number(amount))
      : Math.abs(Number(amount));

    recordEntry.mutate(
      {
        branchId: branchId || undefined,
        entryDate,
        entryType,
        amount: signedAmount,
        description: description || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      },
    );
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
      >
        Record Entry
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Record Manual Ledger Entry
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {recordEntry.isError && (
              <Alert severity="error">
                Could not save the entry. Please try again.
              </Alert>
            )}

            <TextField
              label="Entry Date"
              type="date"
              size="small"
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />

            <TextField
              select
              label="Entry Type"
              size="small"
              fullWidth
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
            >
              {ENTRY_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>

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

            <TextField
              label="Amount"
              type="number"
              size="small"
              fullWidth
              required
              helperText={
                entryType === "Income"
                  ? "Recorded as a positive inflow."
                  : "Recorded as a negative outflow automatically."
              }
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <TextField
              label="Description (optional)"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={recordEntry.isPending || !entryDate || !amount}
            >
              {recordEntry.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
