"use client";

import {
  useRecordOwnerLedgerEntry,
  useUpdateOwnerLedgerEntry,
} from "@/hooks/use-owners";
import { getApiErrorMessage } from "@/lib/api-error";
import { toDateInputValue } from "@/lib/format";
import {
  CATEGORY_SUGGESTIONS,
  PAYMENT_METHODS,
  TYPE_META,
} from "@/lib/owner-ledger-utils";
import {
  LedgerEntryType,
  OwnerLedgerEntryDto,
  OwnerLedgerLabOption,
} from "@/types/owner";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";

// Add (entry undefined) / edit one MANUAL ledger entry. Subscription revenue
// is automatic and never editable here. Mount with a `key` so it resets.
export function OwnerLedgerEntryDialog({
  open,
  onClose,
  entry,
  labOptions,
}: {
  open: boolean;
  onClose: () => void;
  entry?: OwnerLedgerEntryDto;
  labOptions: OwnerLedgerLabOption[];
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const record = useRecordOwnerLedgerEntry();
  const update = useUpdateOwnerLedgerEntry();
  const pending = record.isPending || update.isPending;

  const [form, setForm] = useState({
    entryDate: entry?.entryDate ?? toDateInputValue(new Date()),
    entryType: (entry?.entryType ?? "Expense") as LedgerEntryType,
    category: entry?.category ?? "",
    amount: entry ? String(entry.amount) : "",
    tenantId: entry?.tenantId ?? "",
    paymentMethod: entry?.paymentMethod ?? "",
    referenceNo: entry?.referenceNo ?? "",
    description: entry?.description ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0)
      return setError("Enter an amount greater than zero.");

    const payload = {
      entryDate: form.entryDate,
      entryType: form.entryType,
      category: form.category.trim() || undefined,
      amount: Math.round(amount * 100) / 100,
      tenantId: form.tenantId || null,
      paymentMethod: form.paymentMethod || undefined,
      referenceNo: form.referenceNo.trim() || undefined,
      description: form.description.trim() || undefined,
    };
    const opts = {
      onSuccess: onClose,
      onError: (err: unknown) => setError(getApiErrorMessage(err)),
    };
    if (entry) update.mutate({ id: entry.id, data: payload }, opts);
    else record.mutate(payload, opts);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {entry ? "Edit ledger entry" : "Add ledger entry"}
      </DialogTitle>
      <Box component="form" onSubmit={submit}>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {error && <Alert severity="error">{error}</Alert>}

          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={form.entryType}
            onChange={(_, v: LedgerEntryType | null) => {
              if (v) setForm((f) => ({ ...f, entryType: v, category: "" }));
            }}
          >
            {(Object.keys(TYPE_META) as LedgerEntryType[]).map((t) => (
              <ToggleButton
                key={t}
                value={t}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                {TYPE_META[t].label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Date"
              type="date"
              size="small"
              required
              value={form.entryDate}
              onChange={(e) => set("entryDate", e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Amount (₹)"
              size="small"
              required
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
            />
            <Autocomplete
              freeSolo
              size="small"
              options={CATEGORY_SUGGESTIONS[form.entryType] ?? []}
              inputValue={form.category}
              onInputChange={(_, v) => set("category", v)}
              renderInput={(p) => <TextField {...p} label="Category" />}
            />
            <TextField
              select
              label="Lab (optional)"
              size="small"
              value={form.tenantId}
              onChange={(e) => set("tenantId", e.target.value)}
            >
              <MenuItem value="">— General / not lab specific —</MenuItem>
              {labOptions.map((l) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.name} ({l.code})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Payment method"
              size="small"
              value={form.paymentMethod}
              onChange={(e) => set("paymentMethod", e.target.value)}
            >
              <MenuItem value="">—</MenuItem>
              {PAYMENT_METHODS.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Reference / Bill no."
              size="small"
              value={form.referenceNo}
              onChange={(e) => set("referenceNo", e.target.value)}
            />
          </Box>
          <TextField
            label="Note"
            size="small"
            multiline
            minRows={2}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {pending ? "Saving…" : "Save entry"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
