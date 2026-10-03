"use client";

import { useDebounce } from "@/hooks/use-debounce";
import { useDoctors, useReferrals } from "@/hooks/use-lookups";
import { LookupDto } from "@/types/lookup";
import LocalPhoneOutlinedIcon from "@mui/icons-material/LocalPhoneOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import {
  Autocomplete,
  Box,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

/**
 * One search box for Doctor OR Referral. Typing a name (or phone) queries the
 * server (debounced); every option and the selected card show
 * name + address + phone.
 */
export function PersonSearchSelect({
  kind,
  value,
  onChange,
}: {
  kind: "doctor" | "referral";
  value: LookupDto | null;
  onChange: (v: LookupDto | null) => void;
}) {
  const [input, setInput] = useState("");
  const debounced = useDebounce(input, 300);

  const doctors = useDoctors(kind === "doctor" ? debounced : "");
  const referrals = useReferrals(kind === "referral" ? debounced : "");
  const query = kind === "doctor" ? doctors : referrals;
  const label = kind === "doctor" ? "Doctor" : "Referral";

  return (
    <Box>
      <Autocomplete
        value={value}
        options={query.data?.items ?? []}
        loading={query.isFetching}
        // Server already filters; stop MUI from filtering a second time.
        filterOptions={(o) => o}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        getOptionLabel={(o) => o.fullName}
        onInputChange={(_, v, reason) => {
          if (reason !== "reset") setInput(v);
        }}
        onChange={(_, v) => onChange(v)}
        noOptionsText={`No ${label.toLowerCase()} found`}
        renderOption={(props, o) => {
          const { key, ...rest } = props;
          return (
            <Box component="li" key={key} {...rest} sx={{ py: 1 }}>
              <PersonLines person={o} />
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={`${label} (search by name)`}
            size="small"
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps.input,
                endAdornment: (
                  <>
                    {query.isFetching && <CircularProgress size={16} />}
                    {params.slotProps.input.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />

      {value && (
        <Paper
          variant="outlined"
          sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: "action.hover" }}
        >
          <PersonLines person={value} />
        </Paper>
      )}
    </Box>
  );
}

function PersonLines({ person }: { person: LookupDto }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
        {person.fullName}
        {person.specialization ? ` · ${person.specialization}` : ""}
      </Typography>
      <Box
        sx={{ display: "flex", flexWrap: "wrap", columnGap: 2, rowGap: 0.25 }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
        >
          <LocalPhoneOutlinedIcon sx={{ fontSize: 14 }} />
          {person.phone}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            minWidth: 0,
          }}
        >
          <PlaceOutlinedIcon sx={{ fontSize: 14 }} />
          {person.address || "No address"}
        </Typography>
      </Box>
    </Box>
  );
}
