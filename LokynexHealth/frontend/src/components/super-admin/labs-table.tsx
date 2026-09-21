"use client";

import { LabDetailDialog } from "@/components/super-admin/lab-detail-dialog";
import { SubscriptionChip } from "@/components/super-admin/subscription-status";
import { LabDto } from "@/types/super-admin";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  Card,
  Chip,
  IconButton,
  Paper,
  Stack,
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
import { useState } from "react";

const STATUS_COLOR: Record
  string,
  "success" | "warning" | "error" | "default"
> = {
  Active: "success",
  Suspended: "warning",
  Inactive: "error",
};

export function LabsTable({ rows }: { rows: LabDto[] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No labs provisioned yet.
      </Typography>
    );
  }

  return (
    <>
      {isMobile ? (
        <Stack spacing={1.5}>
          {rows.map((row, i) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <Card
                variant="outlined"
                sx={{ p: 2, borderRadius: 3, cursor: "pointer" }}
                onClick={() => setSelectedLabId(row.id)}
              >
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }} noWrap>
                      {row.primaryBranchName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.labCode} · {row.subdomain}
                    </Typography>
                  </Box>
                  <Chip
                    label={row.status}
                    size="small"
                    color={STATUS_COLOR[row.status] ?? "default"}
                    variant="outlined"
                  />
                </Stack>
                <Stack
                  direction="row"
                  sx={{ justifyContent: "space-between", mt: 1.5 }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Admin
                    </Typography>
                    <Typography variant="body2">{row.adminName}</Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary">
                      Users
                    </Typography>
                    <Typography variant="body2">{row.userLimit}</Typography>
                  </Box>
                </Stack>
                <Box sx={{ mt: 1.5 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="div"
                    sx={{ mb: 0.5 }}
                  >
                    Subscription
                  </Typography>
                  <SubscriptionChip subscription={row.subscription} />
                </Box>
              </Card>
            </motion.div>
          ))}
        </Stack>
      ) : (
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3, boxShadow: "0 4px 16px rgba(23,43,77,0.06)" }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell sx={{ fontWeight: 600 }}>Lab Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Primary Branch</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Subdomain</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Admin</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User Limit</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Subscription</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  style={{ display: "table-row" }}
                >
                  <TableCell sx={{ fontWeight: 500 }}>{row.labCode}</TableCell>
                  <TableCell>{row.primaryBranchName}</TableCell>
                  <TableCell>{row.subdomain}</TableCell>
                  <TableCell>{row.adminName}</TableCell>
                  <TableCell>{row.userLimit}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      size="small"
                      color={STATUS_COLOR[row.status] ?? "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <SubscriptionChip subscription={row.subscription} />
                  </TableCell>
                  <TableCell>
                    {new Date(row.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View / Edit details">
                      <IconButton
                        size="small"
                        onClick={() => setSelectedLabId(row.id)}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <LabDetailDialog
        labId={selectedLabId}
        open={!!selectedLabId}
        onClose={() => setSelectedLabId(null)}
      />
    </>
  );
}