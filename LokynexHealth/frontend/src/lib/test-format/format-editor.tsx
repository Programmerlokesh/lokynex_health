"use client";

import { Pill } from "@/components/report-builder/report-toolbar-ui";
import { cardSx, pillBtnSx } from "@/components/reports/report-shell";
import { useSaveTestFormat } from "@/hooks/use-test-formats";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  autoDisplay,
  draftFromFormat,
  InfoDraft,
  newKey,
  newParam,
  newRange,
  ParamDraft,
  RangeDraft,
  toRequest,
  validateDraft,
} from "@/lib/test-format/draft";
import { ResultType, TestFormatDto } from "@/types/test-format";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

const numberProps = { htmlInput: { inputMode: "decimal" as const } };

function RangeRow({
  r,
  index,
  onChange,
  onRemove,
}: {
  r: RangeDraft;
  index: number;
  onChange: (patch: Partial<RangeDraft>) => void;
  onRemove: () => void;
}) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
        p: 1.5,
        display: "grid",
        gap: 1.25,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: 12.5 }}>
          Range {index + 1}
        </Typography>
        <Button size="small" color="error" onClick={onRemove}>
          Remove range
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        <TextField
          select
          size="small"
          label="Applies to"
          value={r.gender}
          onChange={(e) =>
            onChange({ gender: e.target.value as RangeDraft["gender"] })
          }
        >
          <MenuItem value="">Everyone</MenuItem>
          <MenuItem value="Male">Male</MenuItem>
          <MenuItem value="Female">Female</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </TextField>
        <TextField
          size="small"
          label="Age from (yrs)"
          value={r.ageFrom}
          onChange={(e) => onChange({ ageFrom: e.target.value })}
          slotProps={numberProps}
        />
        <TextField
          size="small"
          label="Age to (yrs)"
          value={r.ageTo}
          onChange={(e) => onChange({ ageTo: e.target.value })}
          slotProps={numberProps}
        />
        <Box sx={{ display: { xs: "none", md: "block" } }} />

        <TextField
          size="small"
          label="Low"
          value={r.low}
          onChange={(e) => onChange({ low: e.target.value })}
          slotProps={numberProps}
        />
        <TextField
          size="small"
          label="High"
          value={r.high}
          onChange={(e) => onChange({ high: e.target.value })}
          slotProps={numberProps}
        />
        <TextField
          size="small"
          label="Critical low"
          value={r.critLow}
          onChange={(e) => onChange({ critLow: e.target.value })}
          slotProps={numberProps}
        />
        <TextField
          size="small"
          label="Critical high"
          value={r.critHigh}
          onChange={(e) => onChange({ critHigh: e.target.value })}
          slotProps={numberProps}
        />

        <TextField
          size="small"
          label="Normal text (e.g. Negative)"
          value={r.text}
          onChange={(e) => onChange({ text: e.target.value })}
          sx={{ gridColumn: { xs: "1 / -1", md: "span 2" } }}
        />
        <TextField
          size="small"
          label="Printed as (optional)"
          value={r.display}
          onChange={(e) => onChange({ display: e.target.value })}
          placeholder={autoDisplay(r) || "auto"}
          sx={{ gridColumn: { xs: "1 / -1", md: "span 2" } }}
        />
      </Box>
    </Box>
  );
}

