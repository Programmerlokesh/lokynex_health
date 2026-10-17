"use client";

import { useBranches } from "@/hooks/use-branches";
import { useRecordLedgerEntry, useUpdateLedgerEntry } from "@/hooks/use-ledger";
import { getApiErrorMessage } from "@/lib/api-error";
import { toDateInputValue } from "@/lib/format";
import { ENTRY_TYPES, formatINR, TYPE_META } from "@/lib/ledger-utils";
import type { LedgerEntry, LedgerEntryType } from "@/types/ledger";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useState, type FormEvent } from "react";

function LedgerEntryForm({
  entry,
  onClose,
}: {
  entry: LedgerEntry | null;
  onClose: () => void;
}) {
  const isEdit = entry !== null;
  const [entryType, setEntryType] = useState<LedgerEntryType>(
    (entry?.entryType as LedgerEntryType) ?? "Income",
  );
  const [entryDate, setEntryDate] = useState(
    entry?.entryDate ?? toDateInputValue(new Date()),
  );
  const [branchId, setBranchId] = useState(entry?.branchId ?? "");
  const [amount, setAmount] = useState(
    entry ? String(Math.abs(entry.amount)) : "",
  );
  const [description, setDescription] = useState(entry?.description ?? "");

  const { data: branches } = useBranches({ pageSize: 100 });
  const record = useRecordLedgerEntry();
  const update = useUpdateLedgerEntry();
  const mutation = isEdit ? update : record;

  const num = Number(amount);
  const valid = !!entryDate && Number.isFinite(num) && num > 0;
  const inflow = TYPE_META[entryType].inflow;
  const signed = inflow ? Math.abs(num) : -Math.abs(num);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const body = {
      branchId: branchId || undefined,
      entryDate,
      entryType,
      amount: signed,
      description: description.trim() || undefined,
    };
    if (entry)
      update.mutate({ id: entry.id, data: body }, { onSuccess: onClose });
    else record.mutate(body, { onSuccess: onClose });
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEdit ? "Edit ledger entry" : "Record ledger entry"}
      </DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
      >
        {mutation.isError && (
          <Alert severity="error">
            {getApiErrorMessage(mutation.error, "Could not save the entry.")}
          </Alert>
        )}

        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600 }}
          >
            Entry type
          </Typography>
          <Box
            sx={{
              mt: 0.75,
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0,1fr))",
              gap: 1,
            }}
          >
            {ENTRY_TYPES.map((t) => {
              const meta = TYPE_META[t];
              const selected = t === entryType;
              return (
                <Box
                  key={t}
                  component="button"
                  type="button"
                  onClick={() => setEntryType(t)}
                  aria-pressed={selected}
                  sx={{
                    cursor: "pointer",
                    textAlign: "left",
                    p: 1.25,
                    minHeight: 52,
                    borderRadius: 2.5,
                    font: "inherit",
                    color: "text.primary",
                    border: `2px solid ${selected ? meta.color : "transparent"}`,
                    bgcolor: selected
                      ? alpha(meta.color, 0.12)
                      : "action.hover",
                    transition: "all .15s ease",
                  }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <Box
                      sx={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        bgcolor: meta.color,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {meta.label}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {meta.hint}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        <TextField
          label="Amount"
          type="number"
          size="small"
          fullWidth
          required
          autoFocus={!isEdit}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">₹</InputAdornment>
              ),
            },
            htmlInput: { min: 0, step: "0.01", inputMode: "decimal" },
          }}
          helperText={
            valid
              ? `Will be recorded as ${formatINR(signed)} (${inflow ? "inflow" : "outflow"})`
              : "Enter a positive amount — the sign is applied automatically."
          }
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <TextField
            label="Entry date"
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
            label="Branch (optional)"
            size="small"
            fullWidth
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <MenuItem value="">All branches</MenuItem>
            {branches?.items.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.branchName}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <TextField
          label="Description (optional)"
          size="small"
          fullWidth
          multiline
          minRows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 500 } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={mutation.isPending || !valid}
        >
          {mutation.isPending
            ? "Saving..."
            : isEdit
              ? "Save changes"
              : "Save entry"}
        </Button>
      </DialogActions>
    </Box>
  );
}

export function LedgerEntryDialog({
  open,
  entry,
  onClose,
}: {
  open: boolean;
  entry: LedgerEntry | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      fullScreen={fullScreen}
    >
      {/* The form lives INSIDE the dialog, so its state resets on every open. */}
      <LedgerEntryForm entry={entry} onClose={onClose} />
    </Dialog>
  );
}
