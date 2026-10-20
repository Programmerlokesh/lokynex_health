"use client";

import { ReportPadPreview } from "@/components/report-pad/report-pad-preview";
import { cardSx, pillBtnSx } from "@/components/reports/report-shell";
import { useSaveLabReportSettings } from "@/hooks/use-blood-reports";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  buildPrintDocument,
  buildReportParts,
  type ReportMeta,
  type ReportRow,
} from "@/lib/blood-report/build-report";
import { fileToDataUrl } from "@/lib/blood-report/images";
import { makeReportQrDataUrl } from "@/lib/blood-report/qr";
import { printHtml } from "@/lib/order-report";
import { sanitizeHtml } from "@/lib/report-editor/sanitize";
import { useAuthStore } from "@/store/auth-store";
import type {
  BloodReportFormDto,
  LabReportSettingsDto,
} from "@/types/blood-report";
import {
  Alert,
  Box,
  Button,
  Slider,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/* sample data, so the owner can judge the pad before a real report    */
/* ------------------------------------------------------------------ */

const SAMPLE_ROWS: ReportRow[] = [
  {
    section: "Complete Blood Count",
    name: "Haemoglobin",
    value: "13.8",
    unit: "g/dL",
    reference: "13.0 - 17.0",
    flag: "Normal",
    bold: false,
  },
  {
    section: "Complete Blood Count",
    name: "Total WBC Count",
    value: "11800",
    unit: "/cumm",
    reference: "4000 - 11000",
    flag: "High",
    bold: false,
  },
  {
    section: "Complete Blood Count",
    name: "RBC Count",
    value: "4.9",
    unit: "million/cumm",
    reference: "4.5 - 5.5",
    flag: "Normal",
    bold: false,
  },
  {
    section: "Complete Blood Count",
    name: "Platelet Count",
    value: "2.4",
    unit: "lakh/cumm",
    reference: "1.5 - 4.1",
    flag: "Normal",
    bold: false,
  },
  {
    section: "Differential Count",
    name: "Neutrophils",
    value: "62",
    unit: "%",
    reference: "40 - 70",
    flag: "Normal",
    bold: false,
  },
  {
    section: "Differential Count",
    name: "Lymphocytes",
    value: "30",
    unit: "%",
    reference: "20 - 40",
    flag: "Normal",
    bold: false,
  },
];

const SAMPLE_TOKEN = "0123456789abcdef0123456789abcdef";

function makeSample(labName: string | null | undefined) {
  const now = new Date().toISOString();
  const form: BloodReportFormDto = {
    orderId: "sample",
    orderItemId: "sample",
    testId: "sample",
    orderNumber: "ORD-0001",
    orderCreatedAt: now,
    testName: "Complete Blood Count (CBC)",
    departmentName: "Haematology",
    patientName: "Sample Patient",
    patientCode: "PT-0001",
    patientPhone: "9876543210",
    whatsappNumber: "9876543210",
    patientAge: 42,
    patientGender: "Male",
    doctorName: "Dr. A. Sharma",
    referralName: null,
    branchName: labName || "Your Lab Name",
    branchAddress: "123 Main Road, Kolkata - 700001",
    branchPhone: "98765 43210",
    reportDocumentId: null,
    publicToken: null,
    hasFormat: true,
    sampleId: "S-1001",
    specimen: "Whole blood (EDTA)",
    method: "Automated analyser",
    machineName: null,
    reagentName: null,
    remarks: null,
    sampleCollectedAt: now,
    reportedAt: now,
    parameters: [],
    settings: {
      useLetterhead: true,
      headerHtml: null,
      footerHtml: null,
      headerSpaceMm: 40,
      footerSpaceMm: 30,
      pathologistName: null,
      pathologistQualification: null,
      registrationNo: null,
      signatureImage: null,
    },
  };
  const meta: ReportMeta = {
    sampleId: "S-1001",
    specimen: "Whole blood (EDTA)",
    method: "Automated analyser",
    machine: "",
    reagent: "",
    remarks: "",
    collectedAt: now,
    reportedAt: now,
  };
  return { form, meta };
}

/* ------------------------------------------------------------------ */
/* small pieces                                                        */
/* ------------------------------------------------------------------ */

const clampMm = (v: number) => Math.min(100, Math.max(0, Math.round(v || 0)));

const hasImage = (html: string | null) =>
  !!html && /<img[^>]+src=["']data:image/i.test(html);

const imgHtml = (dataUrl: string) =>
  `<img src="${dataUrl}" alt="" style="width:100%;display:block"/>`;

const panelSx = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 3,
  p: 1.5,
  display: "grid",
  gap: 1.25,
} as const;

function BandPicker({
  label,
  html,
  onChange,
  onError,
}: {
  label: string;
  html: string;
  onChange: (v: string) => void;
  onError: (m: string) => void;
}) {
  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const url = await fileToDataUrl(f, {
        maxWidth: 1400,
        mime: "image/jpeg",
        quality: 0.88,
      });
      onChange(imgHtml(url));
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not use this image.");
    }
  }

  return (
    <Box sx={panelSx}>
      <Typography sx={{ fontWeight: 800 }}>{label}</Typography>

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
            sx={{ maxHeight: 120, overflow: "hidden" }}
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
          helperText="Write simple HTML (you can use {{branch_name}}, {{branch_address}}, {{branch_phone}}) or upload your ready-made image."
        />
      )}

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button
          component="label"
          variant="outlined"
          size="small"
          sx={{ borderRadius: "999px" }}
        >
          {hasImage(html) ? "Replace image" : "Upload image"}
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
      <Typography variant="caption" color="text.secondary">
        Use a wide, short image (JPG / PNG / WEBP). It is stretched to the full
        page width on every page.
      </Typography>
    </Box>
  );
}

function MmControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <Box sx={panelSx}>
      <Typography sx={{ fontWeight: 800 }}>{label}</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, pr: 1 }}>
        <Slider
          size="small"
          min={0}
          max={100}
          value={value}
          onChange={(_, v) => onChange(clampMm(v as number))}
        />
        <TextField
          size="small"
          type="number"
          value={value}
          onChange={(e) => onChange(clampMm(Number(e.target.value)))}
          slotProps={{
            htmlInput: { min: 0, max: 100 },
            input: { endAdornment: <span>mm</span> },
          }}
          sx={{ width: 120, flexShrink: 0 }}
        />
      </Box>
    </Box>
  );
}

const MODES: { value: boolean; title: string; text: string }[] = [
  {
    value: true,
    title: "Print my lab header & footer",
    text: "Your header and footer image / text is printed on every page.",
  },
  {
    value: false,
    title: "I use a pre-printed pad",
    text: "Leave blank space at the top and bottom so the report lands on your own printed paper.",
  },
];

/* ------------------------------------------------------------------ */
/* main editor                                                         */
/* ------------------------------------------------------------------ */

export function ReportPadEditor({
  initial,
}: {
  initial: LabReportSettingsDto;
}) {
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down("lg"));
  const labName = useAuthStore((s) => s.user?.labName);
  const save = useSaveLabReportSettings();

  const [draft, setDraft] = useState<LabReportSettingsDto>(initial);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [qr, setQr] = useState<string | null>(null);

  const set = <K extends keyof LabReportSettingsDto>(
    k: K,
    v: LabReportSettingsDto[K],
  ) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setDirty(true);
  };

  // sample QR (so the preview shows where it sits)
  useEffect(() => {
    let alive = true;
    makeReportQrDataUrl(SAMPLE_TOKEN)
      .then((u) => alive && setQr(u))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  // warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const sample = useMemo(() => makeSample(labName), [labName]);

  const parts = useMemo(
    () =>
      buildReportParts({
        form: sample.form,
        rows: SAMPLE_ROWS,
        meta: sample.meta,
        settings: draft,
        useLetterhead: draft.useLetterhead,
        blankHeaderMm: draft.headerSpaceMm,
        blankFooterMm: draft.footerSpaceMm,
        labName,
        qrDataUrl: qr,
      }),
    [sample, draft, labName, qr],
  );

  async function pickSignature(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
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
      setDirty(false);
      setToast("Report pad saved.");
    } catch (e) {
      setError(getApiErrorMessage(e, "Could not save the report pad."));
    }
  }

  function handlePrint() {
    printHtml(
      buildPrintDocument("Report pad sample", {
        headerHtml: parts.headerHtml,
        bodyHtml: parts.bodyHtml,
        footerHtml: parts.footerHtml,
      }),
    );
  }

  const controls = (
    <Box sx={{ display: "grid", gap: 1.5, minWidth: 0 }}>
      <Box sx={{ display: "grid", gap: 1 }}>
        {MODES.map((m) => {
          const on = draft.useLetterhead === m.value;
          return (
            <Box
              key={String(m.value)}
              component="button"
              type="button"
              onClick={() => set("useLetterhead", m.value)}
              sx={{
                textAlign: "left",
                p: 1.5,
                borderRadius: 3,
                cursor: "pointer",
                bgcolor: "background.paper",
                color: "text.primary",
                font: "inherit",
                border: "2px solid",
                borderColor: on ? "primary.main" : "divider",
              }}
            >
              <Typography sx={{ fontWeight: 800 }}>{m.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {m.text}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {draft.useLetterhead ? (
        <>
          <BandPicker
            label="Header (top of every page)"
            html={draft.headerHtml ?? ""}
            onChange={(v) => set("headerHtml", v)}
            onError={setError}
          />
          <BandPicker
            label="Footer (bottom of every page)"
            html={draft.footerHtml ?? ""}
            onChange={(v) => set("footerHtml", v)}
            onError={setError}
          />
        </>
      ) : (
        <>
          <Alert severity="info" sx={{ py: 0.25 }}>
            Nothing is printed in these areas. Measure the printed header and
            footer of your pad with a ruler and set the same height here.
          </Alert>
          <MmControl
            label="Top space (header)"
            value={draft.headerSpaceMm}
            onChange={(n) => set("headerSpaceMm", n)}
          />
          <MmControl
            label="Bottom space (footer)"
            value={draft.footerSpaceMm}
            onChange={(n) => set("footerSpaceMm", n)}
          />
        </>
      )}

      <Box sx={panelSx}>
        <Typography sx={{ fontWeight: 800 }}>
          Pathologist / signature (end of the report)
        </Typography>
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
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            component="label"
            variant="outlined"
            size="small"
            sx={{ borderRadius: "999px" }}
          >
            {draft.signatureImage ? "Replace signature" : "Upload signature"}
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
    </Box>
  );

  const preview = (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 700, display: "block", mb: 0.75 }}
      >
        LIVE PREVIEW · sample data
      </Typography>
      <ReportPadPreview
        mode={draft.useLetterhead ? "letterhead" : "blank"}
        headerHtml={parts.headerHtml}
        bodyHtml={parts.bodyHtml}
        footerHtml={parts.footerHtml}
        headerMm={draft.headerSpaceMm}
        footerMm={draft.footerSpaceMm}
        hasHeader={!!draft.headerHtml?.trim()}
        hasFooter={!!draft.footerHtml?.trim()}
      />
    </Box>
  );

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isNarrow && (
        <Tabs
          value={tab}
          onChange={(_, v: "edit" | "preview") => setTab(v)}
          variant="fullWidth"
          sx={{ ...cardSx, minHeight: 44 }}
        >
          <Tab value="edit" label="Edit" />
          <Tab value="preview" label="Preview" />
        </Tabs>
      )}

      {isNarrow ? (
        <Box sx={{ ...cardSx, p: { xs: 1.5, sm: 2 } }}>
          {tab === "edit" ? controls : preview}
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: "minmax(0,420px) minmax(0,1fr)",
            alignItems: "start",
          }}
        >
          <Box sx={{ ...cardSx, p: 2 }}>{controls}</Box>
          <Box sx={{ ...cardSx, p: 2, position: "sticky", top: 12 }}>
            {preview}
          </Box>
        </Box>
      )}

      {/* sticky actions */}
      <Box
        sx={{
          ...cardSx,
          position: "sticky",
          bottom: { xs: 8, md: 12 },
          zIndex: 5,
          p: 1.5,
          display: "grid",
          gap: 1,
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(2, auto)" },
          justifyContent: { sm: "end" },
          alignItems: "center",
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          onClick={handlePrint}
          sx={pillBtnSx}
        >
          Print sample
        </Button>
        <Button
          variant="contained"
          disabled={save.isPending || !dirty}
          onClick={() => void handleSave()}
          sx={pillBtnSx}
        >
          {save.isPending ? "Saving..." : dirty ? "Save report pad" : "Saved"}
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
