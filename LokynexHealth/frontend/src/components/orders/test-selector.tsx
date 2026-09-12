"use client";

import { useTests } from "@/hooks/use-departments";
import { useTechnicians } from "@/hooks/use-lookups";
import { OrderItemInput } from "@/types/order";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import {
  Autocomplete,
  Box,
  Checkbox,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

export function TestSelector({
  branchId,
  doctorId,
  referralId,
  items,
  onChange,
}: {
  branchId: string | null;
  doctorId: string | null;
  referralId: string | null;
  items: OrderItemInput[];
  onChange: (items: OrderItemInput[]) => void;
}) {
  const [testSearch, setTestSearch] = useState("");
  const { data: testResult } = useTests({
    search: testSearch || undefined,
    pageSize: 30,
    pageNumber: 1,
  });
  const { data: technicianResult } = useTechnicians(branchId);

  // O(1) membership check — the map key is testId, so "is this test already added"
  // is a single hash lookup, not a scan through the items array on every render.
  const selectedTestIds = useMemo(
    () => new Map(items.map((i) => [i.testId, i])),
    [items],
  );

  function addTest(test: { id: string; name: string; price: number } | null) {
    if (!test || selectedTestIds.has(test.id)) return;
    onChange([
      ...items,
      {
        testId: test.id,
        testName: test.name,
        price: test.price,
        doctorCommissionEnabled: false,
        referralCommissionEnabled: false,
      },
    ]);
  }

  function removeTest(testId: string) {
    onChange(items.filter((i) => i.testId !== testId));
  }

  function updateItem(testId: string, patch: Partial<OrderItemInput>) {
    onChange(items.map((i) => (i.testId === testId ? { ...i, ...patch } : i)));
  }

  return (
    <Box>
      <Autocomplete
        options={
          testResult?.items.filter((t) => !selectedTestIds.has(t.id)) ?? []
        }
        getOptionLabel={(t) => `${t.name} — ₹${t.price}`}
        onInputChange={(_, value) => setTestSearch(value)}
        onChange={(_, value) => addTest(value)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Add a test"
            size="small"
            placeholder="Search test name..."
          />
        )}
        sx={{ mb: 2 }}
      />

      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No tests added yet.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Test</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Technician</TableCell>
              <TableCell align="center">Dr. Comm.</TableCell>
              <TableCell align="center">Ref. Comm.</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.testId}>
                <TableCell>{item.testName}</TableCell>
                <TableCell>₹{item.price.toFixed(2)}</TableCell>
                <TableCell sx={{ minWidth: 160 }}>
                  <Autocomplete
                    size="small"
                    options={technicianResult?.items ?? []}
                    getOptionLabel={(t) => t.fullName}
                    onChange={(_, tech) =>
                      updateItem(item.testId, { technicianId: tech?.id })
                    }
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Select" />
                    )}
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title={!doctorId ? "Select a doctor first" : ""}>
                    <span>
                      <Checkbox
                        size="small"
                        disabled={!doctorId}
                        checked={item.doctorCommissionEnabled}
                        onChange={(e) =>
                          // Mirrors the backend's mutual-exclusivity rule (order_items CHECK
                          // constraint): enabling doctor commission here forces referral off,
                          // on the SAME test line, immediately in the UI.
                          updateItem(item.testId, {
                            doctorCommissionEnabled: e.target.checked,
                            referralCommissionEnabled: e.target.checked
                              ? false
                              : item.referralCommissionEnabled,
                          })
                        }
                      />
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title={!referralId ? "Select a referral first" : ""}>
                    <span>
                      <Checkbox
                        size="small"
                        disabled={!referralId}
                        checked={item.referralCommissionEnabled}
                        onChange={(e) =>
                          updateItem(item.testId, {
                            referralCommissionEnabled: e.target.checked,
                            doctorCommissionEnabled: e.target.checked
                              ? false
                              : item.doctorCommissionEnabled,
                          })
                        }
                      />
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => removeTest(item.testId)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
