"use client";

import { Pill } from "@/components/report-builder/report-toolbar-ui";
import { EditorChrome } from "@/components/report-editor/editor-chrome";
import {
  RichEditor,
  type RichEditorHandle,
} from "@/components/report-editor/rich-editor";
import {
  cardSx,
  HeaderCard,
  pillBtnSx,
} from "@/components/reports/report-shell";
import {
  useCreateReportDocument,
  useCreateReportTemplate,
  useOrderForReport,
  useReportDocument,
  useUpdateReportDocument,
} from "@/hooks/use-report-builder";
import { getApiErrorMessage } from "@/lib/api-error";
import { printHtml } from "@/lib/order-report";
import {
  buildFieldMap,
  mergeFields,
  unmergeFields,
} from "@/lib/report-editor/merge-fields";
import {
  buildBodyHtml,
  buildFooterHtml,
  buildHeaderHtml,
  detectModality,
  getModality,
  isModality,
  type Modality,
} from "@/lib/report-editor/modality";
import { buildReportPrintHtml } from "@/lib/report-editor/print";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  TextField,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  orderId: string | null;
  itemId: string | null;
  docId: string | null;
  type: string | null;
}

type Toast = { msg: string; sev: "success" | "error" | "info" };

export function ReportEditorScreen({ orderId, itemId, docId, type }: Props) {
  const router = useRouter();

  const docQ = useReportDocument(docId);
  const orderQ = useOrderForReport(
    docId ? (docQ.data?.orderId ?? null) : orderId,
  );
  const createDoc = useCreateReportDocument();
  const updateDoc = useUpdateReportDocument();
  const createTemplate = useCreateReportTemplate();

  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showHF, setShowHF] = useState(true);
  const [spell, setSpell] = useState(true);
  const [tplOpen, setTplOpen] = useState(false);
  const [tplName, setTplName] = useState("");

  const headerRef = useRef<RichEditorHandle>(null);
  const bodyRef = useRef<RichEditorHandle>(null);
  const footerRef = useRef<RichEditorHandle>(null);
  const activeRef = useRef<RichEditorHandle | null>(null);

  const order = orderQ.data;
  const doc = docQ.data;

  const item = useMemo(() => {
    if (!order) return undefined;
    const wanted = docId ? doc?.orderItemId : itemId;
    return order.items.find((i) => i.id === wanted) ?? order.items[0];
  }, [order, doc, docId, itemId]);

  const modality: Modality = useMemo(
    () =>
      isModality(type)
        ? type
        : detectModality(item?.testName ?? "", item?.departmentName ?? ""),
    [type, item],
  );
  const def = getModality(modality);

  const fields = useMemo(
    () => (order && item ? buildFieldMap(order, item, def.reportTitle) : null),
    [order, item, def.reportTitle],
  );

  const initial = useMemo(() => {
    if (!fields) return null;
    if (doc) {
      return {
        h: doc.headerContent ?? "",
        b: doc.bodyContent ?? "",
        f: doc.footerContent ?? "",
      };
    }
    return {
      h: mergeFields(buildHeaderHtml(), fields),
      b: buildBodyHtml(def),
      f: mergeFields(buildFooterHtml(), fields),
    };
    // `doc` is read only for its first value; see RichEditor resetKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, def, docId, !!doc]);

  const markDirty = () => setDirty(true);
  const getActive = () => activeRef.current ?? bodyRef.current;

  function collect() {
    return {
      headerContent: headerRef.current?.getHtml() ?? "",
      bodyContent: bodyRef.current?.getHtml() ?? "",
      footerContent: footerRef.current?.getHtml() ?? "",
    };
  }

  async function save(): Promise<boolean> {
    if (!item) return false;
    const payload = collect();
    try {
      if (docId) {
        await updateDoc.mutateAsync({ id: docId, data: payload });
        setDirty(false);
        setToast({ msg: "Report saved.", sev: "success" });
      } else {
        const res = await createDoc.mutateAsync({
          orderItemId: item.id,
          sourceType: "Manual",
          ...payload,
        });
        setDirty(false);
        setToast({ msg: "Report created.", sev: "success" });
        router.replace(`/reports/editor?docId=${res.id}&type=${modality}`);
      }
      return true;
    } catch (e) {
      setToast({
        msg: getApiErrorMessage(e, "Could not save the report."),
        sev: "error",
      });
      return false;
    }
  }

  // Ctrl+S and "unsaved changes" guard, both always see the latest save()
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveRef.current();
      }
    }
    function onUnload(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [dirty]);

  function handlePrint() {
    const p = collect();
    printHtml(
      buildReportPrintHtml({
        title: `${def.reportTitle} - ${order?.orderNumber ?? ""}`,
        header: p.headerContent,
        body: p.bodyContent,
        footer: p.footerContent,
      }),
    );
  }

  async function handleSaveTemplate() {
    const name = tplName.trim();
    if (!name || !fields) return;
    const p = collect();
    try {
      await createTemplate.mutateAsync({
        name,
        sourceType: "Manual",
        headerContent: unmergeFields(p.headerContent, fields),
        bodyContent: unmergeFields(p.bodyContent, fields),
        footerContent: unmergeFields(p.footerContent, fields),
      });
      setTplOpen(false);
      setTplName("");
      setToast({ msg: "Template saved.", sev: "success" });
    } catch (e) {
      setToast({
        msg: getApiErrorMessage(e, "Could not save the template."),
        sev: "error",
      });
    }
  }

  function handleWordCount() {
    const text = [headerRef, bodyRef, footerRef]
      .map((r) => r.current?.getText() ?? "")
      .join(" ")
      .trim();
    const words = text ? text.split(/\s+/).length : 0;
    setToast({
      msg: `${words} words · ${text.length} characters`,
      sev: "info",
    });
  }

  function handleBack() {
    if (dirty && !window.confirm("You have unsaved changes. Leave anyway?")) {
      return;
    }
    router.push(order ? `/reports/order/${order.id}` : "/reports/upload");
  }

  /* ───────── states ───────── */
  if (!docId && !orderId) {
    return <Alert severity="error">No order selected for this report.</Alert>;
  }
  if (docQ.isError || orderQ.isError) {
    return (
      <Alert severity="error">
        Could not load this report. Go back and try again.
      </Alert>
    );
  }
  if (!order || !item || !initial) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const resetKey = docId ?? "new";
  const saving = createDoc.isPending || updateDoc.isPending;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <HeaderCard
        title={`Online Report Editor — ${docId ? `Report #${docId.slice(0, 8)}` : "New Report"}`}
        subtitle={`Order: #${order.orderNumber} • ${order.patientName} • ${item.testName}`}
        note={
          docId
            ? "Type / for quick snippets. Ctrl+S to save."
            : "Not saved yet. Press Save Report to create it."
        }
        actions={
          <>
            <Pill tone="info">{def.label}</Pill>
            <Pill tone={dirty ? "warning" : "success"}>
              {dirty ? "Unsaved" : "Saved"}
            </Pill>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleBack}
              sx={pillBtnSx}
            >
              ← Back
            </Button>
            <Button
              variant="contained"
              disabled={saving}
              onClick={() => void save()}
              sx={pillBtnSx}
            >
              {saving ? "Saving..." : "Save Report"}
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => setTplOpen(true)}
              sx={pillBtnSx}
            >
              Save as Template
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handlePrint}
              sx={pillBtnSx}
            >
              Print
            </Button>
          </>
        }
      />

      <Box sx={{ ...cardSx, borderRadius: "20px", overflow: "clip" }}>
        <EditorChrome
          getActive={getActive}
          snippets={def.snippets}
          zoom={zoom}
          onZoom={setZoom}
          showHeaderFooter={showHF}
          onToggleHeaderFooter={() => setShowHF((v) => !v)}
          spellcheck={spell}
          onToggleSpellcheck={() => setSpell((v) => !v)}
          onSave={() => void save()}
          onSaveTemplate={() => setTplOpen(true)}
          onPrint={handlePrint}
          onBack={handleBack}
          onWordCount={handleWordCount}
        />

        {/* grey desk + white A4 sheet. Fluid on phones, 794px (A4) on desktop. */}
        <Box
          sx={{
            bgcolor: "action.hover",
            p: { xs: 0.75, sm: 2 },
            overflowX: "auto",
          }}
        >
          <Box
            sx={{
              zoom,
              width: "100%",
              maxWidth: 794,
              mx: "auto",
              minHeight: { sm: 1123 },
              bgcolor: "#fff",
              color: "#111",
              boxShadow: 3,
              p: { xs: 1.5, sm: "14mm" },
              display: "flex",
              flexDirection: "column",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 14,
            }}
          >
            <Box sx={{ display: showHF ? "block" : "none" }}>
              <RichEditor
                ref={headerRef}
                ariaLabel="Report header"
                resetKey={resetKey}
                initialHtml={initial.h}
                snippets={def.snippets}
                spellCheck={spell}
                minHeight={60}
                onChange={markDirty}
                onActivate={() => (activeRef.current = headerRef.current)}
              />
            </Box>

            <Box sx={{ flex: 1, py: 1 }}>
              <RichEditor
                ref={bodyRef}
                ariaLabel="Report body"
                resetKey={resetKey}
                initialHtml={initial.b}
                snippets={def.snippets}
                spellCheck={spell}
                minHeight={360}
                onChange={markDirty}
                onActivate={() => (activeRef.current = bodyRef.current)}
              />
            </Box>

            <Box sx={{ display: showHF ? "block" : "none" }}>
              <RichEditor
                ref={footerRef}
                ariaLabel="Report footer"
                resetKey={resetKey}
                initialHtml={initial.f}
                snippets={def.snippets}
                spellCheck={spell}
                minHeight={60}
                onChange={markDirty}
                onActivate={() => (activeRef.current = footerRef.current)}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={tplOpen}
        onClose={() => setTplOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Save as Template</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            margin="dense"
            label="Template name"
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 150 } }}
            helperText="Patient name, order no, test and date are saved as {{placeholders}}."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setTplOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!tplName.trim() || createTemplate.isPending}
            onClick={() => void handleSaveTemplate()}
          >
            {createTemplate.isPending ? "Saving..." : "Save template"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert
            severity={toast.sev}
            onClose={() => setToast(null)}
            variant="filled"
          >
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
