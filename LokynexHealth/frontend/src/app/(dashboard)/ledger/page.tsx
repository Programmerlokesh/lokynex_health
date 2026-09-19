"use client";

import { PulseIcon } from "@/components/icons/lab-icons";
import { LedgerSummaryCards } from "@/components/ledger/ledger-summary-cards";
import { RecordLedgerEntryDialog } from "@/components/ledger/record-ledger-entry-dialog";
import { SyncLedgerDialog } from "@/components/ledger/sync-ledger-dialog";
import { brand } from "@/components/providers/mui-theme-provider";
import { useBranches } from "@/hooks/use-branches";
import { useLedgerSummary } from "@/hooks/use-ledger";
import { GetLedgerSummaryFilters } from "@/types/ledger";
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

export default function LedgerPage() {
  const [branchId, setBranchId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: branches } = useBranches({ pageSize: 100 });

  const filters = useMemo<GetLedgerSummaryFilters>(
    () => ({
      branchId: branchId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [branchId, dateFrom, dateTo],
  );

  const { data, isLoading, isError } = useLedgerSummary(filters);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              bgcolor: "#E0F2FE",
              color: brand.electricBlue,
              p: 1,
              borderRadius: 2,
              display: "flex",
            }}
          >
            <PulseIcon fontSize="small" />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Ledger &amp; P&amp;L
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <SyncLedgerDialog />
          <RecordLedgerEntryDialog />
        </Box>
      </Box>

      <Box
        sx={{
          bgcolor: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: 3,
          p: 2.5,
          mb: 2.5,
        }}
      >
        <Grid container spacing={2}>
          <Grid size={4}>
            <TextField
              select
              label="Branch"
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
          </Grid>
          <Grid size={4}>
            <TextField
              label="Date From"
              type="date"
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </Grid>
          <Grid size={4}>
            <TextField
              label="Date To"
              type="date"
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : isError ? (
        <Alert severity="error">Could not load the ledger summary.</Alert>
      ) : data && data.byType.length > 0 ? (
        <LedgerSummaryCards
          byType={data.byType}
          netProfitLoss={data.netProfitLoss}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          No ledger entries yet for these filters. Use{" "}
          <strong>Sync from Orders</strong> to pull in paid orders and
          commission payouts, or record a manual entry.
        </Typography>
      )}
    </Box>
  );
}
