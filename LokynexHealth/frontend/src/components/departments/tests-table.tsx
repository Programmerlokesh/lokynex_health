"use client";

import { SURFACE } from "@/lib/home-theme";
import { TestDto } from "@/types/department";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";

const inr = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const money = (n: number) => `₹${inr.format(n)}`;

/** "₹50", "10%" or "—" when nothing is configured. */
function commission(type: string, value: number) {
  if (!value) return "—";
  return type === "Percentage" ? `${value}%` : money(value);
}

function PriceText({ price }: { price: number }) {
  if (price > 0) {
    return (
      <Typography component="span" variant="body2" sx={{ fontWeight: 700 }}>
        {money(price)}
      </Typography>
    );
  }
  return (
    <Tooltip title="Price not set yet">
      <Typography
        component="span"
        variant="body2"
        sx={{ fontWeight: 700, color: "warning.main" }}
      >
        ₹0
      </Typography>
    </Tooltip>
  );
}

function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      label={status}
      size="small"
      color={status === "Active" ? "success" : "default"}
      variant="outlined"
    />
  );
}

/** Phone / small tablet: one card per test, nothing to scroll sideways. */
function TestCards({
  tests,
  onEdit,
}: {
  tests: TestDto[];
  onEdit: (test: TestDto) => void;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {tests.map((test, i) => {
        const chips = [
          {
            label: "Dr",
            type: test.doctorCommissionType,
            value: test.doctorCommissionValue,
          },
          {
            label: "Ref",
            type: test.referralCommissionType,
            value: test.referralCommissionValue,
          },
          {
            label: "Tech",
            type: test.technicianCommissionType,
            value: test.technicianCommissionValue,
          },
        ].filter((c) => c.value > 0);
        const inactive = test.status !== "Active";

        return (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: Math.min(i, 8) * 0.02 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                p: 1.5,
                border: 1,
                borderColor: "divider",
                borderRadius: "14px",
                bgcolor: "background.paper",
                opacity: inactive ? 0.65 : 1,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {test.name}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 0.75,
                    mt: 0.75,
                  }}
                >
                  {chips.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      No commission set
                    </Typography>
                  ) : (
                    chips.map((c) => (
                      <Chip
                        key={c.label}
                        size="small"
                        variant="outlined"
                        label={`${c.label} ${commission(c.type, c.value)}`}
                        sx={{ height: 22, fontSize: 12 }}
                      />
                    ))
                  )}
                  {inactive && <StatusChip status={test.status} />}
                </Box>
              </Box>

              <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                <PriceText price={test.price} />
              </Box>

              <IconButton
                size="small"
                aria-label={`Edit ${test.name}`}
                onClick={() => onEdit(test)}
                sx={{ mt: -0.5, mr: -0.75 }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          </motion.div>
        );
      })}
    </Box>
  );
}

export function TestsTable({
  tests,
  onEdit,
}: {
  tests: TestDto[];
  onEdit: (test: TestDto) => void;
}) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });
  const headTint =
    theme.palette.mode === "dark" ? SURFACE.headDark : SURFACE.headLight;

  if (tests.length === 0) {
    return (
      <Box
        sx={{
          py: 5,
          textAlign: "center",
          border: "1.5px dashed",
          borderColor: "divider",
          borderRadius: "14px",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No tests found here yet. Use “New Test” to add one.
        </Typography>
      </Box>
    );
  }

  if (compact) return <TestCards tests={tests} onEdit={onEdit} />;

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: "14px",
        // the list scrolls inside its card, so the pager below stays in view
        maxHeight: "calc(100vh - 400px)",
        minHeight: 240,
        "& .MuiTableCell-stickyHeader.MuiTableCell-head": {
          backgroundColor: theme.palette.background.paper,
          backgroundImage: `linear-gradient(${headTint}, ${headTint})`,
        },
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Test Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Doctor</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Referral</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Technician</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              Edit
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tests.map((test, i) => (
            <motion.tr
              key={test.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18, delay: Math.min(i, 10) * 0.015 }}
              style={{ display: "table-row" }}
            >
              <TableCell
                sx={{ fontWeight: 500, whiteSpace: "normal !important" }}
              >
                {test.name}
              </TableCell>
              <TableCell>
                <PriceText price={test.price} />
              </TableCell>
              <TableCell>
                {commission(
                  test.doctorCommissionType,
                  test.doctorCommissionValue,
                )}
              </TableCell>
              <TableCell>
                {commission(
                  test.referralCommissionType,
                  test.referralCommissionValue,
                )}
              </TableCell>
              <TableCell>
                {commission(
                  test.technicianCommissionType,
                  test.technicianCommissionValue,
                )}
              </TableCell>
              <TableCell>
                <StatusChip status={test.status} />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Edit test">
                  <IconButton
                    size="small"
                    aria-label={`Edit ${test.name}`}
                    onClick={() => onEdit(test)}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
