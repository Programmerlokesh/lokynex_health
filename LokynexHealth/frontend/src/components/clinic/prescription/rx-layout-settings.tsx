"use client";

import { PrescriptionPreview } from "@/components/clinic/prescription/prescription-preview";
import { buildRxParts } from "@/lib/clinic/prescription-html";
import {
  MM_LIMITS,
  type RxBandMode,
  type RxCustom,
  type RxLayout,
  type RxLayoutMode,
  type RxLetterhead,
} from "@/lib/clinic/rx-layout";
import { fileToBannerDataUrl } from "@/lib/image-utils";
import type { ClinicMe, Prescription } from "@/types/clinic";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Slider,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useMemo, useRef } from "react";

// Sample data so the doctor can judge the layout before printing a real one.
const SAMPLE_RX: Prescription = {
  id: "sample",
  rxNo: "RX-0001",
  visitDate: new Date().toISOString().slice(0, 10),
  doctorName: "Dr. A. Sharma",
  doctorQualification: "MBBS, MD (Medicine)",
  doctorSpecialization: "General Physician",
  doctorRegNo: "WB-12345",
  patientName: "Sample Patient",
  patientAge: 42,
  patientGender: "Male",
  patientPhone: "9876543210",
  patientAddress: "Kolkata",
  patientPincode: "700001",
  chiefComplaints: "Fever and body ache for 3 days.",
  diagnosis: "Viral fever",
  bp: "120/80",
  pulse: "78",
  temperature: "99.4",
  weight: "68",
  spo2: "98",
  generalAdvice: "Drink plenty of fluids. Take rest.",
  followUpDate: null,
  followUpNote: "Review if fever persists beyond 3 days",
  items: [
    {
      name: "Paracetamol 650",
      form: "Tab",
      composition: "Paracetamol 650 mg",
      dosage: "1-0-1",
      duration: "3 days",
      instructions: "After food",
    },
    {
      name: "ORS Sachet",
      form: "Sachet",
      dosage: "As needed",
      duration: "3 days",
      instructions: "Mix in 1 L water",
    },
  ],
  tests: [{ name: "CBC", note: "If fever continues" }],
  createdAt: new Date().toISOString(),
};

const MODES: { value: RxLayoutMode; title: string; text: string }[] = [
  {
    value: "default",
    title: "Default",
    text: "Clinic header and footer printed from your clinic details.",
  },
  {
    value: "letterhead",
    title: "My own prescription pad",
    text: "Upload your pad’s header / footer, or leave blank space for a pre-printed pad.",
  },
  {
    value: "custom",
    title: "Fully custom",
    text: "Choose exactly which blocks to print, the header style, text size and colour.",
  },
];

const mmOf = (v: number) =>
  Math.min(MM_LIMITS.max, Math.max(MM_LIMITS.min, Math.round(v || 0)));

interface Props {
  layout: RxLayout;
  onChange: (l: RxLayout) => void;
  /** Clinic profile as currently edited on the page (so the preview shows unsaved changes). */
  clinic: ClinicMe;
  disabled: boolean;
  saving: boolean;
  onSave: () => void;
  onError: (msg: string) => void;
}

