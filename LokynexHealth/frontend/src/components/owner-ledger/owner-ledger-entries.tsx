"use client";

import { OwnerLedgerEntryDialog } from "@/components/owner-ledger/owner-ledger-entry-dialog";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useDeleteOwnerLedgerEntry,
  useOwnerLedgerEntries,
} from "@/hooks/use-owners";
import { getOwnerLedgerEntriesApi } from "@/lib/api/owners";
import { formatMoney } from "@/lib/format";
import { downloadEntriesCsv, TYPE_META } from "@/lib/owner-ledger-utils";
import {
  LedgerEntryType,
  OwnerLedgerEntryDto,
  OwnerLedgerFilters,
  OwnerLedgerLabOption,
} from "@/types/owner";
import AddIcon from "@mui/icons-material/Add";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";

const PAGE_SIZE = 15;
const TYPE_FILTERS: { key: LedgerEntryType | ""; label: string }[] = [
  { key: "", label: "All" },
  { key: "Income", label: "Income" },
  { key: "Expense", label: "Expense" },
  { key: "Refund", label: "Refund" },
  { key: "CommissionPayout", label: "Commission" },
];

function Amount({ e }: { e: OwnerLedgerEntryDto }) {
  const meta = TYPE_META[e.entryType];
  return (
    <Typography
      variant="body2"
      sx={{ fontWeight: 700, color: meta.color, whiteSpace: "nowrap" }}
    >
      {meta.sign === 1 ? "+" : "−"} {formatMoney(e.amount)}
    </Typography>
  );
}

