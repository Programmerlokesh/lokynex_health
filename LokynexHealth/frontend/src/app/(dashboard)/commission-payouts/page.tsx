"use client";

import { GeneratePayoutsDialog } from "@/components/commission-payouts/generate-payouts-dialog";
import { PayoutFilters } from "@/components/commission-payouts/payout-filters";
import { PayoutSummaryStrip } from "@/components/commission-payouts/payout-summary-strip";
import { PayoutsTable } from "@/components/commission-payouts/payouts-table";
import { CommissionIcon } from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { useMarkPayoutsPaid, usePayouts } from "@/hooks/use-commission-payouts";
import { GetPayoutsFilters } from "@/types/commission-payout";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

const initialFilters: GetPayoutsFilters = {
  dateFrom: "",
  dateTo: "",
  entityType: "",
  status: "All",
  groupBy: "Day",
};

export default function CommissionPayoutPage() {
  const [filters, setFilters] = useState<GetPayoutsFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function handleFilterChange(patch: Partial<GetPayoutsFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  // Stable object reference unless a dependency actually changes.
  const queryFilters = useMemo<GetPayoutsFilters>(
    () => ({
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      entityType: filters.entityType || undefined,
      status: filters.status,
      groupBy: filters.groupBy,
    }),
    [filters],
  );

  const { data, isLoading, isError } = usePayouts(queryFilters);
  const markPaid = useMarkPayoutsPaid();

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    const unpaidIds = (data?.items ?? [])
      .filter((r) => r.status === "Unpaid")
      .map((r) => r.id);
    setSelectedIds(new Set(unpaidIds));
  }

  function handleMarkPaid() {
    const payoutIds = Array.from(selectedIds);
    if (payoutIds.length === 0) return;

    markPaid.mutate(
      { payoutIds },
      {
        onSuccess: (result) => {
          setSelectedIds(new Set());
          setSuccessMsg(
            `${result.updated} payout${result.updated === 1 ? "" : "s"} marked as paid.`,
          );
        },
      },
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              bgcolor: "#EDE9FE",
              color: brand.purple,
              p: 1,
              borderRadius: 2,
              display: "flex",
            }}
          >
            <CommissionIcon fontSize="small" />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Commission Payout
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          {selectedIds.size > 0 && (
            <Button
              variant="contained"
              color="success"
              onClick={handleMarkPaid}
              disabled={markPaid.isPending}
            >
              {markPaid.isPending
                ? "Marking..."
                : `Mark Paid (${selectedIds.size})`}
            </Button>
          )}
          <GeneratePayoutsDialog />
        </Box>
      </Box>

      <PayoutFilters filters={filters} onChange={handleFilterChange} />

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : isError ? (
        <Alert severity="error">Could not load payouts.</Alert>
      ) : (
        <>
          <PayoutSummaryStrip
            summary={data?.summary ?? []}
            grandTotal={data?.grandTotal ?? 0}
          />
          <PayoutsTable
            rows={data?.items ?? []}
            selectedIds={selectedIds}
            onToggle={toggleOne}
            onToggleAll={toggleAll}
          />
        </>
      )}

      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => setSuccessMsg(null)}
        message={successMsg}
      />
    </Box>
  );
}
