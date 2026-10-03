"use client";

import { useDebounce } from "@/hooks/use-debounce";
import {
  useAllTechnicians,
  useDoctors,
  useReferrals,
} from "@/hooks/use-lookups";
import { LookupDto } from "@/types/lookup";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

export type CommissionEntity = "Doctor" | "Referral" | "Technician";

export interface CommissionRow {
  key: string;
  entityType: CommissionEntity;
  entity: { id: string; name: string } | null;
  commissionType: string;
  commissionValue: string;
}

let rowSeq = 0;
export function newCommissionRow(
  patch: Partial<CommissionRow> = {},
): CommissionRow {
  rowSeq += 1;
  return {
    key: `row-${rowSeq}`,
    entityType: "Doctor",
    entity: null,
    commissionType: "Flat",
    commissionValue: "0",
    ...patch,
  };
}

function PersonPicker({
  row,
  onChange,
}: {
  row: CommissionRow;
  onChange: (entity: CommissionRow["entity"]) => void;
}) {
  const [input, setInput] = useState("");
  const debounced = useDebounce(input, 300);

  const { data: doctors } = useDoctors(
    row.entityType === "Doctor" ? debounced : "",
  );
  const { data: referrals } = useReferrals(
    row.entityType === "Referral" ? debounced : "",
  );
  const { data: technicians } = useAllTechnicians(
    row.entityType === "Technician",
  );

  const options: (LookupDto & { branchName?: string })[] =
    row.entityType === "Doctor"
      ? (doctors?.items ?? [])
      : row.entityType === "Referral"
        ? (referrals?.items ?? [])
        : (technicians?.items ?? []);

  return (
    <Autocomplete
      size="small"
      sx={{ flex: 1, minWidth: 180 }}
      options={options}
      value={
        row.entity
          ? ({
              id: row.entity.id,
              fullName: row.entity.name,
              phone: "",
            } as LookupDto)
          : null
      }
      isOptionEqualToValue={(a, b) => a.id === b.id}
      getOptionLabel={(o) => o.fullName}
      filterOptions={
        row.entityType === "Technician"
          ? undefined // technicians are loaded in full, filter locally
          : (o) => o // doctors / referrals are filtered by the server
      }
      onInputChange={(_, v, reason) => {
        if (reason === "input") setInput(v);
      }}
      onChange={(_, v) => onChange(v ? { id: v.id, name: v.fullName } : null)}
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
      renderInput={(params) => (
        <TextField {...params} label={row.entityType} required />
      )}
    />
  );
}

/**
 * "Specific commissions": a doctor / referral / technician that gets a
 * DIFFERENT commission than the test default for this one test. These rows
 * are what the Commission tab pays out from.
 */
export function TestCommissionEditor({
  rows,
  onChange,
}: {
  rows: CommissionRow[];
  onChange: (rows: CommissionRow[]) => void;
}) {
  const update = (key: string, patch: Partial<CommissionRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {rows.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No one-to-one commission added. The default commission above applies
          to everyone.
        </Typography>
      )}

      {rows.map((row) => (
        <Box
          key={row.key}
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            alignItems: "center",
            p: 1,
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <TextField
            select
            size="small"
            label="Who"
            value={row.entityType}
            onChange={(e) =>
              update(row.key, {
                entityType: e.target.value as CommissionEntity,
                entity: null,
              })
            }
            sx={{ width: 130 }}
          >
            <MenuItem value="Doctor">Doctor</MenuItem>
            <MenuItem value="Referral">Referral</MenuItem>
            <MenuItem value="Technician">Technician</MenuItem>
          </TextField>

          <PersonPicker
            key={row.entityType}
            row={row}
            onChange={(entity) => update(row.key, { entity })}
          />

          <TextField
            select
            size="small"
            label="Type"
            value={row.commissionType}
            onChange={(e) =>
              update(row.key, { commissionType: e.target.value })
            }
            sx={{ width: 120 }}
          >
            <MenuItem value="Flat">Flat (₹)</MenuItem>
            <MenuItem value="Percentage">Percent (%)</MenuItem>
          </TextField>

          <TextField
            size="small"
            type="number"
            label="Value"
            value={row.commissionValue}
            onChange={(e) =>
              update(row.key, { commissionValue: e.target.value })
            }
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
            sx={{ width: 100 }}
          />

          <IconButton
            size="small"
            aria-label="Remove commission row"
            onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}

      <Box>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => onChange([...rows, newCommissionRow()])}
        >
          Add doctor / referral / technician
        </Button>
      </Box>
    </Box>
  );
}
