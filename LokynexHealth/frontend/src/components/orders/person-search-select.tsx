"use client";

import { QuickAddPersonDialog } from "@/components/orders/quick-add-person-dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { useDoctors, useReferrals } from "@/hooks/use-lookups";
import { LookupDto } from "@/types/lookup";
import AddIcon from "@mui/icons-material/Add";
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

/** Sentinel option shown at the bottom of the list: "+ Add new ...". */
const ADD_ID = "__add_new__";

/**
 * One search box for Doctor OR Referral. Typing a name (or phone) queries the
 * server (debounced); every option and the selected card show
 * name + address + phone. If the person isn't in the database yet, the last
 * option lets the user add them on the spot and auto-selects the new record.
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
  const [addOpen, setAddOpen] = useState(false);
  const [addSeed, setAddSeed] = useState("");
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
        // We only append the "+ Add new" row, which is always the last option.
        filterOptions={(options, state) => [
          ...options,
          { id: ADD_ID, fullName: state.inputValue.trim(), phone: "" },
        ]}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        getOptionLabel={(o) => o.fullName}
        onInputChange={(_, v, reason) => {
          if (reason !== "reset") setInput(v);
        }}
        onChange={(_, v) => {
          if (v && v.id === ADD_ID) {
            // Don't select the sentinel — open the quick-add dialog instead.
            setAddSeed(input.trim());
            setAddOpen(true);
            return;
          }
          onChange(v);
        }}
        renderOption={(props, o) => {
          const { key, ...rest } = props;
          if (o.id === ADD_ID) {
            return (
              <Box
                component="li"
                key={key}
                {...rest}
                sx={{
                  py: 1.25,
                  gap: 1,
                  color: "primary.main",
                  fontWeight: 600,
                  borderTop: 1,
                  borderColor: "divider",
                  minHeight: 44,
                }}
              >
                <AddIcon fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {o.fullName
                    ? `Add "${o.fullName}" as new ${label.toLowerCase()}`
                    : `Add new ${label.toLowerCase()}`}
                </Typography>
              </Box>
            );
          }
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

      {addOpen && (
        <QuickAddPersonDialog
          kind={kind}
          seed={addSeed}
          onClose={() => setAddOpen(false)}
          onCreated={(person) => {
            setAddOpen(false);
            setInput("");
            onChange(person); // auto-select the newly added record
          }}
        />
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
