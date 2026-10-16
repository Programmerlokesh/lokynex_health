"use client";

import { WhatsAppDialog } from "@/components/blood-report/whatsapp-dialog";
import { CommissionReportFilters } from "@/components/commission-payouts/commission-report-filters";
import { CommissionReportTable } from "@/components/commission-payouts/commission-report-table";
import { CommissionIcon } from "@/components/icons/lab-icons";
import { OrderReportDialog } from "@/components/orders/order-report-dialog";
import { brand } from "@/components/providers/mui-theme-provider";
import { Pill } from "@/components/report-builder/report-toolbar-ui";
import { useGeneratePayouts } from "@/hooks/use-commission-payouts";
import {
  useCommissionReport,
  useSetPayoutStatus,
} from "@/hooks/use-commission-report";
import { getApiErrorMessage } from "@/lib/api-error";
import { buildCommissionPdf } from "@/lib/commission-pdf";
import {
  buildReportFragment,
  buildReportHtml,
  buildWhatsAppMessage,
  commissionLabel,
  defaultFilters,
  filterLines,
  pdfFileName,
  ReportFilterState,
  ReportMeta,
  toReportParams,
} from "@/lib/commission-report";
import { formatMoney } from "@/lib/format";
import {
  CommissionReportRow,
  PayoutStatusValue,
} from "@/types/commission-report";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

type Notice = { severity: "success" | "error"; text: string };

