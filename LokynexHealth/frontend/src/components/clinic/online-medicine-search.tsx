"use client";

import { useDebounce } from "@/hooks/use-debounce";
import {
  googleMedicineUrl,
  searchOnlineMedicines,
  type OnlineMedicine,
} from "@/lib/clinic/drug-lookup";
import PublicIcon from "@mui/icons-material/Public";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

/**
 * Type a medicine name, pick a match from the online drug database and the
 * form is filled: name, company, composition, dose and timing.
 */
export function OnlineMedicineSearch({
  onPick,
}: {
  onPick: (m: OnlineMedicine) => void;
}) {
  const [input, setInput] = useState("");
  const term = useDebounce(input.trim(), 450);
  const [options, setOptions] = useState<OnlineMedicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);
    searchOnlineMedicines(term, ctrl.signal)
      .then((r) => setOptions(r))
      .catch((e: unknown) => {
        if ((e as { name?: string }).name === "AbortError") return;
        setOptions([]);
        setError(e instanceof Error ? e.message : "Search failed.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [term]);

  const shownOptions = term.length < 2 ? [] : options;

  return (
    <Box
      sx={{
        border: "1px dashed",
        borderColor: "primary.main",
        borderRadius: 3,
        p: 1.5,
        display: "grid",
        gap: 1,
        bgcolor: "action.hover",
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
        Search online and auto-fill
      </Typography>
      <Autocomplete<OnlineMedicine, false, false, false>
        options={shownOptions}
        loading={loading && term.length >= 2}
        filterOptions={(x) => x}
        inputValue={input}
        value={null}
        onInputChange={(_, v, reason) => {
          if (reason === "input") setInput(v);
        }}
        onChange={(_, v) => {
          if (v) {
            onPick(v);
            setInput("");
            setOptions([]);
          }
        }}
        getOptionLabel={(o) => o.brandName}
        isOptionEqualToValue={(a, b) => a.key === b.key}
        noOptionsText={
          term.length < 2
            ? "Type at least 2 letters"
            : loading
              ? "Searching..."
              : "Nothing found. Try the generic name, or fill the form by hand."
        }
        renderOption={(props, o) => {
          const { key, ...rest } = props;
          return (
            <Box
              component="li"
              key={key}
              {...rest}
              sx={{ display: "block !important" }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                {o.brandName}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                {[o.company, o.composition].filter(Boolean).join(" · ")}
              </Typography>
              {(o.dosage || o.frequency) && (
                <Typography variant="caption" color="primary">
                  {[o.dosage, o.frequency].filter(Boolean).join(" · ")}
                </Typography>
              )}
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder="Medicine or generic name, e.g. paracetamol"
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps.input,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <>
                    {loading ? <CircularProgress size={16} /> : null}
                    {params.slotProps.input?.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />
      {error && (
        <Alert severity="warning" sx={{ py: 0 }}>
          {error}
        </Alert>
      )}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}
      >
        <Button
          size="small"
          startIcon={<PublicIcon />}
          disabled={input.trim().length < 2}
          component="a"
          href={googleMedicineUrl(input.trim())}
          target="_blank"
          rel="noopener noreferrer"
        >
          Search on Google
        </Button>
        <Typography variant="caption" color="text.secondary">
          Check every filled detail before saving.
        </Typography>
      </Box>
    </Box>
  );
}
