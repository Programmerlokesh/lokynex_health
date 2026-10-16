"use client";

import { useEntityOptions } from "@/hooks/use-commission-report";
import { useDebounce } from "@/hooks/use-debounce";
import { defaultFilters, ReportFilterState } from "@/lib/commission-report";
import {
  EntityOption,
  PayoutEntityType,
  StatusFilter,
  WiseMode,
} from "@/types/commission-report";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { ReactNode, useMemo, useState } from "react";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    bgcolor: "background.paper",
  },
} as const;

/** Small CAPS label above a field (same as the Order List filters). */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography
        component="div"
        sx={{
          mb: 0.5,
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

/**
 * Nothing is searched while typing. Values live in a local DRAFT; only
 * "Generate" (or Enter) pushes them to the page. "Reset" clears everything.
 * PDF / WhatsApp always act on what is currently on screen (the applied filters).
 */
export function CommissionReportFilters({
  applied,
  busy,
  hasRows,
  onGenerate,
  onReset,
  onPdf,
  onWhatsApp,
}: {
  applied: ReportFilterState;
  busy: boolean;
  hasRows: boolean;
  onGenerate: (f: ReportFilterState) => void;
  onReset: () => void;
  onPdf: () => void;
  onWhatsApp: () => void;
}) {
  const [draft, setDraft] = useState<ReportFilterState>(applied);
  const [prevApplied, setPrevApplied] = useState(applied);
  const [open, setOpen] = useState(false); // phones: collapsed, md+: always open
  const [search, setSearch] = useState("");

  // Keep the draft in sync when the page changes `applied` from outside (Reset).
  if (prevApplied !== applied) {
    setPrevApplied(applied);
    setDraft(applied);
  }

  const patch = (p: Partial<ReportFilterState>) =>
    setDraft((d) => ({ ...d, ...p }));

  const debounced = useDebounce(search, 300);
  const { data: fetched = [], isFetching } = useEntityOptions(
    draft.entityType,
    debounced,
  );

  // The chosen person must always be in the list, or MUI warns about an unknown value.
  const options = useMemo<EntityOption[]>(
    () =>
      draft.entity && !fetched.some((o) => o.id === draft.entity!.id)
        ? [draft.entity, ...fetched]
        : fetched,
    [fetched, draft.entity],
  );

  const badRange =
    !!draft.dateFrom && !!draft.dateTo && draft.dateFrom > draft.dateTo;

  function submit() {
    if (badRange) return;
    onGenerate({
      ...draft,
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      address: draft.address.trim(),
    });
    setOpen(false);
  }

  function reset() {
    setDraft(defaultFilters());
    setSearch("");
    onReset();
  }

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      sx={{
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 4,
        p: { xs: 1.75, sm: 2.5 },
        mb: 2.5,
        boxShadow: "0 6px 20px rgba(23,43,77,0.05)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <FilterListIcon fontSize="small" />
            <Typography sx={{ fontWeight: 800, fontSize: 17 }}>
              Filters
            </Typography>
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, display: "block" }}
          >
            Date, type, person, status, grouping and contact details
          </Typography>
        </Box>
        <IconButton
          aria-label={open ? "Hide filters" : "Show filters"}
          onClick={() => setOpen((v) => !v)}
          sx={{
            display: { xs: "inline-flex", md: "none" },
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .2s",
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: { xs: open ? "block" : "none", md: "block" },
          mt: 1.75,
        }}
      >
        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Field label="From">
              <TextField
                type="date"
                size="small"
                fullWidth
                sx={fieldSx}
                slotProps={{ htmlInput: { "aria-label": "Date from" } }}
                value={draft.dateFrom}
                onChange={(e) => patch({ dateFrom: e.target.value })}
              />
            </Field>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Field label="To">
              <TextField
                type="date"
                size="small"
                fullWidth
                sx={fieldSx}
                error={badRange}
                helperText={badRange ? "Before start date" : undefined}
                slotProps={{ htmlInput: { "aria-label": "Date to" } }}
                value={draft.dateTo}
                onChange={(e) => patch({ dateTo: e.target.value })}
              />
            </Field>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Field label="Type">
              <TextField
                select
                size="small"
                fullWidth
                sx={fieldSx}
                slotProps={{ htmlInput: { "aria-label": "Commission type" } }}
                value={draft.entityType}
                onChange={(e) => {
                  setSearch("");
                  patch({
                    entityType: e.target.value as PayoutEntityType,
                    entity: null,
                  });
                }}
              >
                <MenuItem value="Referral">Referral</MenuItem>
                <MenuItem value="Doctor">Doctor</MenuItem>
                <MenuItem value="Technician">Technician</MenuItem>
              </TextField>
            </Field>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Field label={draft.entityType}>
              <Autocomplete
                size="small"
                fullWidth
                options={options}
                value={draft.entity}
                loading={isFetching}
                filterOptions={(x) => x} // the server already searched
                isOptionEqualToValue={(a, b) => a.id === b.id}
                getOptionLabel={(o) => o.fullName}
                onChange={(_, v) => patch({ entity: v })}
                onInputChange={(_, v, reason) => {
                  if (reason === "input") setSearch(v);
                  else if (reason === "clear") setSearch("");
                }}
                noOptionsText="No match"
                renderOption={(props, o) => {
                  const { key, ...rest } = props;
                  return (
                    <li key={key} {...rest}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                          {o.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {o.phone}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    sx={fieldSx}
                    placeholder="All"
                    slotProps={{
                      ...params.slotProps,
                      htmlInput: {
                        ...params.slotProps.htmlInput,
                        "aria-label": `${draft.entityType} name`,
                      },
                    }}
                  />
                )}
              />
            </Field>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Field label="Wise">
              <TextField
                select
                size="small"
                fullWidth
                sx={fieldSx}
                slotProps={{ htmlInput: { "aria-label": "Group by" } }}
                value={draft.wise}
                onChange={(e) => patch({ wise: e.target.value as WiseMode })}
              >
                <MenuItem value="Day">Day Wise</MenuItem>
                <MenuItem value="Week">Week Wise</MenuItem>
                <MenuItem value="Month">Month Wise</MenuItem>
              </TextField>
            </Field>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Field label="Commission Status">
              <TextField
                select
                size="small"
                fullWidth
                sx={fieldSx}
                slotProps={{ htmlInput: { "aria-label": "Commission status" } }}
                value={draft.status}
                onChange={(e) =>
                  patch({ status: e.target.value as StatusFilter })
                }
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Unpaid">Unpaid</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
              </TextField>
            </Field>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Field label="Phone">
              <TextField
                size="small"
                fullWidth
                sx={fieldSx}
                slotProps={{
                  htmlInput: { inputMode: "tel", "aria-label": "Phone" },
                }}
                value={draft.phone}
                onChange={(e) => patch({ phone: e.target.value })}
              />
            </Field>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Field label="Email">
              <TextField
                size="small"
                fullWidth
                sx={fieldSx}
                slotProps={{
                  htmlInput: { inputMode: "email", "aria-label": "Email" },
                }}
                value={draft.email}
                onChange={(e) => patch({ email: e.target.value })}
              />
            </Field>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Field label="Address">
              <TextField
                size="small"
                fullWidth
                sx={fieldSx}
                slotProps={{ htmlInput: { "aria-label": "Address" } }}
                value={draft.address}
                onChange={(e) => patch({ address: e.target.value })}
              />
            </Field>
          </Grid>
        </Grid>
      </Box>

      {/* ---------- actions (always visible, also on phones) ---------- */}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={badRange || busy}
        startIcon={
          busy ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <AutorenewIcon />
          )
        }
        sx={{ mt: 2, height: 44, borderRadius: 999, fontWeight: 800 }}
      >
        {busy ? "Generating..." : "Generate"}
      </Button>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
        <Button
          type="button"
          variant="outlined"
          color="inherit"
          startIcon={<RestartAltIcon />}
          onClick={reset}
          sx={{ borderRadius: 999, borderColor: "divider" }}
        >
          Reset
        </Button>
        <Button
          type="button"
          variant="outlined"
          color="inherit"
          startIcon={<PictureAsPdfOutlinedIcon />}
          disabled={!hasRows}
          onClick={onPdf}
          sx={{ borderRadius: 999, borderColor: "divider" }}
        >
          PDF
        </Button>
        <Button
          type="button"
          variant="contained"
          color="success"
          startIcon={<WhatsAppIcon />}
          disabled={!hasRows}
          onClick={onWhatsApp}
          sx={{ borderRadius: 999 }}
        >
          Send WhatsApp
        </Button>
      </Box>
    </Box>
  );
}