export default function CommissionPayoutPage() {
  // `applied` = what is on screen. The filter boxes keep their own draft.
  const [applied, setApplied] = useState<ReportFilterState>(defaultFilters);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState<Notice | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [waOpen, setWaOpen] = useState(false);

  const params = useMemo(() => toReportParams(applied), [applied]);
  const { data, isLoading, isFetching, isError, error } =
    useCommissionReport(params);
  const generate = useGeneratePayouts();
  const setStatus = useSetPayoutStatus();

  const rows = useMemo<CommissionReportRow[]>(() => data?.rows ?? [], [data]);
  const summary = data?.summary;
  const label = commissionLabel(applied.entityType);
  const resetKey = JSON.stringify(params);

  // banner disappears by itself
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  /* ---------- Generate: create missing payouts for the range, then show ---------- */
  async function handleGenerate(next: ReportFilterState) {
    setSelected(new Set());
    setNotice(null);
    if (next.dateFrom && next.dateTo) {
      try {
        // Safe to repeat: orders that already have a payout are skipped by the server.
        await generate.mutateAsync({
          dateFrom: next.dateFrom,
          dateTo: next.dateTo,
        });
      } catch (e) {
        setNotice({
          severity: "error",
          text: getApiErrorMessage(e, "Could not generate commissions."),
        });
      }
    }
    setApplied(next);
  }

  function handleReset() {
    setSelected(new Set());
    setNotice(null);
    setApplied(defaultFilters());
  }

  /* ---------- selection (Set copy per click: O(n), n <= 5000) ---------- */
  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleMany = useCallback((ids: string[], checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  /* ---------- status updates ---------- */
  function updateStatus(ids: string[], status: PayoutStatusValue) {
    if (ids.length === 0) return;
    setStatus.mutate(
      { payoutIds: ids, status },
      {
        onSuccess: () => {
          setSelected(new Set());
          setNotice({
            severity: "success",
            text: "Commission status updated.",
          });
        },
        onError: (e) =>
          setNotice({
            severity: "error",
            text: getApiErrorMessage(e, "Could not update the status."),
          }),
      },
    );
  }

  const toggleStatus = useCallback(
    (row: CommissionReportRow) =>
      updateStatus([row.payoutId], row.status === "Paid" ? "Unpaid" : "Paid"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /* ---------- PDF + WhatsApp ---------- */
  const meta: ReportMeta = useMemo(
    () => ({
      title: `${applied.entityType} Commissions — ${applied.wise} Wise`,
      filterLines: filterLines(applied),
      commissionLabel: label,
      wise: applied.wise,
      truncatedAt: data?.truncated ? data.maxRows : null,
    }),
    [applied, label, data],
  );

  const makePdf = useCallback(
    () => buildCommissionPdf(buildReportFragment(rows, meta)),
    [rows, meta],
  );

  const totals = useMemo(
    () => ({
      orders: summary?.orderCount ?? 0,
      tests: summary?.testCount ?? 0,
      commission: summary?.commission ?? 0,
      paidComm: summary?.paidCommission ?? 0,
      unpaidComm: summary?.unpaidCommission ?? 0,
      amount: summary?.lineTotal ?? 0,
      less: summary?.totalLess ?? 0,
      paid: summary?.totalPaid ?? 0,
      due: summary?.totalDue ?? 0,
    }),
    [summary],
  );

  const selectedRows = selected.size;
  const busyStatus = setStatus.isPending;

  return (
    <Box>
      {/* ---------- header card ---------- */}
      <Paper
        sx={{
          p: { xs: 1.75, sm: 2.5 },
          borderRadius: 4,
          mb: 2.5,
          boxShadow: "0 6px 20px rgba(23,43,77,0.05)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                bgcolor: "#EDE9FE",
                color: brand.purple,
                p: 1,
                borderRadius: 2.5,
                display: "flex",
                flex: "0 0 auto",
              }}
            >
              <CommissionIcon fontSize="small" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
              {applied.entityType} Commissions — {applied.wise} Wise
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.75,
              flex: "1 1 100%",
            }}
          >
            <Pill>{totals.orders} orders</Pill>
            <Pill>{totals.tests} tests</Pill>
            <Pill>Line Total ₹{formatMoney(totals.amount)}</Pill>
            <Pill tone="info">
              Commission ₹{formatMoney(totals.commission)}
            </Pill>
            <Pill tone="success">
              Paid Comm ₹{formatMoney(totals.paidComm)}
            </Pill>
            <Pill tone="warning">
              Unpaid Comm ₹{formatMoney(totals.unpaidComm)}
            </Pill>
          </Box>
        </Box>
      </Paper>

      {notice && (
        <Alert
          severity={notice.severity}
          onClose={() => setNotice(null)}
          sx={{ mb: 2, borderRadius: 3 }}
        >
          {notice.text}
        </Alert>
      )}

      <CommissionReportFilters
        applied={applied}
        busy={generate.isPending}
        hasRows={rows.length > 0}
        onGenerate={(f) => void handleGenerate(f)}
        onReset={handleReset}
        onPdf={() => setPreviewHtml(buildReportHtml(rows, meta))}
        onWhatsApp={() => setWaOpen(true)}
      />

      {/* ---------- bulk actions ---------- */}
      {selectedRows > 0 && (
        <Paper
          elevation={4}
          sx={{
            position: "sticky",
            bottom: 12,
            zIndex: 5,
            mb: 2,
            p: 1.25,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography sx={{ fontWeight: 800, px: 1, flexGrow: 1 }}>
            {selectedRows} selected
          </Typography>
          <Button
            size="small"
            variant="contained"
            color="success"
            disabled={busyStatus}
            onClick={() => updateStatus(Array.from(selected), "Paid")}
            sx={{ borderRadius: 999 }}
          >
            Mark Paid
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="warning"
            disabled={busyStatus}
            onClick={() => updateStatus(Array.from(selected), "Unpaid")}
            sx={{ borderRadius: 999 }}
          >
            Mark Unpaid
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={() => setSelected(new Set())}
            sx={{ borderRadius: 999 }}
          >
            Clear
          </Button>
        </Paper>
      )}

      {(isFetching || busyStatus) && !isLoading && (
        <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />
      )}
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getApiErrorMessage(error, "Could not load the commission report.")}
        </Alert>
      )}
      {data?.truncated && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Only the first {data.maxRows} rows are shown. Narrow the filters to
          see the rest.
        </Alert>
      )}

      {data && (
        <CommissionReportTable
          rows={rows}
          wise={applied.wise}
          commissionLabel={label}
          selected={selected}
          resetKey={resetKey}
          onToggle={toggleOne}
          onToggleMany={toggleMany}
          onToggleStatus={toggleStatus}
        />
      )}

      <OrderReportDialog
        open={previewHtml !== null}
        onClose={() => setPreviewHtml(null)}
        html={previewHtml ?? ""}
        title="Commission report"
      />

      {waOpen && (
        <WhatsAppDialog
          phoneLabel={`${applied.entityType} WhatsApp number`}
          defaultPhone={applied.entity?.phone ?? ""}
          message={buildWhatsAppMessage(applied, {
            tests: totals.tests,
            orders: totals.orders,
            amount: totals.amount,
            less: totals.less,
            paid: totals.paid,
            due: totals.due,
            commission: totals.commission,
            paidComm: totals.paidComm,
            unpaidComm: totals.unpaidComm,
          })}
          filename={pdfFileName(applied)}
          makePdf={makePdf}
          onSent={() =>
            setNotice({ severity: "success", text: "WhatsApp opened." })
          }
          onClose={() => setWaOpen(false)}
        />
      )}
    </Box>
  );
}
