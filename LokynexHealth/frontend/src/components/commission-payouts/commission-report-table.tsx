"use client";

import { brand } from "@/components/providers/mui-theme-provider";
import {
  groupRows,
  ReportGroup,
  sumRows,
  Totals,
} from "@/lib/commission-report";
import { formatDateTime, formatMoney } from "@/lib/format";
import { CommissionReportRow, WiseMode } from "@/types/commission-report";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { memo, useMemo, useState } from "react";

/** Rows drawn at first; "Show more" adds another page. Keeps 5000 rows smooth. */
const PAGE = 100;

type Item =
  | { kind: "group"; group: ReportGroup }
  | { kind: "row"; row: CommissionReportRow };

const th = {
  fontWeight: 800,
  fontSize: 11,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  color: "text.secondary",
  whiteSpace: "nowrap",
  bgcolor: "background.paper",
  borderBottom: 2,
  borderColor: "divider",
} as const;

const money = (n: number) => formatMoney(n);

function StatusChip({
  row,
  onToggle,
}: {
  row: CommissionReportRow;
  onToggle: (r: CommissionReportRow) => void;
}) {
  const paid = row.status === "Paid";
  return (
    <Chip
      size="small"
      clickable
      label={row.status}
      color={paid ? "success" : "warning"}
      variant={paid ? "filled" : "outlined"}
      onClick={() => onToggle(row)}
      title={paid ? "Click to mark Unpaid" : "Click to mark Paid"}
      sx={{ fontWeight: 700 }}
    />
  );
}

/* ---------------------------- desktop ---------------------------- */

const DesktopRow = memo(function DesktopRow({
  row,
  checked,
  onToggle,
  onToggleStatus,
}: {
  row: CommissionReportRow;
  checked: boolean;
  onToggle: (id: string) => void;
  onToggleStatus: (r: CommissionReportRow) => void;
}) {
  return (
    <TableRow hover selected={checked}>
      <TableCell padding="checkbox">
        <Checkbox
          size="small"
          checked={checked}
          onChange={() => onToggle(row.payoutId)}
          slotProps={{ input: { "aria-label": `Select ${row.patientName}` } }}
        />
      </TableCell>
      <TableCell sx={{ whiteSpace: "nowrap" }}>
        {formatDateTime(row.orderDate)}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block" }}
        >
          {row.orderNumber}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontWeight: 600 }}>{row.patientName}</TableCell>
      <TableCell>{row.testName}</TableCell>
      <TableCell align="right">{money(row.testAmount)}</TableCell>
      <TableCell align="right">{money(row.less)}</TableCell>
      <TableCell
        align="right"
        sx={row.due > 0 ? { color: "error.main", fontWeight: 700 } : undefined}
      >
        {money(row.due)}
      </TableCell>
      <TableCell align="right">{money(row.paid)}</TableCell>
      <TableCell>{row.doctorName ?? "—"}</TableCell>
      <TableCell>{row.referralName ?? "—"}</TableCell>
      <TableCell align="right" sx={{ fontWeight: 700 }}>
        {money(row.commissionAmount)}
      </TableCell>
      <TableCell>
        <StatusChip row={row} onToggle={onToggleStatus} />
      </TableCell>
    </TableRow>
  );
});

function DesktopGroupRow({
  group,
  selected,
  onToggleMany,
}: {
  group: ReportGroup;
  selected: ReadonlySet<string>;
  onToggleMany: (ids: string[], checked: boolean) => void;
}) {
  const ids = group.rows.map((r) => r.payoutId);
  const count = ids.reduce((n, id) => n + (selected.has(id) ? 1 : 0), 0);
  const t = group.totals;
  const cell = { fontWeight: 800, bgcolor: "action.hover" } as const;
  return (
    <TableRow>
      <TableCell padding="checkbox" sx={cell}>
        <Checkbox
          size="small"
          checked={count === ids.length}
          indeterminate={count > 0 && count < ids.length}
          onChange={(e) => onToggleMany(ids, e.target.checked)}
          slotProps={{ input: { "aria-label": `Select ${group.label}` } }}
        />
      </TableCell>
      <TableCell colSpan={3} sx={cell}>
        {group.label}{" "}
        <Typography
          component="span"
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 700 }}
        >
          · {t.tests} test{t.tests === 1 ? "" : "s"}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={cell}>
        {money(t.amount)}
      </TableCell>
      <TableCell align="right" sx={cell}>
        {money(t.less)}
      </TableCell>
      <TableCell align="right" sx={cell}>
        {money(t.due)}
      </TableCell>
      <TableCell align="right" sx={cell}>
        {money(t.paid)}
      </TableCell>
      <TableCell colSpan={2} sx={cell} />
      <TableCell align="right" sx={cell}>
        {money(t.commission)}
      </TableCell>
      <TableCell sx={cell} />
    </TableRow>
  );
}