export function FormatEditor({
  format,
  onBack,
  onDirtyChange,
}: {
  format: TestFormatDto;
  onBack?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const save = useSaveTestFormat(format.testId);

  const [initial] = useState(() => draftFromFormat(format));
  const [info, setInfo] = useState<InfoDraft>(initial.info);
  const [params, setParams] = useState<ParamDraft[]>(initial.params);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dirty = useMemo(
    () => JSON.stringify({ info, params }) !== JSON.stringify(initial),
    [info, params, initial],
  );

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const sections = useMemo(
    () =>
      Array.from(
        new Set(params.map((p) => p.sectionName.trim()).filter(Boolean)),
      ),
    [params],
  );

  const updateParam = (key: string, patch: Partial<ParamDraft>) =>
    setParams((ps) => ps.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const updateRange = (pk: string, rk: string, patch: Partial<RangeDraft>) =>
    setParams((ps) =>
      ps.map((p) =>
        p.key === pk
          ? {
              ...p,
              ranges: p.ranges.map((r) =>
                r.key === rk ? { ...r, ...patch } : r,
              ),
            }
          : p,
      ),
    );

  const addRange = (pk: string) =>
    setParams((ps) =>
      ps.map((p) =>
        p.key === pk ? { ...p, ranges: [...p.ranges, newRange()] } : p,
      ),
    );

  const removeRange = (pk: string, rk: string) =>
    setParams((ps) =>
      ps.map((p) =>
        p.key === pk
          ? { ...p, ranges: p.ranges.filter((r) => r.key !== rk) }
          : p,
      ),
    );

  function move(key: string, dir: -1 | 1) {
    setParams((ps) => {
      const i = ps.findIndex((p) => p.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ps.length) return ps;
      const next = ps.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function duplicate(key: string) {
    const copyKey = newKey();
    setParams((ps) => {
      const i = ps.findIndex((p) => p.key === key);
      if (i < 0) return ps;
      const src = ps[i];
      const copy: ParamDraft = {
        ...src,
        key: copyKey,
        id: null,
        name: `${src.name} (copy)`,
        ranges: src.ranges.map((r) => ({ ...r, key: newKey() })),
      };
      const next = ps.slice();
      next.splice(i + 1, 0, copy);
      return next;
    });
    setExpanded(copyKey);
  }

  function remove(key: string) {
    setParams((ps) => ps.filter((p) => p.key !== key));
    setExpanded((e) => (e === key ? null : e));
  }

  function add() {
    const p = newParam(
      params.length ? params[params.length - 1].sectionName : "",
    );
    setParams((ps) => [...ps, p]);
    setExpanded(p.key);
  }

  function discard() {
    setInfo(initial.info);
    setParams(initial.params);
    setErrors([]);
    setApiError(null);
  }

  async function handleSave() {
    setApiError(null);
    const errs = validateDraft(params);
    setErrors(errs);
    if (errs.length > 0) return;
    try {
      await save.mutateAsync(toRequest(info, params));
      setToast("Format saved.");
    } catch (e) {
      setApiError(getApiErrorMessage(e, "Could not save the format."));
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
      <Box sx={{ ...cardSx, p: { xs: 2, sm: 2.5 }, display: "grid", gap: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {onBack && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={onBack}
              sx={pillBtnSx}
            >
              ← Tests
            </Button>
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{ fontWeight: 800, fontSize: 18, wordBreak: "break-word" }}
            >
              {format.testName}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              {format.departmentName}
            </Typography>
          </Box>
          <Pill tone={params.length ? "success" : "warning"}>
            {params.length} parameter{params.length === 1 ? "" : "s"}
          </Pill>
          {dirty && <Pill tone="warning">Unsaved changes</Pill>}
        </Box>

        <Typography sx={{ fontWeight: 800, fontSize: 14, mt: 0.5 }}>
          Default details (printed on every report of this test)
        </Typography>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          <TextField
            size="small"
            label="Specimen"
            value={info.specimen}
            onChange={(e) => setInfo({ ...info, specimen: e.target.value })}
          />
          <TextField
            size="small"
            label="Method"
            value={info.method}
            onChange={(e) => setInfo({ ...info, method: e.target.value })}
          />
          <TextField
            size="small"
            label="Analyser / Machine name"
            value={info.machine}
            onChange={(e) => setInfo({ ...info, machine: e.target.value })}
          />
          <TextField
            size="small"
            label="Reagent / Chemical name"
            value={info.reagent}
            onChange={(e) => setInfo({ ...info, reagent: e.target.value })}
          />
          <TextField
            size="small"
            multiline
            minRows={2}
            label="Default remarks / interpretation"
            value={info.interpretation}
            onChange={(e) =>
              setInfo({ ...info, interpretation: e.target.value })
            }
            sx={{ gridColumn: { sm: "1 / -1" } }}
          />
        </Box>
      </Box>

      {apiError && (
        <Alert severity="error" onClose={() => setApiError(null)}>
          {apiError}
        </Alert>
      )}
      {errors.length > 0 && (
        <Alert severity="error" onClose={() => setErrors([])}>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {errors.slice(0, 8).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
            {errors.length > 8 && <li>…and {errors.length - 8} more</li>}
          </Box>
        </Alert>
      )}

      <Box sx={{ ...cardSx, overflow: "hidden" }}>
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 15 }}>
            Parameters (report order)
          </Typography>
          <Button size="small" variant="contained" onClick={add} sx={pillBtnSx}>
            + Add parameter
          </Button>
        </Box>

        {params.length === 0 && (
          <Typography
            sx={{ px: 2, pb: 2, fontSize: 13, color: "text.secondary" }}
          >
            No parameters yet. Add the first one (for example “Haemoglobin”,
            unit g/dL, range 13 - 17).
          </Typography>
        )}

        {params.map((p, i) => {
          const refs = p.ranges
            .map((r) => r.display.trim() || autoDisplay(r))
            .filter(Boolean);
          return (
            <Accordion
              key={p.key}
              disableGutters
              square
              expanded={expanded === p.key}
              onChange={(_, isOpen) => setExpanded(isOpen ? p.key : null)}
              sx={{
                boxShadow: "none",
                borderTop: 1,
                borderColor: "divider",
                "&:before": { display: "none" },
                bgcolor: "transparent",
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
                <Box sx={{ minWidth: 0, display: "grid", gap: 0.25 }}>
                  <Typography
                    sx={{
                      fontWeight: p.isBold ? 800 : 700,
                      fontSize: 14,
                      wordBreak: "break-word",
                    }}
                  >
                    {i + 1}. {p.name.trim() || "New parameter"}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 11.5,
                      color: "text.secondary",
                      wordBreak: "break-word",
                    }}
                  >
                    {[
                      p.sectionName.trim() || null,
                      p.unit.trim() || null,
                      refs.length ? refs.join(" | ") : "no range",
                    ]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails
                sx={{
                  px: { xs: 1.5, sm: 2 },
                  pb: 2,
                  display: "grid",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gap: 1.25,
                    gridTemplateColumns: {
                      xs: "repeat(2, minmax(0, 1fr))",
                      md: "repeat(4, minmax(0, 1fr))",
                    },
                  }}
                >
                  <TextField
                    size="small"
                    label="Parameter name"
                    value={p.name}
                    onChange={(e) =>
                      updateParam(p.key, { name: e.target.value })
                    }
                    sx={{ gridColumn: { xs: "1 / -1", md: "span 2" } }}
                  />
                  <Autocomplete
                    freeSolo
                    size="small"
                    options={sections}
                    inputValue={p.sectionName}
                    onInputChange={(_, v) =>
                      updateParam(p.key, { sectionName: v })
                    }
                    renderInput={(ip) => (
                      <TextField {...ip} label="Section (group heading)" />
                    )}
                    sx={{ gridColumn: { xs: "1 / -1", md: "span 2" } }}
                  />
                  <TextField
                    size="small"
                    label="Unit"
                    value={p.unit}
                    onChange={(e) =>
                      updateParam(p.key, { unit: e.target.value })
                    }
                  />
                  <TextField
                    select
                    size="small"
                    label="Result type"
                    value={p.resultType}
                    onChange={(e) =>
                      updateParam(p.key, {
                        resultType: e.target.value as ResultType,
                      })
                    }
                  >
                    <MenuItem value="Auto">Auto</MenuItem>
                    <MenuItem value="Numeric">Numeric</MenuItem>
                    <MenuItem value="Text">Text</MenuItem>
                  </TextField>
                  <FormControlLabel
                    sx={{ gridColumn: { xs: "1 / -1", md: "span 2" } }}
                    control={
                      <Checkbox
                        checked={p.isBold}
                        onChange={(e) =>
                          updateParam(p.key, { isBold: e.target.checked })
                        }
                      />
                    }
                    label="Print name in bold"
                  />
                </Box>

                <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
                  Normal / reference ranges
                </Typography>
                {p.ranges.map((r, j) => (
                  <RangeRow
                    key={r.key}
                    r={r}
                    index={j}
                    onChange={(patch) => updateRange(p.key, r.key, patch)}
                    onRemove={() => removeRange(p.key, r.key)}
                  />
                ))}
                <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                  “&lt;200” → fill only High. “&gt;40” → fill only Low. Text
                  results (Negative, Nil) → use Normal text. Age “to 12”
                  includes 12-year-olds, so start the next range at 13.
                </Typography>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => addRange(p.key)}
                    sx={pillBtnSx}
                  >
                    + Add range (e.g. Female)
                  </Button>
                  <Box sx={{ flex: 1 }} />
                  <IconButton
                    size="small"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={() => move(p.key, -1)}
                  >
                    ↑
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label="Move down"
                    disabled={i === params.length - 1}
                    onClick={() => move(p.key, 1)}
                  >
                    ↓
                  </IconButton>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => duplicate(p.key)}
                    sx={pillBtnSx}
                  >
                    Duplicate
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => remove(p.key)}
                    sx={pillBtnSx}
                  >
                    Delete
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>

      <Box
        sx={{
          ...cardSx,
          position: "sticky",
          bottom: { xs: 8, md: 12 },
          zIndex: 5,
          p: 1.5,
          display: "flex",
          gap: 1,
          justifyContent: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          disabled={!dirty || save.isPending}
          onClick={discard}
          sx={pillBtnSx}
        >
          Discard changes
        </Button>
        <Button
          variant="contained"
          disabled={!dirty || save.isPending}
          onClick={() => void handleSave()}
          sx={pillBtnSx}
        >
          {save.isPending ? "Saving..." : "Save format"}
        </Button>
      </Box>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        message={toast ?? ""}
      />
    </Box>
  );
}
