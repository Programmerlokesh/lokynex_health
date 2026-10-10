"use client";

import { LetterheadSettingsDialog } from "@/components/blood-report/letterhead-settings-dialog";
import { WhatsAppDialog } from "@/components/blood-report/whatsapp-dialog";
import { Pill } from "@/components/report-builder/report-toolbar-ui";
import {
  cardSx,
  HeaderCard,
  pillBtnSx,
} from "@/components/reports/report-shell";
import {
  useBloodReportForm,
  useLogReportDelivery,
  useSaveBloodReport,
} from "@/hooks/use-blood-reports";
import { useOrderForReport } from "@/hooks/use-report-builder";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  buildPrintDocument,
  buildReportParts,
  reportFileName,
  ReportRow,
} from "@/lib/blood-report/build-report";
import { resolveFlag } from "@/lib/blood-report/flags";
import { buildReportPdf } from "@/lib/blood-report/pdf";
import { downloadBlob } from "@/lib/blood-report/share";
import { printHtml } from "@/lib/order-report";
import { useAuthStore } from "@/store/auth-store";
import {
  BloodParameterDto,
  BloodReportFormDto,
  ResultFlag,
} from "@/types/blood-report";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import axios from "axios";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  KeyboardEvent,
  memo,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react";

// ───────────────────────── helpers ─────────────────────────
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function errMsg(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) return getApiErrorMessage(e, fallback);
  return e instanceof Error ? e.message : fallback;
}

const clampMm = (v: string) =>
  Math.min(100, Math.max(0, Math.round(Number(v) || 0)));

// ───────────────────────── one parameter row ─────────────────────────
const ParamRow = memo(function ParamRow({
  p,
  value,
  flag,
  onValue,
  onFlag,
}: {
  p: BloodParameterDto;
  value: string;
  flag: ResultFlag;
  onValue: (id: string, v: string) => void;
  onFlag: (id: string, f: ResultFlag) => void;
}) {
  const numeric = p.low !== null || p.high !== null;
  const manual = !numeric && p.resultType !== "Numeric";
  const abnormal = flag !== "Normal";

  return (
    <Box
      sx={{
        display: "grid",
        gap: 1,
        alignItems: "center",
        px: { xs: 1.5, md: 2 },
        py: 1,
        borderTop: 1,
        borderColor: "divider",
        gridTemplateColumns: {
          xs: "minmax(0,1fr) minmax(0,1fr)",
          md: "minmax(0,2.2fr) minmax(0,1.3fr) 100px minmax(0,1.6fr) 96px",
        },
      }}
    >
      <Box
        sx={{
          gridColumn: { xs: "1 / -1", md: "auto" },
          fontWeight: p.isBold ? 800 : 600,
          fontSize: 13.5,
          wordBreak: "break-word",
        }}
      >
        {p.name}
      </Box>

      <TextField
        size="small"
        value={value}
        onChange={(e) => onValue(p.parameterId, e.target.value)}
        placeholder="Result"
        error={abnormal}
        slotProps={{
          htmlInput: {
            "data-result": "1",
            inputMode: numeric ? "decimal" : "text",
            maxLength: 200,
          },
        }}
      />

      <Box sx={{ fontSize: 12, color: "text.secondary" }}>{p.unit ?? ""}</Box>

      <Box
        sx={{ fontSize: 12, color: "text.secondary", wordBreak: "break-word" }}
      >
        {p.referenceText ?? "—"}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: { xs: "flex-end", md: "flex-start" },
        }}
      >
        {manual ? (
          <TextField
            select
            size="small"
            value={flag === "Low" || flag === "High" ? flag : "Normal"}
            onChange={(e) =>
              onFlag(p.parameterId, e.target.value as ResultFlag)
            }
            sx={{ minWidth: 92 }}
          >
            <MenuItem value="Normal">Normal</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="High">High</MenuItem>
          </TextField>
        ) : (
          <Box
            component="span"
            sx={{
              px: 1.25,
              py: 0.4,
              borderRadius: "999px",
              fontSize: 11,
              fontWeight: 800,
              minWidth: 54,
              textAlign: "center",
              visibility: value.trim() ? "visible" : "hidden",
              bgcolor: abnormal ? "error.light" : "success.light",
              color: abnormal ? "error.main" : "success.main",
            }}
          >
            {flag === "Critical" ? "CRITICAL" : flag.toUpperCase()}
          </Box>
        )}
      </Box>
    </Box>
  );
});

