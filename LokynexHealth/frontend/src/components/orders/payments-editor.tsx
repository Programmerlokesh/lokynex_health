"use client";

import { formatMoney } from "@/lib/format";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Button, IconButton, MenuItem, TextField } from "@mui/material";

export const PAYMENT_METHODS = ["Cash", "Card", "UPI"] as const;

export interface PaymentRow {
  method: string;
  amount: string;
}

/** Split payment rows. A method can appear once, so max rows = number of methods. */
export function PaymentsEditor({
  rows,
  total,
  onChange,
}: {
  rows: PaymentRow[];
  total: number;
  onChange: (rows: PaymentRow[]) => void;
}) {
  const used = new Set(rows.map((r) => r.method));
  const free = PAYMENT_METHODS.filter((m) => !used.has(m));

  const update = (idx: number, patch: Partial<PaymentRow>) =>
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {rows.map((row, idx) => (
        <Box
          key={row.method}
          sx={{ display: "flex", gap: 1, alignItems: "center" }}
        >
          <TextField
            select
            size="small"
            label="Method"
            value={row.method}
            onChange={(e) => update(idx, { method: e.target.value })}
            sx={{ width: 110, flexShrink: 0 }}
          >
            {PAYMENT_METHODS.filter(
              (m) => m === row.method || !used.has(m),
            ).map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Amount"
            type="number"
            fullWidth
            value={row.amount}
            onChange={(e) => update(idx, { amount: e.target.value })}
            slotProps={{
              htmlInput: { min: 0, step: "0.01", inputMode: "decimal" },
            }}
          />
          {rows.length > 1 && (
            <IconButton
              size="small"
              aria-label="Remove payment"
              onClick={() => onChange(rows.filter((_, i) => i !== idx))}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ))}

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {free.length > 0 && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => onChange([...rows, { method: free[0], amount: "" }])}
          >
            Split payment
          </Button>
        )}
        <Button
          size="small"
          disabled={total <= 0}
          onClick={() =>
            onChange([
              { method: rows[0]?.method ?? "Cash", amount: String(total) },
            ])
          }
        >
          Pay full ({formatMoney(total)})
        </Button>
      </Box>
    </Box>
  );
}
