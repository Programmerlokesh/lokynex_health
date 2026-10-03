"use client";

import { useDebounce } from "@/hooks/use-debounce";
import { useDepartments, useTests } from "@/hooks/use-departments";
import { useTechnicians } from "@/hooks/use-lookups";
import { formatMoney } from "@/lib/format";
import { TestDto } from "@/types/department";
import { LookupDto } from "@/types/lookup";
import { OrderItemInput } from "@/types/order";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

export function TestSelector({
  branchId,
  doctor,
  referral,
  items,
  onChange,
  onShowDetails,
}: {
  branchId: string | null;
  doctor: LookupDto | null;
  referral: LookupDto | null;
  items: OrderItemInput[];
  onChange: (items: OrderItemInput[]) => void;
  /** Referral selected -> doctor-commission slot becomes a details popup. */
  onShowDetails: (item: OrderItemInput) => void;
}) {
  // The department stays selected after adding a test, so several tests from one
  // department are quick; switching department just re-filters the search below.
  const [departmentId, setDepartmentId] = useState("");
  const [testInput, setTestInput] = useState("");
  const debouncedTest = useDebounce(testInput, 300);

  const { data: departments } = useDepartments();
  const activeDepartments = useMemo(
    () => (departments ?? []).filter((d) => d.status === "Active"),
    [departments],
  );

  const { data: testResult, isFetching } = useTests(
    {
      departmentId,
      search: debouncedTest || undefined,
      pageSize: 30,
      pageNumber: 1,
    },
    { enabled: !!departmentId },
  );
  const { data: technicianResult } = useTechnicians(branchId);

  // Hash lookup => "already added?" is O(1) per option instead of a scan per render.
  const selected = useMemo(() => new Set(items.map((i) => i.testId)), [items]);
  const options = useMemo(
    () =>
      (testResult?.items ?? []).filter(
        (t) => t.status === "Active" && !selected.has(t.id),
      ),
    [testResult, selected],
  );

  function addTest(test: TestDto | null) {
    if (!test || selected.has(test.id)) return;
    onChange([
      ...items,
      {
        testId: test.id,
        testName: test.name,
        departmentId: test.departmentId,
        departmentName: test.departmentName,
        price: test.price,
        referralCommissionType: test.referralCommissionType,
        referralCommissionValue: test.referralCommissionValue,
        doctorCommissionEnabled: false,
        // With a referral on the order its commission applies by default.
        referralCommissionEnabled: !!referral,
      },
    ]);
    setTestInput("");
  }

  const updateItem = (testId: string, patch: Partial<OrderItemInput>) =>
    onChange(items.map((i) => (i.testId === testId ? { ...i, ...patch } : i)));

  return (
    <Box>
      {/* Step 1 department, step 2 test search */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 2fr" },
        }}
      >
        <TextField
          select
          label="Department"
          size="small"
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setTestInput("");
          }}
        >
          {activeDepartments.length === 0 && (
            <MenuItem value="" disabled>
              No departments available
            </MenuItem>
          )}
          {activeDepartments.map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.name}
            </MenuItem>
          ))}
        </TextField>

        <Autocomplete<TestDto, false, false, false>
          key={departmentId /* reset the box when the department changes */}
          disabled={!departmentId}
          value={null}
          options={options}
          loading={isFetching}
          filterOptions={(o) => o /* server already filtered */}
          getOptionLabel={(t) => t.name}
          inputValue={testInput}
          onInputChange={(_, v, reason) => {
            if (reason !== "reset") setTestInput(v);
          }}
          onChange={(_, t) => addTest(t)}
          noOptionsText={isFetching ? "Searching..." : "No tests found"}
          renderOption={(props, t) => {
            const { key, ...rest } = props;
            return (
              <Box
                component="li"
                key={key}
                {...rest}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Typography variant="body2" sx={{ minWidth: 0 }} noWrap>
                  {t.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, flexShrink: 0 }}
                >
                  {formatMoney(t.price)}
                </Typography>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label={
                departmentId ? "Search & add test" : "Select a department first"
              }
              slotProps={{
                ...params.slotProps,
                input: {
                  ...params.slotProps.input,
                  endAdornment: (
                    <>
                      {isFetching && <CircularProgress size={16} />}
                      {params.slotProps.input.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />
      </Box>

      {/* Added tests — cards stack on phones, become one dense row from md up */}
      <Box sx={{ mt: 2, display: "grid", gap: 1.25 }}>
        {items.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No tests added yet. Pick a department, then search a test. You can
            switch department and keep adding.
          </Typography>
        )}

        {items.map((item) => (
          <Paper
            key={item.testId}
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 2,
              display: "grid",
              gap: 1.25,
              alignItems: "center",
              gridTemplateColumns: {
                xs: "1fr auto",
                md: "minmax(0,2fr) 90px minmax(150px,1.3fr) minmax(200px,auto) auto",
              },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {item.testName}
              </Typography>
              <Chip
                label={item.departmentName}
                size="small"
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </Box>

            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                textAlign: "right",
                gridColumn: { xs: "2", md: "auto" },
                gridRow: { xs: "1", md: "auto" },
              }}
            >
              {formatMoney(item.price)}
            </Typography>

            <Autocomplete
              size="small"
              sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
              options={technicianResult?.items ?? []}
              getOptionLabel={(t) => t.fullName}
              onChange={(_, tech) =>
                updateItem(item.testId, { technicianId: tech?.id })
              }
              renderInput={(params) => (
                <TextField {...params} placeholder="Technician (optional)" />
              )}
            />

            <Box sx={{ gridColumn: { xs: "1", md: "auto" } }}>
              {referral ? (
                // Referral chosen => doctor is not paid; show the test details instead.
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<InfoOutlinedIcon />}
                  onClick={() => onShowDetails(item)}
                >
                  Test details
                </Button>
              ) : (
                <FormControlLabel
                  sx={{ m: 0 }}
                  disabled={!doctor}
                  label={
                    <Typography variant="caption">Doctor commission</Typography>
                  }
                  control={
                    <Checkbox
                      size="small"
                      checked={item.doctorCommissionEnabled}
                      onChange={(e) =>
                        updateItem(item.testId, {
                          doctorCommissionEnabled: e.target.checked,
                        })
                      }
                    />
                  }
                />
              )}
              {referral && (
                <FormControlLabel
                  sx={{ m: 0, ml: 1 }}
                  label={
                    <Typography variant="caption">Ref. commission</Typography>
                  }
                  control={
                    <Checkbox
                      size="small"
                      checked={item.referralCommissionEnabled}
                      onChange={(e) =>
                        updateItem(item.testId, {
                          referralCommissionEnabled: e.target.checked,
                        })
                      }
                    />
                  }
                />
              )}
            </Box>

            <IconButton
              size="small"
              aria-label={`Remove ${item.testName}`}
              onClick={() =>
                onChange(items.filter((i) => i.testId !== item.testId))
              }
              sx={{
                gridColumn: { xs: "2", md: "auto" },
                gridRow: { xs: "3", md: "auto" },
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
