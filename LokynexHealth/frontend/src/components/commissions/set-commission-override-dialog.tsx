"use client";

import { useBranches } from "@/hooks/use-branches";
import { useSetCommissionOverride } from "@/hooks/use-commissions";
import { useDebounce } from "@/hooks/use-debounce";
import { useTests } from "@/hooks/use-departments";
import { useDoctors, useReferrals, useTechnicians } from "@/hooks/use-lookups";
import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  TextField,
} from "@mui/material";
import { useState } from "react";

const ENTITY_TYPES = ["Doctor", "Referral", "Technician"] as const;

export function SetCommissionOverrideDialog() {
  const [open, setOpen] = useState(false);
  const [entityType, setEntityType] =
    useState<(typeof ENTITY_TYPES)[number]>("Doctor");

  const [branchId, setBranchId] = useState<string | null>(null);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [entitySearch, setEntitySearch] = useState("");
  const debouncedEntitySearch = useDebounce(entitySearch, 350);

  const [testId, setTestId] = useState<string | null>(null);
  const [testSearch, setTestSearch] = useState("");
  const debouncedTestSearch = useDebounce(testSearch, 350);

  const [commissionType, setCommissionType] = useState("Flat");
  const [commissionValue, setCommissionValue] = useState("0");

  const { data: branches } = useBranches({ pageSize: 100 });
  const { data: doctorResult } = useDoctors(
    entityType === "Doctor" ? debouncedEntitySearch : "",
  );
  const { data: referralResult } = useReferrals(
    entityType === "Referral" ? debouncedEntitySearch : "",
  );
  const { data: technicianResult } = useTechnicians(
    entityType === "Technician" ? branchId : null,
  );
  const { data: testResult } = useTests({
    search: debouncedTestSearch || undefined,
    pageSize: 20,
  });

  const setOverride = useSetCommissionOverride();

  const entityOptions =
    entityType === "Doctor"
      ? (doctorResult?.items ?? [])
      : entityType === "Referral"
        ? (referralResult?.items ?? [])
        : (technicianResult?.items ?? []);

  function resetForm() {
    setEntityType("Doctor");
    setBranchId(null);
    setEntityId(null);
    setEntitySearch("");
    setTestId(null);
    setTestSearch("");
    setCommissionType("Flat");
    setCommissionValue("0");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!entityId || !testId) return;

    setOverride.mutate(
      {
        entityType,
        entityId,
        testId,
        commissionType,
        commissionValue: Number(commissionValue),
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      },
    );
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
      >
        Set Override
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Set Commission Override
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {setOverride.isError && (
              <Alert severity="error">
                Could not save the override. Please try again.
              </Alert>
            )}

            <TextField
              select
              label="Applies To"
              size="small"
              fullWidth
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value as (typeof ENTITY_TYPES)[number]);
                setBranchId(null);
                setEntityId(null);
                setEntitySearch("");
              }}
            >
              {ENTITY_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>

            {entityType === "Technician" && (
              <TextField
                select
                label="Branch"
                size="small"
                fullWidth
                required
                value={branchId ?? ""}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setEntityId(null);
                }}
              >
                {branches?.items && branches.items.length > 0 ? (
                  branches.items.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.branchName}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>
                    No branches available
                  </MenuItem>
                )}
              </TextField>
            )}

            <Autocomplete
              options={entityOptions}
              getOptionLabel={(o) => `${o.fullName} — ${o.phone}`}
              onInputChange={(_, v) => setEntitySearch(v)}
              onChange={(_, v) => setEntityId(v?.id ?? null)}
              disabled={entityType === "Technician" && !branchId}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={entityType}
                  size="small"
                  required
                />
              )}
            />

            <Autocomplete
              options={testResult?.items ?? []}
              getOptionLabel={(t) => `${t.name} (${t.departmentName})`}
              onInputChange={(_, v) => setTestSearch(v)}
              onChange={(_, v) => setTestId(v?.id ?? null)}
              renderInput={(params) => (
                <TextField {...params} label="Test" size="small" required />
              )}
            />

            <TextField
              select
              label="Commission Type"
              size="small"
              fullWidth
              value={commissionType}
              onChange={(e) => setCommissionType(e.target.value)}
            >
              <MenuItem value="Flat">Flat</MenuItem>
              <MenuItem value="Percentage">Percentage</MenuItem>
            </TextField>

            <TextField
              label="Commission Value"
              type="number"
              size="small"
              fullWidth
              required
              value={commissionValue}
              onChange={(e) => setCommissionValue(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      {commissionType === "Percentage" ? "%" : "₹"}
                    </InputAdornment>
                  ),
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={setOverride.isPending || !entityId || !testId}
            >
              {setOverride.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