export function OwnerLedgerEntries({
  ownerId,
  readOnly,
  filters,
  labOptions,
}: {
  ownerId?: string;
  readOnly: boolean;
  filters: OwnerLedgerFilters;
  labOptions: OwnerLedgerLabOption[];
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [type, setType] = useState<LedgerEntryType | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortDesc, setSortDesc] = useState(true);
  const [editing, setEditing] = useState<OwnerLedgerEntryDto | "new" | null>(
    null,
  );
  const [deleting, setDeleting] = useState<OwnerLedgerEntryDto | null>(null);
  const [exporting, setExporting] = useState(false);

  const debounced = useDebounce(search, 400);
  const params = {
    ...filters,
    entryType: type || undefined,
    search: debounced.trim() || undefined,
    sortDesc,
    pageNumber: page,
    pageSize: PAGE_SIZE,
  };
  const { data, isLoading, isFetching } = useOwnerLedgerEntries(
    ownerId,
    params,
  );
  const del = useDeleteOwnerLedgerEntry();

  async function exportCsv() {
    setExporting(true);
    try {
      const all = await getOwnerLedgerEntriesApi(ownerId, {
        ...params,
        pageNumber: 1,
        pageSize: 5000,
      });
      downloadEntriesCsv(
        all.items,
        `owner-ledger-${filters.dateFrom ?? "all"}_${filters.dateTo ?? "all"}.csv`,
      );
    } finally {
      setExporting(false);
    }
  }

  const rows = data?.items ?? [];

  const rowActions = (e: OwnerLedgerEntryDto) =>
    e.source === "Subscription" ? (
      <Chip
        size="small"
        icon={<AutorenewIcon />}
        label="Auto"
        variant="outlined"
      />
    ) : readOnly ? null : (
      <Stack direction="row">
        <IconButton
          size="small"
          onClick={() => setEditing(e)}
          aria-label="Edit entry"
        >
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={() => setDeleting(e)}
          aria-label="Delete entry"
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Stack>
    );

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
          mb: 1.5,
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Ledger entries
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {data ? `${data.totalCount} entries` : "Loading…"} · subscription
            sales are added automatically
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} className="no-print">
          <Button
            size="small"
            variant="outlined"
            onClick={exportCsv}
            disabled={exporting}
            startIcon={
              exporting ? (
                <CircularProgress size={14} />
              ) : (
                <DownloadOutlinedIcon />
              )
            }
          >
            CSV
          </Button>
          {!readOnly && (
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setEditing("new")}
            >
              Add entry
            </Button>
          )}
        </Stack>
      </Box>

      <Stack spacing={1.25} className="no-print" sx={{ mb: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            gap: 0.75,
            overflowX: "auto",
            pb: 0.5,
            scrollbarWidth: "none",
          }}
        >
          {TYPE_FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              clickable
              size="small"
              color={type === f.key ? "primary" : "default"}
              variant={type === f.key ? "filled" : "outlined"}
              onClick={() => {
                setType(f.key);
                setPage(1);
              }}
            />
          ))}
          <Chip
            label={sortDesc ? "Newest first" : "Oldest first"}
            size="small"
            variant="outlined"
            clickable
            onClick={() => {
              setSortDesc((v) => !v);
              setPage(1);
            }}
          />
        </Box>
        <TextField
          size="small"
          placeholder="Search category, note, reference, lab…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress size={26} />
        </Box>
      ) : rows.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ py: 3, textAlign: "center" }}
        >
          No entries match these filters.
        </Typography>
      ) : isMobile ? (
        <Stack spacing={1} sx={{ opacity: isFetching ? 0.6 : 1 }}>
          {rows.map((e) => (
            <Card
              key={`${e.source}-${e.id}`}
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 2.5 }}
            >
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                    {e.category || TYPE_META[e.entryType].label}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="div"
                  >
                    {e.entryDate}
                    {e.labName ? ` · ${e.labName}` : ""}
                  </Typography>
                </Box>
                <Amount e={e} />
              </Stack>
              {(e.description || e.referenceNo || e.paymentMethod) && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component="div"
                  sx={{ mt: 0.5 }}
                >
                  {[
                    e.description,
                    e.referenceNo && `Ref ${e.referenceNo}`,
                    e.paymentMethod,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Typography>
              )}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 0.5,
                }}
              >
                <Chip
                  size="small"
                  label={TYPE_META[e.entryType].label}
                  sx={{
                    bgcolor: `${TYPE_META[e.entryType].color}22`,
                    color: TYPE_META[e.entryType].color,
                    fontWeight: 600,
                  }}
                />
                {rowActions(e)}
              </Box>
            </Card>
          ))}
        </Stack>
      ) : (
        <TableContainer sx={{ opacity: isFetching ? 0.6 : 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                {[
                  "Date",
                  "Type",
                  "Category",
                  "Lab",
                  "Details",
                  "Amount (₹)",
                  "",
                ].map((h) => (
                  <TableCell
                    key={h}
                    sx={{ fontWeight: 600 }}
                    align={h.startsWith("Amount") ? "right" : "left"}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={`${e.source}-${e.id}`} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {e.entryDate}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={TYPE_META[e.entryType].label}
                      sx={{
                        bgcolor: `${TYPE_META[e.entryType].color}22`,
                        color: TYPE_META[e.entryType].color,
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>{e.category || "—"}</TableCell>
                  <TableCell>{e.labName || "—"}</TableCell>
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography
                      variant="body2"
                      noWrap
                      title={e.description ?? ""}
                    >
                      {[
                        e.description,
                        e.referenceNo && `Ref ${e.referenceNo}`,
                        e.paymentMethod,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Amount e={e} />
                  </TableCell>
                  <TableCell align="right" className="no-print">
                    {rowActions(e)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {data && data.totalPages > 1 && (
        <Box
          sx={{ display: "flex", justifyContent: "center", mt: 2 }}
          className="no-print"
        >
          <Pagination
            count={data.totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            size={isMobile ? "small" : "medium"}
            siblingCount={0}
          />
        </Box>
      )}

      {editing && (
        <OwnerLedgerEntryDialog
          key={editing === "new" ? "new" : editing.id}
          open
          entry={editing === "new" ? undefined : editing}
          labOptions={labOptions}
          onClose={() => setEditing(null)}
        />
      )}

      <Dialog open={!!deleting} onClose={() => setDeleting(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete this entry?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleting &&
              `${TYPE_META[deleting.entryType].label} of ₹${formatMoney(deleting.amount)} on ${deleting.entryDate} will be removed from your P&L.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleting(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={del.isPending}
            onClick={() =>
              deleting &&
              del.mutate(deleting.id, { onSettled: () => setDeleting(null) })
            }
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