// ───────────────────────── entry form ─────────────────────────
function EntryForm({ form }: { form: BloodReportFormDto }) {
  const user = useAuthStore((s) => s.user);
  const save = useSaveBloodReport();
  const logDelivery = useLogReportDelivery();

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      form.parameters.map((p) => [p.parameterId, p.resultValue ?? ""]),
    ),
  );
  const [manualFlags, setManualFlags] = useState<Record<string, ResultFlag>>(
    () =>
      Object.fromEntries(form.parameters.map((p) => [p.parameterId, p.flag])),
  );
  const [meta, setMeta] = useState({
    sampleId: form.sampleId ?? "",
    specimen: form.specimen ?? "",
    method: form.method ?? "",
    machine: form.machineName ?? "",
    reagent: form.reagentName ?? "",
    remarks: form.remarks ?? "",
  });
  const [collectedAt, setCollectedAt] = useState(() =>
    toLocalInput(form.sampleCollectedAt ?? form.orderCreatedAt),
  );
  const [reportedAt, setReportedAt] = useState(() =>
    toLocalInput(form.reportedAt ?? new Date().toISOString()),
  );
  const [remember, setRemember] = useState(false);

  const [settings, setSettings] = useState(form.settings);
  const [useLetterhead, setUseLetterhead] = useState(
    form.settings.useLetterhead,
  );
  const [blankTop, setBlankTop] = useState(String(form.settings.headerSpaceMm));
  const [blankBottom, setBlankBottom] = useState(
    String(form.settings.footerSpaceMm),
  );

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState<null | "save" | "print" | "pdf">(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const onValue = useCallback(
    (id: string, v: string) => setValues((s) => ({ ...s, [id]: v })),
    [],
  );
  const onFlag = useCallback(
    (id: string, f: ResultFlag) => setManualFlags((s) => ({ ...s, [id]: f })),
    [],
  );

  const rows: ReportRow[] = useMemo(
    () =>
      form.parameters.map((p) => {
        const value = (values[p.parameterId] ?? "").trim();
        return {
          section: p.sectionName,
          name: p.name,
          value,
          unit: p.unit ?? "",
          reference: p.referenceText ?? "",
          bold: p.isBold,
          flag: resolveFlag(p, value, manualFlags[p.parameterId] ?? "Normal"),
        };
      }),
    [form.parameters, values, manualFlags],
  );

  const enteredCount = rows.filter((r) => r.value).length;
  const abnormalCount = rows.filter(
    (r) => r.value && r.flag !== "Normal",
  ).length;

  const parts = useMemo(
    () =>
      buildReportParts({
        form,
        rows,
        meta: {
          ...meta,
          collectedAt: fromLocalInput(collectedAt),
          reportedAt: fromLocalInput(reportedAt),
        },
        settings,
        useLetterhead,
        blankHeaderMm: clampMm(blankTop),
        blankFooterMm: clampMm(blankBottom),
        labName: user?.labName,
      }),
    [
      form,
      rows,
      meta,
      collectedAt,
      reportedAt,
      settings,
      useLetterhead,
      blankTop,
      blankBottom,
      user?.labName,
    ],
  );

  const title = `${form.testName} - ${form.orderNumber}`;

  /** Save to the server first (so Print / PDF / WhatsApp always match what is saved). */
  async function persist(): Promise<string> {
    if (enteredCount === 0)
      throw new Error("Enter at least one result value first.");
    const res = await save.mutateAsync({
      orderItemId: form.orderItemId,
      sampleId: meta.sampleId,
      specimen: meta.specimen,
      method: meta.method,
      machineName: meta.machine,
      reagentName: meta.reagent,
      remarks: meta.remarks,
      sampleCollectedAt: fromLocalInput(collectedAt),
      reportedAt: fromLocalInput(reportedAt),
      rememberDefaults: remember,
      useLetterhead,
      headerContent: parts.headerHtml,
      bodyContent: parts.bodyHtml,
      footerContent: parts.footerHtml,
      results: form.parameters.map((p) => ({
        parameterId: p.parameterId,
        value: (values[p.parameterId] ?? "").trim(),
        flag: manualFlags[p.parameterId] ?? "Normal",
      })),
    });
    return res.id;
  }

  async function handleSave() {
    setError(null);
    setBusy("save");
    try {
      await persist();
      setToast("Report saved.");
    } catch (e) {
      setError(errMsg(e, "Could not save the report."));
    } finally {
      setBusy(null);
    }
  }

  async function handlePrint() {
    setError(null);
    setBusy("print");
    try {
      const id = await persist();
      printHtml(buildPrintDocument(title, parts));
      logDelivery.mutate({ documentId: id, channel: "Print" });
    } catch (e) {
      setError(errMsg(e, "Could not print the report."));
    } finally {
      setBusy(null);
    }
  }

  async function handlePdf() {
    setError(null);
    setBusy("pdf");
    try {
      const id = await persist();
      const blob = await buildReportPdf(parts);
      downloadBlob(blob, reportFileName(form));
      logDelivery.mutate({ documentId: id, channel: "Download" });
      setToast("PDF downloaded.");
    } catch (e) {
      setError(errMsg(e, "Could not create the PDF. Try Print → Save as PDF."));
    } finally {
      setBusy(null);
    }
  }

  // used by the WhatsApp dialog: save + build the PDF, remember the document id
  const [waDocId, setWaDocId] = useState<string | null>(null);
  async function makePdfForWhatsApp(): Promise<Blob> {
    const id = await persist();
    setWaDocId(id);
    return buildReportPdf(parts);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter") return;
    const t = e.target as HTMLElement;
    if (!t.matches("input[data-result]")) return;
    e.preventDefault();
    const all = Array.from(
      e.currentTarget.querySelectorAll<HTMLInputElement>("input[data-result]"),
    );
    const next = all[all.indexOf(t as HTMLInputElement) + 1];
    if (next) {
      next.focus();
      next.select();
    }
  }

  const waDefault = form.whatsappNumber || form.patientPhone;
  const waMessage = `Hello ${form.patientName}, your ${form.testName} report (Order ${form.orderNumber}) from ${form.branchName ?? "our lab"} is attached.`;

  // group rows by section while keeping order
  let lastSection: string | null = null;

  return (
    <>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ───── test info: machine / chemical etc ───── */}
      <Box sx={{ ...cardSx, p: { xs: 2, sm: 2.5 }, display: "grid", gap: 1.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 15 }}>
          Test details (printed on report)
        </Typography>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
          }}
        >
          <TextField
            size="small"
            label="Sample ID"
            value={meta.sampleId}
            onChange={(e) => setMeta({ ...meta, sampleId: e.target.value })}
          />
          <TextField
            size="small"
            label="Specimen"
            value={meta.specimen}
            onChange={(e) => setMeta({ ...meta, specimen: e.target.value })}
          />
          <TextField
            size="small"
            label="Method"
            value={meta.method}
            onChange={(e) => setMeta({ ...meta, method: e.target.value })}
          />
          <TextField
            size="small"
            label="Analyser / Machine name"
            value={meta.machine}
            onChange={(e) => setMeta({ ...meta, machine: e.target.value })}
          />
          <TextField
            size="small"
            label="Reagent / Chemical name"
            value={meta.reagent}
            onChange={(e) => setMeta({ ...meta, reagent: e.target.value })}
          />
          <Box />
          <TextField
            size="small"
            type="datetime-local"
            label="Sample collected"
            value={collectedAt}
            onChange={(e) => setCollectedAt(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            type="datetime-local"
            label="Reported on"
            value={reportedAt}
            onChange={(e) => setReportedAt(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
          }
          label="Remember specimen / method / machine / reagent for this test next time"
        />
      </Box>

      {/* ───── results ───── */}
      <Box sx={{ ...cardSx, overflow: "hidden" }} onKeyDown={onKeyDown}>
        <Box
          sx={{
            px: { xs: 1.5, md: 2 },
            py: 1.5,
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 15 }}>
            Enter results
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Pill>
              Entered {enteredCount}/{form.parameters.length}
            </Pill>
            {abnormalCount > 0 && (
              <Pill tone="warning">Abnormal {abnormalCount}</Pill>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            display: { xs: "none", md: "grid" },
            gap: 1,
            px: 2,
            py: 0.75,
            bgcolor: "action.hover",
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            gridTemplateColumns:
              "minmax(0,2.2fr) minmax(0,1.3fr) 100px minmax(0,1.6fr) 96px",
          }}
        >
          <span>Test</span>
          <span>Result</span>
          <span>Unit</span>
          <span>Reference range</span>
          <span>Flag</span>
        </Box>

        {form.parameters.map((p) => {
          const showSection = p.sectionName !== lastSection;
          lastSection = p.sectionName;
          return (
            <Box key={p.parameterId}>
              {showSection && p.sectionName && (
                <Box
                  sx={{
                    px: { xs: 1.5, md: 2 },
                    py: 0.75,
                    bgcolor: "action.selected",
                    fontWeight: 800,
                    fontSize: 12.5,
                    borderTop: 1,
                    borderColor: "divider",
                  }}
                >
                  {p.sectionName}
                </Box>
              )}
              <ParamRow
                p={p}
                value={values[p.parameterId] ?? ""}
                flag={
                  rows.find(
                    (r) => r.name === p.name && r.section === p.sectionName,
                  )?.flag ?? "Normal"
                }
                onValue={onValue}
                onFlag={onFlag}
              />
            </Box>
          );
        })}

        <Box
          sx={{ p: { xs: 1.5, md: 2 }, borderTop: 1, borderColor: "divider" }}
        >
          <TextField
            fullWidth
            multiline
            minRows={2}
            size="small"
            label="Remarks / Interpretation (optional)"
            value={meta.remarks}
            onChange={(e) => setMeta({ ...meta, remarks: e.target.value })}
          />
        </Box>
      </Box>

      {/* ───── print options ───── */}
      <Box sx={{ ...cardSx, p: { xs: 2, sm: 2.5 }, display: "grid", gap: 1.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 15 }}>
          Print layout
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={useLetterhead ? "lh" : "blank"}
          onChange={(_, v: string | null) => v && setUseLetterhead(v === "lh")}
          sx={{ flexWrap: "wrap", gap: 0.75 }}
        >
          <ToggleButton
            value="lh"
            sx={{
              borderRadius: "999px !important",
              border: 1,
              px: 2,
              fontWeight: 700,
            }}
          >
            Use my lab header &amp; footer
          </ToggleButton>
          <ToggleButton
            value="blank"
            sx={{
              borderRadius: "999px !important",
              border: 1,
              px: 2,
              fontWeight: 700,
            }}
          >
            Leave blank space
          </ToggleButton>
        </ToggleButtonGroup>

        {useLetterhead ? (
          !settings.headerHtml && !settings.footerHtml ? (
            <Alert severity="info">
              No header / footer saved yet. Add your lab header image or text
              below.
            </Alert>
          ) : null
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 200px)" },
            }}
          >
            <TextField
              size="small"
              type="number"
              label="Top space (mm)"
              value={blankTop}
              onChange={(e) => setBlankTop(e.target.value)}
              slotProps={{ htmlInput: { min: 0, max: 100 } }}
            />
            <TextField
              size="small"
              type="number"
              label="Bottom space (mm)"
              value={blankBottom}
              onChange={(e) => setBlankBottom(e.target.value)}
              slotProps={{ htmlInput: { min: 0, max: 100 } }}
            />
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setSettingsOpen(true)}
            sx={pillBtnSx}
          >
            Edit lab header / footer / signature
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setShowPreview((v) => !v)}
            sx={pillBtnSx}
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </Button>
        </Box>

        {showPreview && (
          <Box
            sx={{
              bgcolor: "#fff",
              color: "#111",
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              p: 2,
              overflowX: "auto",
            }}
          >
            <Box
              sx={{ minWidth: 620 }}
              dangerouslySetInnerHTML={{
                __html: parts.headerHtml + parts.bodyHtml + parts.footerHtml,
              }}
            />
          </Box>
        )}
      </Box>

      {/* ───── actions (sticky) ───── */}
      <Box
        sx={{
          ...cardSx,
          position: "sticky",
          bottom: { xs: 8, md: 12 },
          zIndex: 5,
          p: 1.5,
          display: "grid",
          gap: 1,
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, auto)" },
          justifyContent: { sm: "end" },
        }}
      >
        <Button
          variant="contained"
          disabled={!!busy}
          onClick={() => void handleSave()}
          sx={pillBtnSx}
        >
          {busy === "save" ? "Saving..." : "Save"}
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          disabled={!!busy}
          onClick={() => void handlePrint()}
          sx={pillBtnSx}
        >
          {busy === "print" ? "Preparing..." : "Print"}
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          disabled={!!busy}
          onClick={() => void handlePdf()}
          sx={pillBtnSx}
        >
          {busy === "pdf" ? "Creating PDF..." : "Download PDF"}
        </Button>
        <Button
          variant="outlined"
          color="success"
          disabled={!!busy}
          onClick={() => setWaOpen(true)}
          sx={pillBtnSx}
        >
          WhatsApp
        </Button>
      </Box>

      {settingsOpen && (
        <LetterheadSettingsDialog
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSaved={(s) => {
            setSettings(s);
            setBlankTop(String(s.headerSpaceMm));
            setBlankBottom(String(s.footerSpaceMm));
            setToast("Lab header / footer saved.");
          }}
        />
      )}

      {waOpen && (
        <WhatsAppDialog
          defaultPhone={waDefault}
          message={waMessage}
          filename={reportFileName(form)}
          makePdf={makePdfForWhatsApp}
          onClose={() => setWaOpen(false)}
          onSent={(phone) => {
            const id = waDocId ?? form.reportDocumentId;
            if (id)
              logDelivery.mutate({
                documentId: id,
                channel: "WhatsApp",
                sentTo: phone.slice(-15),
              });
            setToast("WhatsApp opened.");
          }}
        />
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        message={toast ?? ""}
      />
    </>
  );
}

