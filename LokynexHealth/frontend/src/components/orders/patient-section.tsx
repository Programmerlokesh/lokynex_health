"use client";

import { useDebounce } from "@/hooks/use-debounce";
import { usePatientSearch } from "@/hooks/use-patients";
import {
  normalizePhone,
  PatientFormState,
  RELATIONS,
} from "@/lib/patient-form";
import { PatientDto } from "@/types/patient";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ElderlyOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

const GENDERS = ["Male", "Female", "Other"];

export function PatientSection({
  value,
  onChange,
}: {
  value: PatientFormState;
  onChange: (next: PatientFormState) => void;
}) {
  const [addingRelative, setAddingRelative] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const phone = normalizePhone(value.phone);
  const debouncedPhone = useDebounce(value.phone, 300);
  const { data: results, isFetching } = usePatientSearch(debouncedPhone);

  // Exact match = the number is complete and already registered -> load that
  // family automatically, no extra click.
  const exact = results?.find((p) => normalizePhone(p.phone) === phone) ?? null;
  const guardian = value.guardian;

  // Complete number that is already registered -> attach that family to the
  // form state (the page validates/submits from state, not from this derived value).
  useEffect(() => {
    if (exact && !value.guardian) {
      onChange({ ...value, guardian: exact, subject: { kind: "guardian" } });
    }
  }, [exact, value, onChange]);
  const suggestions =
    !guardian && !dismissed && phone.length >= 3
      ? (results ?? []).filter((p) => normalizePhone(p.phone) !== phone)
      : [];

  function patch(p: Partial<PatientFormState>) {
    onChange({ ...value, ...p });
  }

  function handlePhone(raw: string) {
    const stillSame =
      value.guardian &&
      normalizePhone(value.guardian.phone) === normalizePhone(raw);
    setDismissed(false);
    onChange({
      ...value,
      phone: raw,
      // Editing the number detaches the previously loaded family.
      guardian: stillSame ? value.guardian : null,
      subject: stillSame ? value.subject : { kind: "guardian" },
    });
    if (!stillSame) setAddingRelative(false);
  }

  function pick(p: PatientDto) {
    setDismissed(true);
    onChange({
      ...value,
      phone: p.phone,
      guardian: p,
      subject: { kind: "guardian" },
    });
  }

  const effective = value;

  function selectSubject(subject: PatientFormState["subject"]) {
    onChange({ ...effective, subject });
    setAddingRelative(subject.kind === "newRelative");
  }

  const subject = effective.subject;

  return (
    <Box>
      <TextField
        label="Patient Phone"
        size="small"
        fullWidth
        required
        type="tel"
        autoComplete="off"
        placeholder="Search by phone number"
        value={value.phone}
        onChange={(e) => handlePhone(e.target.value)}
        slotProps={{
          htmlInput: { inputMode: "tel", maxLength: 20 },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: isFetching ? <CircularProgress size={16} /> : null,
          },
        }}
      />

      {/* Suggestions while typing a partial number */}
      <Collapse in={suggestions.length > 0}>
        <Paper
          variant="outlined"
          sx={{ mt: 1, borderRadius: 2, overflow: "hidden" }}
        >
          <List dense disablePadding>
            {suggestions.map((p) => (
              <ListItemButton key={p.id} onClick={() => pick(p)} sx={{ py: 1 }}>
                <ListItemText
                  primary={p.fullName || p.phone}
                  secondary={`${p.phone}${p.relatives.length ? ` · ${p.relatives.length} family member(s)` : ""}`}
                  slotProps={{
                    primary: { noWrap: true, sx: { fontWeight: 600 } },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Collapse>

      {/* ---------- Existing family ---------- */}
      {guardian && (
        <Paper
          variant="outlined"
          sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: "action.hover" }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <ElderlyOutlinedIcon color="primary" />
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                {guardian.fullName || "(name not saved)"}{" "}
                <Chip
                  label="Guardian"
                  size="small"
                  color="primary"
                  sx={{ ml: 0.5 }}
                />
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                {guardian.patientCode} · {guardian.phone}
                {guardian.age != null ? ` · ${guardian.age} yrs` : ""}
                {guardian.gender ? ` · ${guardian.gender}` : ""}
              </Typography>
              {guardian.address && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  {guardian.address}
                </Typography>
              )}
            </Box>
            <IconButton
              size="small"
              aria-label="Clear patient"
              onClick={() => {
                setAddingRelative(false);
                setDismissed(true);
                onChange({
                  ...value,
                  guardian: null,
                  phone: "",
                  subject: { kind: "guardian" },
                });
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {!guardian.fullName && (
            <TextField
              label="Guardian name (missing on this old record)"
              size="small"
              fullWidth
              sx={{ mt: 1.5 }}
              value={value.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
          )}
        </Paper>
      )}

      {/* ---------- New guardian ---------- */}
      {!guardian && phone.length >= 6 && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            New number — the first patient entered becomes the family guardian.
          </Alert>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Patient Name"
                size="small"
                fullWidth
                required
                value={value.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Age"
                type="number"
                size="small"
                fullWidth
                slotProps={{
                  htmlInput: { min: 0, max: 130, inputMode: "numeric" },
                }}
                value={value.age}
                onChange={(e) => patch({ age: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                select
                label="Gender"
                size="small"
                fullWidth
                value={value.gender}
                onChange={(e) => patch({ gender: e.target.value })}
              >
                {GENDERS.map((g) => (
                  <MenuItem key={g} value={g}>
                    {g}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField
                label="Patient Address"
                size="small"
                fullWidth
                multiline
                minRows={2}
                value={value.address}
                onChange={(e) => patch({ address: e.target.value })}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ---------- Who is the bill for ---------- */}
      {(guardian || phone.length >= 6) && (
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600 }}
          >
            This order is for
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.75 }}>
            <Chip
              label={guardian?.fullName || value.name.trim() || "Guardian"}
              color={subject.kind === "guardian" ? "primary" : "default"}
              variant={subject.kind === "guardian" ? "filled" : "outlined"}
              onClick={() => selectSubject({ kind: "guardian" })}
            />
            {guardian?.relatives.map((r) => (
              <Chip
                key={r.id}
                label={`${r.name}${r.relationship ? ` (${r.relationship})` : ""}`}
                color={
                  subject.kind === "relative" && subject.relativeId === r.id
                    ? "primary"
                    : "default"
                }
                variant={
                  subject.kind === "relative" && subject.relativeId === r.id
                    ? "filled"
                    : "outlined"
                }
                onClick={() =>
                  selectSubject({ kind: "relative", relativeId: r.id })
                }
              />
            ))}
            <Chip
              icon={<AddIcon />}
              label="Add patient"
              variant={subject.kind === "newRelative" ? "filled" : "outlined"}
              color={subject.kind === "newRelative" ? "secondary" : "default"}
              onClick={() =>
                selectSubject({
                  kind: "newRelative",
                  name: "",
                  age: "",
                  gender: "Male",
                  relationship: "",
                })
              }
            />
          </Box>

          <Collapse
            in={addingRelative && subject.kind === "newRelative"}
            unmountOnExit
          >
            {subject.kind === "newRelative" && (
              <Paper variant="outlined" sx={{ mt: 1.5, p: 2, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                  New family member
                  {(guardian?.fullName || value.name) &&
                    ` of ${guardian?.fullName || value.name}`}
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      freeSolo
                      options={[...RELATIONS]}
                      inputValue={subject.relationship}
                      onInputChange={(_, v) =>
                        onChange({
                          ...effective,
                          subject: { ...subject, relationship: v },
                        })
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          required
                          size="small"
                          label="Relation with guardian"
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Name"
                      size="small"
                      fullWidth
                      required
                      value={subject.name}
                      onChange={(e) =>
                        onChange({
                          ...effective,
                          subject: { ...subject, name: e.target.value },
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      label="Age"
                      type="number"
                      size="small"
                      fullWidth
                      slotProps={{
                        htmlInput: { min: 0, max: 130, inputMode: "numeric" },
                      }}
                      value={subject.age}
                      onChange={(e) =>
                        onChange({
                          ...effective,
                          subject: { ...subject, age: e.target.value },
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      select
                      label="Gender"
                      size="small"
                      fullWidth
                      value={subject.gender}
                      onChange={(e) =>
                        onChange({
                          ...effective,
                          subject: { ...subject, gender: e.target.value },
                        })
                      }
                    >
                      {GENDERS.map((g) => (
                        <MenuItem key={g} value={g}>
                          {g}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 1.5, textAlign: "right" }}>
                  <Button
                    size="small"
                    onClick={() => selectSubject({ kind: "guardian" })}
                  >
                    Cancel
                  </Button>
                </Box>
              </Paper>
            )}
          </Collapse>
        </Box>
      )}
    </Box>
  );
}
