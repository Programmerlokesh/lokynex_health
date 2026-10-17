"use client";

import { brand } from "@/components/providers/mui-theme-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { useDeleteLedgerEntry, useLedgerEntries } from "@/hooks/use-ledger";
import { getApiErrorMessage } from "@/lib/api-error";
import { getLedgerEntriesApi } from "@/lib/api/ledger";
import {
  downloadCsv,
  ENTRY_TYPES,
  formatDisplayDate,
  formatINR,
  TYPE_META,
  typeMeta,
} from "@/lib/ledger-utils";
import type { LedgerEntry, LedgerSort } from "@/types/ledger";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useState } from "react";

const MotionRow = motion.create(TableRow);

const SORTS: { value: LedgerSort; label: string }[] = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "amount_desc", label: "Amount: high → low" },
  { value: "amount_asc", label: "Amount: low → high" },
];

function TypePill({ type }: { type: string }) {
  const meta = typeMeta(type);
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        px: 1,
        py: 0.25,
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 700,
        color: meta.color,
        bgcolor: alpha(meta.color, 0.14),
        whiteSpace: "nowrap",
      }}
    >
      <Box
        sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: meta.color }}
      />
      {meta.label}
    </Box>
  );
}

function RowActions({
  entry,
  onEdit,
  onDelete,
}: {
  entry: LedgerEntry;
  onEdit: (e: LedgerEntry) => void;
  onDelete: (e: LedgerEntry) => void;
}) {
  if (!entry.isManual) {
    return (
      <Tooltip title="Auto-synced from an order / payout — change it there">
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            px: 1,
            py: 0.25,
            borderRadius: 99,
            fontSize: 11.5,
            fontWeight: 600,
            color: "text.secondary",
            bgcolor: "action.hover",
          }}
        >
          <LinkRoundedIcon sx={{ fontSize: 14 }} /> Synced
        </Box>
      </Tooltip>
    );
  }
  return (
    <Box sx={{ display: "inline-flex" }}>
      <IconButton
        size="small"
        aria-label="Edit entry"
        onClick={() => onEdit(entry)}
      >
        <EditRoundedIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label="Delete entry"
        color="error"
        onClick={() => onDelete(entry)}
      >
        <DeleteOutlineRoundedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

export function LedgerTable({
  branchId,
  dateFrom,
  dateTo,
  onEdit,
}: {
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
  onEdit: (entry: LedgerEntry) => void;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sort, setSort] = useState<LedgerSort>("date_desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [toDelete, setToDelete] = useState<LedgerEntry | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const debouncedSearch = useDebounce(search, 400);
  const deleteEntry = useDeleteLedgerEntry();

  const baseFilters = {
    branchId,
    dateFrom,
    dateTo,
    entryType: typeFilter || undefined,
    search: debouncedSearch.trim() || undefined,
  };

  const { data, isLoading, isError, isFetching } = useLedgerEntries({
    ...baseFilters,
    sort,
    pageNumber: page + 1,
    pageSize,
  });

  async function handleExport() {
    setExporting(true);
    setExportError("");
    try {
      const all: LedgerEntry[] = [];
      for (let p = 1; p <= 100; p++) {
        const res = await getLedgerEntriesApi({
          ...baseFilters,
          sort: "date_asc",
          pageNumber: p,
          pageSize: 100,
        });
        all.push(...res.items);
        if (p >= res.totalPages) break;
      }
      downloadCsv(`ledger_${dateFrom || "all"}_to_${dateTo || "all"}.csv`, [
        [
          "Date",
          "Type",
          "Description",
          "Reference",
          "Branch",
          "Amount",
          "Running balance",
        ],
        ...all.map((e) => [
          e.entryDate,
          e.entryType,
          e.description ?? "",
          e.referenceLabel ?? "",
          e.branchName ?? "All branches",
          e.amount,
          e.runningBalance ?? "",
        ]),
      ]);
    } catch (err) {
      setExportError(getApiErrorMessage(err, "Could not export the ledger."));
    } finally {
      setExporting(false);
    }
  }

  function confirmDelete() {
    if (!toDelete) return;
    deleteEntry.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
  }

  const items = data?.items ?? [];
  const showBalance = !!data?.hasRunningBalance;

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      {/* controls */}
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          mb: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "minmax(0,1fr) 200px auto" },
          alignItems: "center",
        }}
      >
        <TextField
          size="small"
          placeholder="Search description…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          size="small"
          label="Sort"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as LedgerSort);
            setPage(0);
          }}
        >
          {SORTS.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="outlined"
          onClick={handleExport}
          disabled={exporting || !data?.totalCount}
          startIcon={
            exporting ? (
              <CircularProgress size={16} />
            ) : (
              <FileDownloadRoundedIcon />
            )
          }
        >
          Export CSV
        </Button>
      </Box>

      {/* type chips */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          mb: 2,
          overflowX: "auto",
          pb: 0.5,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {[
          { id: "", label: "All", color: brand.blue },
          ...ENTRY_TYPES.map((t) => ({
            id: t,
            label: TYPE_META[t].label,
            color: TYPE_META[t].color,
          })),
        ].map((c) => {
          const selected = typeFilter === c.id;
          return (
            <Box
              key={c.id || "all"}
              component="button"
              type="button"
              onClick={() => {
                setTypeFilter(c.id);
                setPage(0);
              }}
              aria-pressed={selected}
              sx={{
                flexShrink: 0,
                cursor: "pointer",
                font: "inherit",
                fontSize: 13,
                fontWeight: 700,
                px: 1.5,
                py: 0.6,
                minHeight: 34,
                borderRadius: 99,
                border: `1.5px solid ${selected ? c.color : "transparent"}`,
                color: selected ? c.color : "text.secondary",
                bgcolor: selected ? alpha(c.color, 0.12) : "action.hover",
                transition: "all .15s ease",
              }}
            >
              {c.label}
            </Box>
          );
        })}
      </Box>

      {exportError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {exportError}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : isError ? (
        <Alert severity="error">Could not load ledger entries.</Alert>
      ) : items.length === 0 ? (
        <Box sx={{ py: 7, textAlign: "center", color: "text.secondary" }}>
          <ReceiptLongRoundedIcon sx={{ fontSize: 44, opacity: 0.5 }} />
          <Typography sx={{ fontWeight: 600, mt: 1 }}>
            No entries found
          </Typography>
          <Typography variant="body2">
            Try another date range, type or search.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ opacity: isFetching ? 0.6 : 1, transition: "opacity .2s" }}>
          {/* desktop table */}
          <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  {showBalance && <TableCell align="right">Balance</TableCell>}
                  <TableCell align="right" sx={{ width: 96 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((e, i) => (
                  <MotionRow
                    key={e.id}
                    hover
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: Math.min(i * 0.02, 0.3),
                    }}
                  >
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDisplayDate(e.entryDate)}
                    </TableCell>
                    <TableCell>
                      <TypePill type={e.entryType} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 340 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        title={e.description ?? ""}
                      >
                        {e.description || "—"}
                      </Typography>
                      {e.referenceLabel && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{ display: "block" }}
                        >
                          {e.referenceLabel}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {e.branchName ?? "All branches"}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                        color: e.amount >= 0 ? "success.main" : "error.main",
                      }}
                    >
                      {formatINR(e.amount, true)}
                    </TableCell>
                    {showBalance && (
                      <TableCell
                        align="right"
                        sx={{ whiteSpace: "nowrap", color: "text.secondary" }}
                      >
                        {e.runningBalance === null ||
                        e.runningBalance === undefined
                          ? "—"
                          : formatINR(e.runningBalance)}
                      </TableCell>
                    )}
                    <TableCell align="right">
                      <RowActions
                        entry={e}
                        onEdit={onEdit}
                        onDelete={setToDelete}
                      />
                    </TableCell>
                  </MotionRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* mobile cards */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              flexDirection: "column",
              gap: 1.25,
            }}
          >
            {items.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    border: 1,
                    borderColor: "divider",
                    borderLeft: `4px solid ${typeMeta(e.entryType).color}`,
                    bgcolor: "background.paper",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <TypePill type={e.entryType} />
                    <Typography
                      sx={{
                        fontWeight: 800,
                        color: e.amount >= 0 ? "success.main" : "error.main",
                      }}
                    >
                      {formatINR(e.amount, true)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ mt: 0.75, wordBreak: "break-word" }}
                  >
                    {e.description || "—"}
                  </Typography>
                  {e.referenceLabel && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", wordBreak: "break-word" }}
                    >
                      {e.referenceLabel}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      mt: 0.75,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {formatDisplayDate(e.entryDate)} ·{" "}
                      {e.branchName ?? "All branches"}
                      {showBalance &&
                      e.runningBalance !== null &&
                      e.runningBalance !== undefined
                        ? ` · Bal ${formatINR(e.runningBalance)}`
                        : ""}
                    </Typography>
                    <RowActions
                      entry={e}
                      onEdit={onEdit}
                      onDelete={setToDelete}
                    />
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Box>

          {/* filtered totals */}
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 3,
              bgcolor: "action.hover",
              display: "grid",
              gap: 1,
              gridTemplateColumns: "repeat(3, minmax(0,1fr))",
              textAlign: "center",
            }}
          >
            {[
              ["In", data?.filteredIn ?? 0, "success.main"],
              ["Out", -(data?.filteredOut ?? 0), "error.main"],
              [
                "Net",
                data?.filteredNet ?? 0,
                (data?.filteredNet ?? 0) >= 0 ? "success.main" : "error.main",
              ],
            ].map(([label, value, color]) => (
              <Box key={label as string} sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  {label as string} (filtered)
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 800,
                    color: color as string,
                    fontSize: { xs: 13.5, sm: 16 },
                  }}
                  noWrap
                >
                  {formatINR(value as number, true)}
                </Typography>
              </Box>
            ))}
          </Box>

          <TablePagination
            component="div"
            count={data?.totalCount ?? 0}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50, 100]}
            sx={{
              ".MuiTablePagination-toolbar": {
                flexWrap: "wrap",
                justifyContent: "center",
                px: 0,
              },
            }}
          />
        </Box>
      )}

      {/* delete confirmation */}
      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete this entry?</DialogTitle>
        <DialogContent>
          {deleteEntry.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {getApiErrorMessage(
                deleteEntry.error,
                "Could not delete the entry.",
              )}
            </Alert>
          )}
          {toDelete && (
            <Typography variant="body2">
              {typeMeta(toDelete.entryType).label} of{" "}
              <b>{formatINR(toDelete.amount)}</b> on{" "}
              {formatDisplayDate(toDelete.entryDate)}
              {toDelete.description ? ` — “${toDelete.description}”` : ""}. This
              cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDelete}
            disabled={deleteEntry.isPending}
          >
            {deleteEntry.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