// ───────────────────────── page ─────────────────────────
function BloodReportPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const search = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const { data: order, isLoading, isError } = useOrderForReport(orderId);
  const [pickedItem, setPickedItem] = useState<string | null>(
    search.get("item"),
  );

  const itemId = useMemo(() => {
    if (!order) return undefined;
    return (
      order.items.find((i) => i.id === pickedItem)?.id ??
      order.items.find((i) => i.reportCount === 0)?.id ??
      order.items[0]?.id
    );
  }, [order, pickedItem]);

  const formQ = useBloodReportForm(itemId);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (isError || !order || !itemId) {
    return (
      <Alert severity="error">
        This order was not found (or has no tests).{" "}
        <Link href="/reports/upload">Back to orders</Link>
      </Alert>
    );
  }

  const form = formQ.data;

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 2.5, minWidth: 0 }}
    >
      <HeaderCard
        title="Blood / Lab Test Report"
        subtitle={`Order ID: ${order.orderNumber} • ${order.patientName}`}
        actions={
          <>
            <Button
              component={Link}
              href={`/reports/order/${order.id}`}
              variant="outlined"
              color="inherit"
              sx={pillBtnSx}
            >
              ← Reports
            </Button>
            <Pill>User: {user?.name ?? "—"}</Pill>
          </>
        }
      />

      <Box sx={{ ...cardSx, p: 2, display: "grid", gap: 1.25 }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Pill tone="info">{order.patientName}</Pill>
          <Pill>
            {order.patientAge ?? "—"} yrs / {order.patientGender ?? "—"}
          </Pill>
          <Pill>{order.patientPhone}</Pill>
          {order.doctorName && <Pill>Dr. {order.doctorName}</Pill>}
        </Box>

        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
          Select blood test
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={itemId}
          onChange={(_, v: string | null) => v && setPickedItem(v)}
          sx={{ flexWrap: "wrap", gap: 0.75 }}
        >
          {order.items.map((i) => (
            <ToggleButton
              key={i.id}
              value={i.id}
              sx={{
                borderRadius: "999px !important",
                border: 1,
                px: 2,
                fontWeight: 700,
              }}
            >
              {i.testName} {i.reportCount > 0 ? "✓" : ""}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {formQ.isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : formQ.isError || !form ? (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void formQ.refetch()}
            >
              Retry
            </Button>
          }
        >
          Could not load the report format. Make sure SQL files 014 and 015 were
          run on the database.
        </Alert>
      ) : !form.hasFormat ? (
        <Alert severity="warning">
          “{form.testName}” does not have a report format yet. Use the editor
          instead: <Link href={`/reports/order/${order.id}`}>go back</Link> and
          choose “Create from Scratch”. (A format exists only for tests listed
          in 014_blood_report_formats.sql — the test name must match exactly.)
        </Alert>
      ) : (
        <EntryForm key={form.orderItemId} form={form} />
      )}
    </Box>
  );
}

export default function BloodReportPageWrapper() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      }
    >
      <BloodReportPage />
    </Suspense>
  );
}