/* ----------------------------- mobile ----------------------------- */

function Kv({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          color: danger ? "error.main" : undefined,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

const MobileCard = memo(function MobileCard({
  row,
  checked,
  commissionLabel,
  onToggle,
  onToggleStatus,
}: {
  row: CommissionReportRow;
  checked: boolean;
  commissionLabel: string;
  onToggle: (id: string) => void;
  onToggleStatus: (r: CommissionReportRow) => void;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 3,
        borderColor: checked ? "primary.main" : "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Checkbox
          size="small"
          checked={checked}
          onChange={() => onToggle(row.payoutId)}
          sx={{ ml: -1 }}
          slotProps={{ input: { "aria-label": `Select ${row.patientName}` } }}
        />
        <Typography sx={{ fontWeight: 800, flexGrow: 1, minWidth: 0 }} noWrap>
          {row.patientName}
        </Typography>
        <StatusChip row={row} onToggle={onToggleStatus} />
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {row.testName}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {formatDateTime(row.orderDate)} · {row.orderNumber}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 1,
          mt: 1.25,
        }}
      >
        <Kv label="Amount" value={money(row.testAmount)} />
        <Kv label="Less" value={money(row.less)} />
        <Kv label="Paid" value={money(row.paid)} />
        <Kv label="Due" value={money(row.due)} danger={row.due > 0} />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 1,
          mt: 1.25,
          pt: 1,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: "block" }}
          >
            Doctor: {row.doctorName ?? "—"}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: "block" }}
          >
            Referral: {row.referralName ?? "—"}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right", flex: "0 0 auto" }}>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "text.secondary",
            }}
          >
            {commissionLabel}
          </Typography>
          <Typography sx={{ fontWeight: 800, color: brand.purple }}>
            ₹{money(row.commissionAmount)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
});

function MobileGroupHeader({
  group,
  selected,
  onToggleMany,
}: {
  group: ReportGroup;
  selected: ReadonlySet<string>;
  onToggleMany: (ids: string[], checked: boolean) => void;
}) {
  const ids = group.rows.map((r) => r.payoutId);
  const count = ids.reduce((n, id) => n + (selected.has(id) ? 1 : 0), 0);
  const t = group.totals;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        bgcolor: "action.hover",
        borderRadius: 3,
        px: 1,
        py: 0.75,
        mt: 1,
      }}
    >
      <Checkbox
        size="small"
        checked={count === ids.length}
        indeterminate={count > 0 && count < ids.length}
        onChange={(e) => onToggleMany(ids, e.target.checked)}
        slotProps={{ input: { "aria-label": `Select ${group.label}` } }}
      />
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 13.5 }} noWrap>
          {group.label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t.tests} test{t.tests === 1 ? "" : "s"} · Amount ₹{money(t.amount)}
        </Typography>
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
        ₹{money(t.commission)}
      </Typography>
    </Box>
  );
}

/* ----------------------------- table ----------------------------- */