export function RxLayoutSettings({
  layout,
  onChange,
  clinic,
  disabled,
  saving,
  onSave,
  onError,
}: Props) {
  const parts = useMemo(
    () => buildRxParts(SAMPLE_RX, clinic, layout),
    [clinic, layout],
  );

  const setLH = (patch: Partial<RxLetterhead>) =>
    onChange({ ...layout, letterhead: { ...layout.letterhead, ...patch } });
  const setCU = (patch: Partial<RxCustom>) =>
    onChange({ ...layout, custom: { ...layout.custom, ...patch } });

  const headerFile = useRef<HTMLInputElement>(null);
  const footerFile = useRef<HTMLInputElement>(null);

  const pick = async (which: "header" | "footer", file?: File) => {
    if (!file) return;
    try {
      const url = await fileToBannerDataUrl(file);
      if (which === "header") setLH({ headerImage: url, headerMode: "image" });
      else setLH({ footerImage: url, footerMode: "image" });
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not use this image.");
    }
  };

  const band = (which: "header" | "footer") => {
    const lh = layout.letterhead;
    const isH = which === "header";
    const mode: RxBandMode = isH ? lh.headerMode : lh.footerMode;
    const image = isH ? lh.headerImage : lh.footerImage;
    const mm = isH ? lh.headerMm : lh.footerMm;
    const ref = isH ? headerFile : footerFile;
    const setMode = (m: RxBandMode) =>
      setLH(isH ? { headerMode: m } : { footerMode: m });
    const setMm = (n: number) =>
      setLH(isH ? { headerMm: mmOf(n) } : { footerMm: mmOf(n) });

    return (
      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          p: 1.5,
          display: "grid",
          gap: 1.25,
        }}
      >
        <Typography sx={{ fontWeight: 800 }}>
          {isH ? "Header" : "Footer"}
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          disabled={disabled}
          onChange={(_, v: RxBandMode | null) => v && setMode(v)}
        >
          <ToggleButton value="image">Upload image</ToggleButton>
          <ToggleButton value="space">Leave blank space</ToggleButton>
        </ToggleButtonGroup>

        {mode === "image" ? (
          <Box sx={{ display: "grid", gap: 1 }}>
            <input
              ref={ref}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => {
                pick(which, e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={`${which} preview`}
                style={{
                  width: "100%",
                  maxHeight: 120,
                  objectFit: "contain",
                  border: "1px solid #e0e5ea",
                  borderRadius: 8,
                  background: "#fff",
                }}
              />
            )}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                size="small"
                variant="outlined"
                disabled={disabled}
                onClick={() => ref.current?.click()}
              >
                {image ? "Replace image" : `Upload ${which} image`}
              </Button>
              {image && (
                <Button
                  size="small"
                  color="error"
                  disabled={disabled}
                  onClick={() =>
                    setLH(isH ? { headerImage: "" } : { footerImage: "" })
                  }
                >
                  Remove
                </Button>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Use a wide, short image (JPG / PNG / WEBP). It is stretched to the
              full page width on every page.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "grid", gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Nothing is printed in this area, so it lands on your pre-printed
              pad. Measure the printed {which} on your pad with a ruler.
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, pr: 1 }}>
              <Slider
                size="small"
                min={MM_LIMITS.min}
                max={MM_LIMITS.max}
                value={mm}
                disabled={disabled}
                onChange={(_, v) => setMm(v as number)}
              />
              <TextField
                size="small"
                type="number"
                value={mm}
                disabled={disabled}
                onChange={(e) => setMm(Number(e.target.value))}
                slotProps={{
                  htmlInput: { min: MM_LIMITS.min, max: MM_LIMITS.max },
                  input: { endAdornment: <span>mm</span> },
                }}
                sx={{ width: 110, flexShrink: 0 }}
              />
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const sw = (k: keyof RxCustom, label: string) => (
    <FormControlLabel
      key={k}
      control={
        <Switch
          size="small"
          checked={layout.custom[k] as boolean}
          disabled={disabled}
          onChange={(e) =>
            setCU({ [k]: e.target.checked } as Partial<RxCustom>)
          }
        />
      }
      label={label}
    />
  );

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0,400px) minmax(0,1fr)" },
        alignItems: "start",
      }}
    >
      {/* ------------ controls ------------ */}
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <Box sx={{ display: "grid", gap: 1 }}>
          {MODES.map((m) => {
            const on = layout.mode === m.value;
            return (
              <Box
                key={m.value}
                component="button"
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...layout, mode: m.value })}
                sx={{
                  textAlign: "left",
                  p: 1.5,
                  borderRadius: 3,
                  cursor: disabled ? "default" : "pointer",
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

        {layout.mode === "letterhead" && (
          <>
            {band("header")}
            {band("footer")}
            <Alert severity="info" sx={{ py: 0.25 }}>
              Doctor details are expected on your pad, so only the patient and
              medicine details are printed between the header and footer.
            </Alert>
          </>
        )}

        {layout.mode === "custom" && (
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              p: 1.5,
              display: "grid",
              gap: 1.25,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              HEADER STYLE
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={layout.custom.headerStyle}
              disabled={disabled}
              onChange={(_, v: RxCustom["headerStyle"] | null) =>
                v && setCU({ headerStyle: v })
              }
            >
              <ToggleButton value="split">
                Clinic left · Doctor right
              </ToggleButton>
              <ToggleButton value="centered">Centered</ToggleButton>
            </ToggleButtonGroup>

            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              TEXT SIZE
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={layout.custom.fontSize}
              disabled={disabled}
              onChange={(_, v: RxCustom["fontSize"] | null) =>
                v && setCU({ fontSize: v })
              }
            >
              <ToggleButton value="small">Small</ToggleButton>
              <ToggleButton value="normal">Normal</ToggleButton>
              <ToggleButton value="large">Large</ToggleButton>
            </ToggleButtonGroup>

            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              SHOW ON PRESCRIPTION
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              {sw("showLogo", "Clinic logo")}
              {sw("showTagline", "Tagline")}
              {sw("showClinicContact", "Address & contact")}
              {sw("showDoctorBlock", "Doctor details")}
              {sw("showVitals", "Vitals")}
              {sw("showSignature", "Signature box")}
              {sw("showFooterNote", "Footer note")}
              {sw("showFooterBar", "Footer info bar")}
            </Box>

            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              COLOUR
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <input
                type="color"
                value={layout.custom.accent || clinic.accentColor}
                disabled={disabled}
                onChange={(e) => setCU({ accent: e.target.value })}
                style={{ width: 44, height: 32, border: 0, background: "none" }}
                aria-label="Prescription colour"
              />
              <Typography variant="caption" color="text.secondary">
                {layout.custom.accent
                  ? "Custom colour"
                  : "Using the clinic colour"}
              </Typography>
              {layout.custom.accent && (
                <Button
                  size="small"
                  disabled={disabled}
                  onClick={() => setCU({ accent: "" })}
                >
                  Use clinic colour
                </Button>
              )}
            </Box>
          </Box>
        )}

        {!disabled && (
          <Box>
            <Button variant="contained" disabled={saving} onClick={onSave}>
              Save layout
            </Button>
          </Box>
        )}
      </Box>

      {/* ------------ live preview ------------ */}
      <Box sx={{ position: { lg: "sticky" }, top: { lg: 12 } }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 700, display: "block", mb: 0.75 }}
        >
          LIVE PREVIEW · sample data
        </Typography>
        <PrescriptionPreview parts={parts} />
      </Box>
    </Box>
  );
}
