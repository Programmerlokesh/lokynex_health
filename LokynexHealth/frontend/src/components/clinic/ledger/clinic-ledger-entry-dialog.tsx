"use client";

import { useDialogFullScreen, useToast } from "@/components/clinic/clinic-ui";
import { useClinicLedgerMutations } from "@/hooks/use-clinic";
import { getApiErrorMessage } from "@/lib/api-error";
import { toDateInputValue } from "@/lib/format";
import { TYPE_META } from "@/lib/ledger-utils";
import type { ClinicEntryType, ClinicLedgerEntry } from "@/types/clinic";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useState } from "react";

const CATEGORIES: Record<ClinicEntryType, string[]> = {
  Income: [
    "Consultation fee",
    "Procedure",
    "Injection / dressing",
    "Lab collection",
    "Other income",
  ],
  Expense: [
    "Rent",
    "Staff salary",
    "Electricity",
    "Medicines & consumables",
    "Equipment",
    "Maintenance",
    "Marketing",
    "Other expense",
  ],
  Refund: ["Consultation fee", "Procedure", "Other"],
};

export function ClinicLedgerEntryDialog({
  entry,
  onClose,
}: {
  entry: ClinicLedgerEntry | null;
  onClose: () => void;
}) {
  const fullScreen = useDialogFullScreen();
  const { toast, toastNode } = useToast();
  const { record, update } = useClinicLedgerMutations();
  const [type, setType] = useState<ClinicEntryType>(
    entry?.entryType ?? "Income",
  );
  const [f, setF] = useState({
    date: entry?.entryDate.slice(0, 10) ?? toDateInputValue(new Date()),
    amount: entry ? String(entry.amount) : "",
    category: entry?.category ?? "",
    method: entry?.paymentMethod ?? "Cash",
    ref: entry?.referenceNo ?? "",
    desc: entry?.description ?? "",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const amount = Number(f.amount);
    if (!(amount > 0)) {
      toast("Enter an amount greater than 0", "error");
      return;
    }
    const data = {
      entryDate: f.date,
      entryType: type,
      category: f.category,
      amount,
      paymentMethod: f.method,
      referenceNo: f.ref,
      description: f.desc,
    };
    const opts = {
      onSuccess: onClose,
      onError: (e: unknown) => toast(getApiErrorMessage(e), "error"),
    };
    if (entry) update.mutate({ id: entry.id, data }, opts);
    else record.mutate(data, opts);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        {entry ? "Edit entry" : "Record entry"}
      </DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 1.5, pt: "8px !important" }}>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={type}
          onChange={(_, v) => v && setType(v)}
        >
          {(["Income", "Expense", "Refund"] as ClinicEntryType[]).map((t) => (
            <ToggleButton
              key={t}
              value={t}
              sx={{ fontWeight: 700, color: TYPE_META[t]?.color }}
            >
              {t}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr" }}>
          <TextField
            size="small"
            type="date"
            label="Date"
            value={f.date}
            onChange={(e) => set("date", e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            type="number"
            label="Amount"
            value={f.amount}
            onChange={(e) => set("amount", e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">₹</InputAdornment>
                ),
              },
            }}
          />
        </Box>
        <Autocomplete
          freeSolo
          size="small"
          options={CATEGORIES[type]}
          inputValue={f.category}
          onInputChange={(_, v) => set("category", v)}
          renderInput={(p) => <TextField {...p} label="Category" />}
        />
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr" }}>
          <TextField
            select
            size="small"
            label="Payment"
            value={f.method}
            onChange={(e) => set("method", e.target.value)}
          >
            {["Cash", "Card", "UPI", "Bank transfer", "Cheque"].map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Reference no."
            value={f.ref}
            onChange={(e) => set("ref", e.target.value)}
          />
        </Box>
        <TextField
          size="small"
          label="Description"
          multiline
          minRows={2}
          value={f.desc}
          onChange={(e) => set("desc", e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={record.isPending || update.isPending}
        >
          Save
        </Button>
      </DialogActions>
      {toastNode}
    </Dialog>
  );
}