export function CommissionReportTable({
  rows,
  wise,
  commissionLabel,
  selected,
  resetKey,
  onToggle,
  onToggleMany,
  onToggleStatus,
}: {
  rows: CommissionReportRow[];
  wise: WiseMode;
  commissionLabel: string;
  selected: ReadonlySet<string>;
  /** Changes when the applied filters change => back to the first page of rows. */
  resetKey: string;
  onToggle: (id: string) => void;
  onToggleMany: (ids: string[], checked: boolean) => void;
  onToggleStatus: (row: CommissionReportRow) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [limit, setLimit] = useState(PAGE);
  const [prevKey, setPrevKey] = useState(resetKey);
  if (prevKey !== resetKey) {
    setPrevKey(resetKey);
    setLimit(PAGE);
  }

  // group header + its rows, flattened once; slicing it is O(1)
  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    for (const g of groupRows(rows, wise)) {
      out.push({ kind: "group", group: g });
      for (const r of g.rows) out.push({ kind: "row", row: r });
    }
    return out;
  }, [rows, wise]);

  const total: Totals = useMemo(() => sumRows(rows), [rows]);
  const visible = items.slice(0, limit);
  const remaining = items.length - visible.length;

  const allIds = useMemo(() => rows.map((r) => r.payoutId), [rows]);
  const selectedCount = useMemo(
    () => allIds.reduce((n, id) => n + (selected.has(id) ? 1 : 0), 0),
    [allIds, selected],
  );

  if (rows.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: 3, borderRadius: 4, textAlign: "center" }}
      >
        <Typography sx={{ fontWeight: 700 }}>
          No commission rows found.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Pick the date range and press Generate to create the commission
          entries for those orders.
        </Typography>
      </Paper>
    );
  }

  const showMore =
    remaining > 0 ? (
      <Box sx={{ display: "flex", justifyContent: "center", gap: 1, py: 1.5 }}>
        <Button variant="outlined" onClick={() => setLimit((l) => l + PAGE)}>
          Show more ({remaining} remaining)
        </Button>
        <Button color="inherit" onClick={() => setLimit(items.length)}>
          Show all
        </Button>
      </Box>
    ) : null;

  if (isMobile) {
    return (
      <Box sx={{ display: "grid", gap: 1 }}>
        {visible.map((it) =>
          it.kind === "group" ? (
            <MobileGroupHeader
              key={`g-${it.group.key}`}
              group={it.group}
              selected={selected}
              onToggleMany={onToggleMany}
            />
          ) : (
            <MobileCard
              key={it.row.payoutId}
              row={it.row}
              checked={selected.has(it.row.payoutId)}
              commissionLabel={commissionLabel}
              onToggle={onToggle}
              onToggleStatus={onToggleStatus}
            />
          ),
        )}
        {showMore}
        <Paper
          sx={{ p: 1.5, borderRadius: 3, bgcolor: brand.navy, color: "#fff" }}
        >
          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            Total · {total.orders} orders · {total.tests} tests
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
              Amount ₹{money(total.amount)}
            </Typography>
            <Typography sx={{ fontWeight: 800 }}>
              Commission ₹{money(total.commission)}
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        borderRadius: 4,
        boxShadow: "0 6px 20px rgba(23,43,77,0.05)",
        overflow: "hidden",
      }}
    >
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 1150 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={th}>
                <Checkbox
                  size="small"
                  checked={selectedCount === allIds.length}
                  indeterminate={
                    selectedCount > 0 && selectedCount < allIds.length
                  }
                  onChange={(e) => onToggleMany(allIds, e.target.checked)}
                  slotProps={{ input: { "aria-label": "Select all rows" } }}
                />
              </TableCell>
              <TableCell sx={th}>Date</TableCell>
              <TableCell sx={th}>Patient Name</TableCell>
              <TableCell sx={th}>Test Name</TableCell>
              <TableCell align="right" sx={th}>
                Test Amount
              </TableCell>
              <TableCell align="right" sx={th}>
                Less
              </TableCell>
              <TableCell align="right" sx={th}>
                Due
              </TableCell>
              <TableCell align="right" sx={th}>
                Paid
              </TableCell>
              <TableCell sx={th}>Doctor Name</TableCell>
              <TableCell sx={th}>Referral Name</TableCell>
              <TableCell align="right" sx={th}>
                {commissionLabel}
              </TableCell>
              <TableCell sx={th}>Commission Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((it) =>
              it.kind === "group" ? (
                <DesktopGroupRow
                  key={`g-${it.group.key}`}
                  group={it.group}
                  selected={selected}
                  onToggleMany={onToggleMany}
                />
              ) : (
                <DesktopRow
                  key={it.row.payoutId}
                  row={it.row}
                  checked={selected.has(it.row.payoutId)}
                  onToggle={onToggle}
                  onToggleStatus={onToggleStatus}
                />
              ),
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} align="right" sx={{ fontWeight: 800 }}>
                Total
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>
                {money(total.amount)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>
                {money(total.less)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>
                {money(total.due)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>
                {money(total.paid)}
              </TableCell>
              <TableCell colSpan={2} />
              <TableCell align="right" sx={{ fontWeight: 800 }}>
                {money(total.commission)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      {showMore}
    </Paper>
  );
}
