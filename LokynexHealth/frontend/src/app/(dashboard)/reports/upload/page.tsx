"use client";

import {
  Pill,
  PillButton,
} from "@/components/report-builder/report-toolbar-ui";
import { cardSx, HeaderCard } from "@/components/reports/report-shell";
import { useDebounce } from "@/hooks/use-debounce";
import { useOrdersForReport } from "@/hooks/use-report-builder";
import { formatDateTime } from "@/lib/format";
import { OrderIndex } from "@/lib/report-editor/order-index";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";

const PAGE_SIZE = 18;

export default function UploadReportPage() {
  const [search, setSearch] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search, 350);

  const { data, isLoading, isFetching, isError, refetch } = useOrdersForReport({
    search: debounced.trim(),
    onlyPending,
    pageNumber: page,
    pageSize: PAGE_SIZE,
  });

  const rows = useMemo(() => data?.items ?? [], [data]);
  const index = useMemo(() => new OrderIndex(rows), [rows]);

  // While the server search is still debouncing, filter the rows on screen instantly (Trie).
  const waiting = search.trim() !== debounced.trim();
  const shown = waiting ? index.filter(search) : rows;

  const total = data?.totalCount ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <HeaderCard
        title="Upload Report"
        subtitle="Pick an order to create or edit its reports (USG, CT scan, X-ray…)"
        actions={
          <>
            <Pill>{total} orders</Pill>
            <PillButton
              active={onlyPending}
              onClick={() => {
                setOnlyPending((v) => !v);
                setPage(1);
              }}
            >
              Pending only
            </PillButton>
            <PillButton onClick={() => void refetch()} title="Reload orders">
              <RefreshIcon sx={{ fontSize: 14 }} />
              {isFetching ? "Loading..." : "Refresh"}
            </PillButton>
          </>
        }
      />

      <TextField
        fullWidth
        size="small"
        placeholder="Search by order no, patient name, phone or test"
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
        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "999px" } }}
      />

      {isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          Could not load orders.
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : shown.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No orders found. New orders appear here as soon as they are created.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
              xl: "repeat(3, 1fr)",
            },
          }}
        >
          {shown.map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i, 12) * 0.03 }}
              style={{ display: "flex" }}
            >
              <Box
                sx={{
                  ...cardSx,
                  flex: 1,
                  minWidth: 0,
                  p: 2.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 15 }}>
                    Order #{o.orderNumber}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 10.5,
                      color: "text.secondary",
                      fontWeight: 600,
                    }}
                  >
                    {formatDateTime(o.createdAt)}
                  </Typography>
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 14 }} noWrap>
                    {o.patientName}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "text.secondary",
                      fontWeight: 600,
                    }}
                  >
                    {o.patientPhone}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                  {o.items.map((t) => (
                    <Pill
                      key={t.id}
                      tone={t.reportCount > 0 ? "success" : "warning"}
                    >
                      {t.testName} {t.reportCount > 0 ? "✓" : "· pending"}
                    </Pill>
                  ))}
                </Box>

                <Button
                  component={Link}
                  href={`/reports/order/${o.id}`}
                  variant="contained"
                  sx={{
                    mt: "auto",
                    borderRadius: "999px",
                    py: 1,
                    fontWeight: 800,
                  }}
                >
                  Open Reports
                </Button>
              </Box>
            </motion.div>
          ))}
        </Box>
      )}

      {totalPages > 1 && (
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Button
            variant="outlined"
            color="inherit"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            sx={{ borderRadius: "999px" }}
          >
            Previous
          </Button>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
            Page {page} of {totalPages}
          </Typography>
          <Button
            variant="outlined"
            color="inherit"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            sx={{ borderRadius: "999px" }}
          >
            Next
          </Button>
        </Box>
      )}
    </Box>
  );
}
