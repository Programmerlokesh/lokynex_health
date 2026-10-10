"use client";

import { useSaveLabReportSettings } from "@/hooks/use-blood-reports";
import { getApiErrorMessage } from "@/lib/api-error";
import { fileToDataUrl } from "@/lib/blood-report/images";
import { sanitizeHtml } from "@/lib/report-editor/sanitize";
import { LabReportSettingsDto } from "@/types/blood-report";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ChangeEvent, useState } from "react";

const hasImage = (html: string | null) =>
  !!html && /<img[^>]+src=["']data:image/i.test(html);

const imgHtml = (dataUrl: string) =>
  `<img src="${dataUrl}" alt="" style="width:100%;display:block"/>`;

function ImagePicker({
  label,
  html,
  onChange,
  setError,
}: {
  label: string;
  html: string;
  onChange: (v: string) => void;
  setError: (m: string | null) => void;
}) {
  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError(null);
    try {
      const url = await fileToDataUrl(f, {
        maxWidth: 1400,
        mime: "image/jpeg",
        quality: 0.88,
      });
      onChange(imgHtml(url));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not use this image.",
      );
    }
  }

  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{label}</Typography>

      {hasImage(html) ? (
        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            p: 1,
            bgcolor: "#fff",
          }}
        >
          <Box
            sx={{ maxHeight: 140, overflow: "hidden" }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
          />
        </Box>
      ) : (
        <TextField
          multiline
          minRows={3}
          size="small"
          value={html}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`<div style="text-align:center"><h2>{{branch_name}}</h2><p>{{branch_address}}</p></div>`}
          helperText="You can use {{branch_name}}, {{branch_address}}, {{branch_phone}}. Or upload your ready-made header image."
        />
      )}

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button
          component="label"
          variant="outlined"
          size="small"
          sx={{ borderRadius: "999px" }}
        >
          Upload image
          <input
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => void pick(e)}
          />
        </Button>
        {html && (
          <Button
            size="small"
            color="error"
            onClick={() => onChange("")}
            sx={{ borderRadius: "999px" }}
          >
            Remove
          </Button>
        )}
      </Box>
    </Box>
  );
}

export function LetterheadSettingsDialog({
  settings,
  onClose,
  onSaved,
}: {
  settings: LabReportSettingsDto;
  onClose: () => void;
  onSaved: (s: LabReportSettingsDto) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const save = useSaveLabReportSettings();

  const [draft, setDraft] = useState<LabReportSettingsDto>(settings);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof LabReportSettingsDto>(
    k: K,
    v: LabReportSettingsDto[K],
  ) => setDraft((d) => ({ ...d, [k]: v }));

  const mm = (v: string) =>
    Math.min(100, Math.max(0, Math.round(Number(v) || 0)));

  async function pickSignature(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError(null);
    try {
      set(
        "signatureImage",
        await fileToDataUrl(f, { maxWidth: 400, mime: "image/png" }),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not use this image.",
      );
    }
  }

  async function handleSave() {
    setError(null);
    try {
      await save.mutateAsync(draft);
      onSaved(draft);
      onClose();
    } catch (e) {
      setError(
        getApiErrorMessage(e, "Could not save the letterhead settings."),
      );
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        Lab header, footer &amp; signature
      </DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2.5, pt: 1 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <FormControlLabel
          sx={{ mt: 1 }}
          control={
            <Switch
              checked={draft.useLetterhead}
              onChange={(e) => set("useLetterhead", e.target.checked)}
            />
          }
          label="Print my lab header & footer by default"
        />

        <ImagePicker
          label="Header (top of every page)"
          html={draft.headerHtml ?? ""}
          onChange={(v) => set("headerHtml", v)}
          setError={setError}
        />
        <ImagePicker
          label="Footer (bottom of every page)"
          html={draft.footerHtml ?? ""}
          onChange={(v) => set("footerHtml", v)}
          setError={setError}
        />

        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 1 }}>
            Blank space (for pre-printed letterhead paper)
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            }}
          >
            <TextField
              size="small"
              type="number"
              label="Top space (mm)"
              value={draft.headerSpaceMm}
              onChange={(e) => set("headerSpaceMm", mm(e.target.value))}
              slotProps={{ htmlInput: { min: 0, max: 100 } }}
            />
            <TextField
              size="small"
              type="number"
              label="Bottom space (mm)"
              value={draft.footerSpaceMm}
              onChange={(e) => set("footerSpaceMm", mm(e.target.value))}
              slotProps={{ htmlInput: { min: 0, max: 100 } }}
            />
          </Box>
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 1 }}>
            Pathologist / signature (printed at the end of the report)
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            }}
          >
            <TextField
              size="small"
              label="Name"
              value={draft.pathologistName ?? ""}
              onChange={(e) => set("pathologistName", e.target.value)}
            />
            <TextField
              size="small"
              label="Qualification"
              value={draft.pathologistQualification ?? ""}
              onChange={(e) => set("pathologistQualification", e.target.value)}
            />
            <TextField
              size="small"
              label="Registration No"
              value={draft.registrationNo ?? ""}
              onChange={(e) => set("registrationNo", e.target.value)}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              mt: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Button
              component="label"
              variant="outlined"
              size="small"
              sx={{ borderRadius: "999px" }}
            >
              Upload signature
              <input
                hidden
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => void pickSignature(e)}
              />
            </Button>
            {draft.signatureImage && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={draft.signatureImage}
                  alt="signature"
                  style={{
                    height: 40,
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                  }}
                />
                <Button
                  size="small"
                  color="error"
                  onClick={() => set("signatureImage", null)}
                >
                  Remove
                </Button>
              </>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={save.isPending}
          onClick={() => void handleSave()}
          sx={{ borderRadius: "999px", fontWeight: 800 }}
        >
          {save.isPending ? "Saving..." : "Save for my lab"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
