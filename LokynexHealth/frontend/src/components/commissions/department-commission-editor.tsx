"use client";

import {
  useBulkSetCommissions,
  useEffectiveCommissions,
} from "@/hooks/use-commissions";
import { useDebounce } from "@/hooks/use-debounce";
import { useDepartments } from "@/hooks/use-departments";
import {
  useAllTechnicians,
  useDoctors,
  useReferrals,
} from "@/hooks/use-lookups";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/lib/format";
import { EffectiveCommissionDto } from "@/types/commission";
import { LookupDto } from "@/types/lookup";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

const ENTITY_TYPES = ["Doctor", "Referral", "Technician"] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

/** What the user changed on a row: new values, or "back to the test default". */
type Draft = { type: string; value: string } | { reset: true };

const sameNumber = (a: string, b: number) => Number(a) === b;

function CommissionTable({
  entityType,
  entityId,
  departmentId,
  rows,
}: {
  entityType: EntityType;
  entityId: string;
  departmentId: string;
  rows: EffectiveCommissionDto[];
}) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [message, setMessage] = useState<{
    severity: "success" | "error";
    text: string;
  } | null>(null);
  const bulk = useBulkSetCommissions();

  const shown = (row: EffectiveCommissionDto) => {
    const d = drafts[row.testId];
    if (!d)
      return {
        type: row.commissionType,
        value: String(row.commissionValue),
        reset: false,
      };
    if ("reset" in d)
      return {
        type: row.defaultCommissionType,
        value: String(row.defaultCommissionValue),
        reset: true,
      };
    return { type: d.type, value: d.value, reset: false };
  };

  function edit(
    row: EffectiveCommissionDto,
    patch: Partial<{ type: string; value: string }>,
  ) {
    const cur = shown(row);
    const next = {
      type: patch.type ?? cur.type,
      value: patch.value ?? cur.value,
    };
    setMessage(null);
    setDrafts((prev) => {
      const copy = { ...prev };
      // Back to what is already saved => not a pending change any more.
      if (
        next.type === row.commissionType &&
        sameNumber(next.value, row.commissionValue)
      ) {
        delete copy[row.testId];
      } else {
        copy[row.testId] = next;
      }
      return copy;
    });
  }

  const pendingCount = Object.keys(drafts).length;

  function save() {
    setMessage(null);
    const items = Object.entries(drafts).map(([testId, d]) =>
      "reset" in d
        ? { testId, commissionType: "Flat", commissionValue: 0, reset: true }
        : {
            testId,
            commissionType: d.type,
            commissionValue: Number(d.value) || 0,
          },
    );
    bulk.mutate(
      { entityType, entityId, departmentId, items },
      {
        onSuccess: ({ changed }) => {
          setDrafts({});
          setMessage({
            severity: "success",
            text:
              changed > 0
                ? `${changed} test commission(s) updated.`
                : "Nothing to update.",
          });
        },
        onError: (err) =>
          setMessage({
            severity: "error",
            text: getApiErrorMessage(err, "Could not save the commissions."),
          }),
      },
    );
  }

  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        This department has no tests yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {message && (
        <Alert severity={message.severity} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, boxShadow: "0 4px 16px rgba(23,43,77,0.06)" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 600 }}>Test</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Test default</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Commission</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Reset
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const cur = shown(row);
              const isCustom = drafts[row.testId]
                ? !cur.reset
                : row.hasOverride;
              return (
                <TableRow key={row.testId} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {row.testName}
                    {row.testStatus !== "Active" && (
                      <Chip label="Inactive" size="small" sx={{ ml: 1 }} />
                    )}
                    {isCustom && (
                      <Chip
                        label="custom"
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{formatMoney(row.price)}</TableCell>
                  <TableCell>
                    {row.defaultCommissionType === "Percentage"
                      ? `${row.defaultCommissionValue}%`
                      : `₹${row.defaultCommissionValue}`}
                  </TableCell>
                  <TableCell sx={{ width: 140 }}>
                    <TextField
                      select
                      size="small"
                      value={cur.type}
                      onChange={(e) => edit(row, { type: e.target.value })}
                      fullWidth
                    >
                      <MenuItem value="Flat">Flat (₹)</MenuItem>
                      <MenuItem value="Percentage">Percent (%)</MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell sx={{ width: 130 }}>
                    <TextField
                      size="small"
                      type="number"
                      value={cur.value}
                      onChange={(e) => edit(row, { value: e.target.value })}
                      slotProps={{ htmlInput: { min: 0, step: "any" } }}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Use the test's default commission">
                      <span>
                        <IconButton
                          size="small"
                          aria-label={`Reset ${row.testName}`}
                          disabled={!row.hasOverride || cur.reset}
                          onClick={() =>
                            setDrafts((p) => ({
                              ...p,
                              [row.testId]: { reset: true },
                            }))
                          }
                        >
                          <RestartAltIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
        <Button
          color="inherit"
          disabled={pendingCount === 0}
          onClick={() => setDrafts({})}
        >
          Discard
        </Button>
        <Button
          variant="contained"
          disabled={pendingCount === 0 || bulk.isPending}
          onClick={save}
        >
          {bulk.isPending
            ? "Saving..."
            : pendingCount > 0
              ? `Save ${pendingCount} change${pendingCount === 1 ? "" : "s"}`
              : "Save changes"}
        </Button>
      </Box>
    </Box>
  );
}

/**
 * Commission Setup, step by step:
 *   1. choose Doctor / Referral / Technician and the person
 *   2. choose a department
 *   3. edit the commission of every test under it, then save once.
 */
export function DepartmentCommissionEditor() {
  const [entityType, setEntityType] = useState<EntityType>("Doctor");
  const [person, setPerson] = useState<LookupDto | null>(null);
  const [personInput, setPersonInput] = useState("");
  const debouncedInput = useDebounce(personInput, 300);
  const [departmentId, setDepartmentId] = useState("");

  const { data: doctors } = useDoctors(
    entityType === "Doctor" ? debouncedInput : "",
  );
  const { data: referrals } = useReferrals(
    entityType === "Referral" ? debouncedInput : "",
  );
  const { data: technicians } = useAllTechnicians(entityType === "Technician");
  const { data: departments } = useDepartments();

  const options: (LookupDto & { branchName?: string })[] =
    entityType === "Doctor"
      ? (doctors?.items ?? [])
      : entityType === "Referral"
        ? (referrals?.items ?? [])
        : (technicians?.items ?? []);

  const activeDepartments = useMemo(
    () => (departments ?? []).filter((d) => d.status === "Active"),
    [departments],
  );

  const {
    data: rows,
    isLoading,
    isError,
  } = useEffectiveCommissions({
    entityType,
    entityId: person?.id ?? null,
    departmentId: departmentId || null,
  });

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        Update commission by department
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", md: "160px 1fr 1fr" },
        }}
      >
        <TextField
          select
          size="small"
          label="Commission for"
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value as EntityType);
            setPerson(null);
            setPersonInput("");
          }}
        >
          {ENTITY_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>

        <Autocomplete
          key={entityType}
          size="small"
          options={options}
          value={person}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          getOptionLabel={(o) => o.fullName}
          filterOptions={entityType === "Technician" ? undefined : (o) => o}
          onInputChange={(_, v, reason) => {
            if (reason === "input") setPersonInput(v);
          }}
          onChange={(_, v) => setPerson(v)}
          renderOption={(props, o) => {
            const { key, ...rest } = props;
            return (
              <Box component="li" key={key} {...rest}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {o.fullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {o.phone}
                    {o.branchName ? ` · ${o.branchName}` : ""}
                  </Typography>
                </Box>
              </Box>
            );
          }}
          renderInput={(params) => <TextField {...params} label={entityType} />}
        />

        <TextField
          select
          size="small"
          label="Department"
          value={departmentId}
          disabled={!person}
          onChange={(e) => setDepartmentId(e.target.value)}
          helperText={
            !person ? `Select a ${entityType.toLowerCase()} first` : undefined
          }
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
      </Box>

      {!person || !departmentId ? (
        <Typography variant="body2" color="text.secondary">
          Pick a {entityType.toLowerCase()} and a department to see and edit the
          commission of every test under it.
        </Typography>
      ) : isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={26} />
        </Box>
      ) : isError ? (
        <Alert severity="error">
          Failed to load the tests of this department.
        </Alert>
      ) : (
        <CommissionTable
          // fresh draft state whenever the person / department changes
          key={`${entityType}-${person.id}-${departmentId}`}
          entityType={entityType}
          entityId={person.id}
          departmentId={departmentId}
          rows={rows ?? []}
        />
      )}
    </Paper>
  );
}
