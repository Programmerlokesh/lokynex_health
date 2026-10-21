"use client";

import { Avatar } from "@/components/common/page-kit";
import { getDeptMeta } from "@/components/departments/department-meta";
import { DeptIconBadge } from "@/components/departments/dept-icon-badge";
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
import { DepartmentDto } from "@/types/department";
import { LookupDto } from "@/types/lookup";
import HandshakeOutlinedIcon from "@mui/icons-material/HandshakeOutlined";
import MedicalServicesOutlinedIcon from "@mui/icons-material/MedicalServicesOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

const ENTITY_TYPES = ["Doctor", "Referral", "Technician"] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

/** What the user changed on a row: new values, or "back to the test default". */
type Draft = { type: string; value: string } | { reset: true };

const sameNumber = (a: string, b: number) => Number(a) === b;

export function CommissionTable({
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
  const [testSearch, setTestSearch] = useState("");
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

  const q = testSearch.trim().toLowerCase();
  const visibleRows = q
    ? rows.filter((r) => r.testName.toLowerCase().includes(q))
    : rows;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {message && (
        <Alert severity={message.severity} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <TextField
        size="small"
        placeholder={`Search ${rows.length} tests...`}
        value={testSearch}
        onChange={(e) => setTestSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          maxWidth: 360,
          "& .MuiOutlinedInput-root": { borderRadius: "12px" },
        }}
      />

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 3, maxHeight: { md: "48vh" }, overflow: "auto" }}
      >
        <Table size="small" stickyHeader sx={{ minWidth: 640 }}>
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
            {visibleRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{ py: 3, color: "text.secondary" }}
                >
                  No test matches “{testSearch}”.
                </TableCell>
              </TableRow>
            )}
            {visibleRows.map((row) => {
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

const TYPE_META: Record<EntityType, { icon: React.ReactNode; color: string }> =
  {
    Doctor: {
      icon: <MedicalServicesOutlinedIcon fontSize="small" />,
      color: "#0EA5E9",
    },
    Referral: {
      icon: <HandshakeOutlinedIcon fontSize="small" />,
      color: "#7C3AED",
    },
    Technician: {
      icon: <ScienceOutlinedIcon fontSize="small" />,
      color: "#00BFA6",
    },
  };

const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "12px" } };

/**
 * Commission Setup, step by step:
 *   1. choose Doctor / Referral / Technician, then search the person
 *   2. search / choose a department
 *   3. edit the rate of every test under it, then save once.
 */
export function DepartmentCommissionEditor() {
  const [entityType, setEntityType] = useState<EntityType>("Doctor");
  const [person, setPerson] = useState<LookupDto | null>(null);
  const [personInput, setPersonInput] = useState("");
  const debouncedInput = useDebounce(personInput, 300);
  const [department, setDepartment] = useState<DepartmentDto | null>(null);

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

  const departmentId = department?.id ?? null;
  const {
    data: rows,
    isLoading,
    isError,
  } = useEffectiveCommissions({
    entityType,
    entityId: person?.id ?? null,
    departmentId,
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* 1. who */}
      <Box>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>
          1. Who gets the commission?
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={entityType}
          onChange={(_, v: EntityType | null) => {
            if (!v) return;
            setEntityType(v);
            setPerson(null);
            setPersonInput("");
          }}
          sx={{ mb: 1.5, flexWrap: "wrap", gap: 0.75 }}
        >
          {ENTITY_TYPES.map((t) => (
            <ToggleButton
              key={t}
              value={t}
              sx={{
                borderRadius: "999px !important",
                border: "1px solid !important",
                borderColor: "divider",
                px: 1.75,
                gap: 0.75,
                fontWeight: 700,
                textTransform: "none",
                "&.Mui-selected": {
                  bgcolor: TYPE_META[t].color,
                  color: "#fff",
                  "&:hover": { bgcolor: TYPE_META[t].color },
                },
              }}
            >
              {TYPE_META[t].icon}
              {t}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Autocomplete
          key={entityType}
          options={options}
          value={person}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          getOptionLabel={(o) => o.fullName}
          filterOptions={entityType === "Technician" ? undefined : (o) => o}
          noOptionsText={`No ${entityType.toLowerCase()} found`}
          onInputChange={(_, v, reason) => {
            if (reason === "input") setPersonInput(v);
          }}
          onChange={(_, v) => setPerson(v)}
          renderOption={(props, o) => {
            const { key, ...rest } = props;
            return (
              <Box component="li" key={key} {...rest} sx={{ gap: 1.25 }}>
                <Avatar name={o.fullName} size={32} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
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
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={`Search ${entityType.toLowerCase()} by name or phone...`}
              sx={fieldSx}
            />
          )}
        />
      </Box>

      {/* 2. which department */}
      <Box>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>
          2. Which department?
        </Typography>
        <Autocomplete
          options={activeDepartments}
          value={department}
          disabled={!person}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          getOptionLabel={(d) => d.name}
          noOptionsText="No department found"
          onChange={(_, v) => setDepartment(v)}
          renderOption={(props, d) => {
            const { key, ...rest } = props;
            const meta = getDeptMeta(d.name);
            return (
              <Box component="li" key={key} {...rest} sx={{ gap: 1.25 }}>
                <DeptIconBadge Icon={meta.Icon} color={meta.color} size={30} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {d.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: "auto" }}
                >
                  {d.testCount} tests
                </Typography>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={
                person
                  ? "Search department..."
                  : `Select a ${entityType.toLowerCase()} first`
              }
              sx={fieldSx}
            />
          )}
        />
      </Box>

      {/* 3. rates */}
      <Box>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>
          3. Tests and rates
        </Typography>
        {!person || !department ? (
          <Box
            sx={{
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 3,
              p: 3,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <Typography variant="body2">
              Pick a {entityType.toLowerCase()} and a department to see every
              test under it with its commission rate.
            </Typography>
          </Box>
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
            key={`${entityType}-${person.id}-${department.id}`}
            entityType={entityType}
            entityId={person.id}
            departmentId={department.id}
            rows={rows ?? []}
          />
        )}
      </Box>
    </Box>
  );
}
