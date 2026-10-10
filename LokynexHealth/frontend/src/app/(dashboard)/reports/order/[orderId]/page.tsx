"use client";

import { Pill } from "@/components/report-builder/report-toolbar-ui";
import {
  cardSx,
  HeaderCard,
  pillBtnSx,
} from "@/components/reports/report-shell";
import {
  useCreateReportDocument,
  useDeleteReportDocument,
  useGenerateReportDocument,
  useOrderForReport,
  useReportDocuments,
  useReportTemplates,
} from "@/hooks/use-report-builder";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  buildPrintDocument,
  STRUCTURED_MARKER,
} from "@/lib/blood-report/build-report";
import { formatDateTime } from "@/lib/format";
import { printHtml } from "@/lib/order-report";
import { buildFieldMap, mergeFields } from "@/lib/report-editor/merge-fields";
import {
  buildFooterHtml,
  buildHeaderHtml,
  detectModality,
  getModality,
  MODALITIES,
  type Modality,
} from "@/lib/report-editor/modality";
import { buildReportPrintHtml } from "@/lib/report-editor/print";
import { htmlToText, sanitizeHtml } from "@/lib/report-editor/sanitize";
import { useAuthStore } from "@/store/auth-store";
import { ReportDocumentDto } from "@/types/report-builder";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ReactNode, useMemo, useRef, useState } from "react";

function OptionCard({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        ...cardSx,
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        minWidth: 0,
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: 16 }}>{title}</Typography>
      <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
        {desc}
      </Typography>
      <Box
        sx={{ mt: "auto", display: "flex", flexDirection: "column", gap: 1 }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default function OrderReportsPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const user = useAuthStore((s) => s.user);

  const { data: order, isLoading, isError } = useOrderForReport(orderId);
  const { data: docs } = useReportDocuments({ orderId, pageSize: 100 });
  const { data: templates } = useReportTemplates(false);

  const generate = useGenerateReportDocument();
  const createDoc = useCreateReportDocument();
  const deleteDoc = useDeleteReportDocument();

  const [pickedItemId, setPickedItemId] = useState<string | null>(null);
  const [pickedType, setPickedType] = useState<Modality | null>(null);
  const [tplOpen, setTplOpen] = useState(false);
  const [tplSearch, setTplSearch] = useState("");
  const [toDelete, setToDelete] = useState<ReportDocumentDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [docxBusy, setDocxBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // derived (no effects): the test that new reports are created for
  const activeItem = useMemo(() => {
    if (!order) return undefined;
    return (
      order.items.find((i) => i.id === pickedItemId) ??
      order.items.find((i) => i.reportCount === 0) ??
      order.items[0]
    );
  }, [order, pickedItemId]);

  const type: Modality =
    pickedType ??
    detectModality(
      activeItem?.testName ?? "",
      activeItem?.departmentName ?? "",
    );

  const filteredTemplates = useMemo(() => {
    const q = tplSearch.trim().toLowerCase();
    const all = templates?.items ?? [];
    return q ? all.filter((t) => t.name.toLowerCase().includes(q)) : all;
  }, [templates, tplSearch]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (isError || !order || !activeItem) {
    return (
      <Alert severity="error">
        This order was not found (or has no tests).{" "}
        <Link href="/reports/upload">Back to orders</Link>
      </Alert>
    );
  }

  const goEditorNew = () =>
    router.push(
      `/reports/editor?orderId=${order.id}&itemId=${activeItem.id}&type=${type}`,
    );

  const goBloodFormat = (itemId: string) =>
    router.push(`/reports/blood/${order.id}?item=${itemId}`);

  async function useTemplate(templateId: string) {
    setError(null);
    try {
      const res = await generate.mutateAsync({
        orderItemId: activeItem!.id,
        templateId,
      });
      setTplOpen(false);
      router.push(`/reports/editor?docId=${res.id}&type=${type}`);
    } catch (e) {
      setError(
        getApiErrorMessage(e, "Could not create a report from this template."),
      );
    }
  }

  async function handleDocx(file: File) {
    setError(null);
    if (!/\.docx$/i.test(file.name)) {
      setError(
        "Please choose a .docx file (the old .doc format is not supported).",
      );
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("This file is larger than 8 MB.");
      return;
    }
    setDocxBusy(true);
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.convertToHtml({
        arrayBuffer: await file.arrayBuffer(),
      });
      const fields = buildFieldMap(
        order!,
        activeItem!,
        getModality(type).reportTitle,
      );
      const res = await createDoc.mutateAsync({
        orderItemId: activeItem!.id,
        sourceType: "UploadedDocument",
        headerContent: mergeFields(buildHeaderHtml(), fields),
        bodyContent: sanitizeHtml(result.value),
        footerContent: mergeFields(buildFooterHtml(), fields),
      });
      router.push(`/reports/editor?docId=${res.id}&type=${type}`);
    } catch (e) {
      setError(getApiErrorMessage(e, "Could not read this DOCX file."));
    } finally {
      setDocxBusy(false);
    }
  }

  const isStructured = (d: ReportDocumentDto) =>
    !!d.bodyContent && d.bodyContent.startsWith(STRUCTURED_MARKER);

  function printDoc(d: ReportDocumentDto) {
    const title = `${d.testName} - ${d.orderNumber}`;
    if (isStructured(d)) {
      // blood report: header / footer repeat on every printed page
      printHtml(
        buildPrintDocument(title, {
          headerHtml: sanitizeHtml(d.headerContent ?? ""),
          bodyHtml: sanitizeHtml(
            (d.bodyContent ?? "").replace(STRUCTURED_MARKER, ""),
          ),
          footerHtml: sanitizeHtml(d.footerContent ?? ""),
        }),
      );
      return;
    }
    printHtml(
      buildReportPrintHtml({
        title,
        header: d.headerContent,
        body: d.bodyContent,
        footer: d.footerContent,
      }),
    );
  }

  function editDoc(d: ReportDocumentDto) {
    if (isStructured(d)) {
      goBloodFormat(d.orderItemId);
      return;
    }
    router.push(`/reports/editor?docId=${d.id}`);
  }

  const rows = docs?.items ?? [];

  const actionBtns = (d: ReportDocumentDto) => (
    <Box
      sx={{
        display: "flex",
        gap: 0.75,
        justifyContent: "flex-end",
        flexWrap: "wrap",
      }}
    >
      <Button
        size="small"
        variant="contained"
        onClick={() => editDoc(d)}
        sx={pillBtnSx}
      >
        Edit
      </Button>
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        onClick={() => printDoc(d)}
        sx={pillBtnSx}
      >
        Print
      </Button>
      <Button
        size="small"
        variant="outlined"
        color="error"
        onClick={() => setToDelete(d)}
        sx={pillBtnSx}
      >
        Delete
      </Button>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <HeaderCard
        title="Create / Edit Report"
        subtitle={`Order ID: ${order.orderNumber} • ${order.patientName}`}
        actions={
          <>
            <Button
              component={Link}
              href="/reports/upload"
              variant="outlined"
              color="inherit"
              sx={pillBtnSx}
            >
              ← Orders
            </Button>
            <Pill>User: {user?.name ?? "—"}</Pill>
          </>
        }
      />

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {order.items.length > 1 && (
        <Box sx={{ ...cardSx, p: 2 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 1 }}>
            Create report for which test?
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={activeItem.id}
            onChange={(_, v: string | null) => {
              if (v) {
                setPickedItemId(v);
                setPickedType(null);
              }
            }}
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
                {i.testName} {i.reportCount > 0 ? `(${i.reportCount})` : ""}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}

      {/* ───── 4 ways to start a report ───── */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, 1fr)",
            xl: "repeat(4, 1fr)",
          },
        }}
      >
        <OptionCard
          title="1) Blood / Lab Test Format"
          desc={`Ready format for “${activeItem.testName}”: parameters, units, normal ranges, machine & chemical details. Just enter the values and print.`}
        >
          <Button
            variant="contained"
            onClick={() => goBloodFormat(activeItem.id)}
            sx={pillBtnSx}
          >
            Open Format
          </Button>
        </OptionCard>

        <OptionCard
          title="2) Create from Scratch"
          desc={`Start a fresh ${getModality(type).label} report in the online editor.`}
        >
          <TextField
            select
            size="small"
            label="Report type"
            value={type}
            onChange={(e) => setPickedType(e.target.value as Modality)}
          >
            {[...MODALITIES.values()].map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.label}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={goEditorNew} sx={pillBtnSx}>
            Open Editor
          </Button>
        </OptionCard>

        <OptionCard
          title="3) Create from Template"
          desc="Select a saved template; patient details are filled in automatically."
        >
          <Button
            variant="contained"
            onClick={() => setTplOpen(true)}
            sx={pillBtnSx}
          >
            Choose Template
          </Button>
        </OptionCard>

        <OptionCard
          title="4) Edit from DOC / DOCX"
          desc="Upload a Word (.docx) file. It is converted to editable text; very complex layouts may be simplified."
        >
          <input
            ref={fileRef}
            type="file"
            hidden
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void handleDocx(f);
            }}
          />
          <Button
            variant="contained"
            disabled={docxBusy}
            onClick={() => fileRef.current?.click()}
            sx={pillBtnSx}
          >
            {docxBusy ? "Converting..." : "Upload DOCX"}
          </Button>
        </OptionCard>
      </Box>

      {/* ───── existing reports for this order ───── */}
      <Typography sx={{ fontWeight: 800, fontSize: 16 }}>
        Existing Reports (This Order)
      </Typography>

      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No reports yet for this order.
        </Typography>
      ) : isMobile ? (
        <Box sx={{ display: "grid", gap: 1.5 }}>
          {rows.map((d) => (
            <Box key={d.id} sx={{ ...cardSx, p: 2, display: "grid", gap: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Typography sx={{ fontWeight: 800 }}>
                  #{d.id.slice(0, 8)}
                </Typography>
                <Pill tone="info">{d.testName}</Pill>
              </Box>
              <Typography sx={{ fontSize: 13 }} noWrap>
                {htmlToText(d.bodyContent).slice(0, 80) || "—"}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                Created {formatDateTime(d.createdAt)}
                {d.updatedAt ? ` · Updated ${formatDateTime(d.updatedAt)}` : ""}
              </Typography>
              {actionBtns(d)}
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ ...cardSx, borderRadius: "20px", overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Report ID</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Test</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>
                  Small preview text
                </TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Updated</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">
                  Buttons
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell sx={{ fontWeight: 800 }}>
                    #{d.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{d.testName}</TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>
                    <Typography noWrap sx={{ fontSize: 13 }}>
                      {htmlToText(d.bodyContent).slice(0, 80) || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {formatDateTime(d.createdAt)}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {d.updatedAt ? formatDateTime(d.updatedAt) : "—"}
                  </TableCell>
                  <TableCell align="right">{actionBtns(d)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* ───── template picker ───── */}
      <Dialog
        open={tplOpen}
        onClose={() => setTplOpen(false)}
        fullWidth
        maxWidth="xs"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Choose Template</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            margin="dense"
            placeholder="Search templates"
            value={tplSearch}
            onChange={(e) => setTplSearch(e.target.value)}
          />
          {filteredTemplates.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No templates yet. Create a report and use “Save as Template”.
            </Typography>
          ) : (
            <List>
              {filteredTemplates.map((t) => (
                <ListItemButton
                  key={t.id}
                  disabled={generate.isPending}
                  onClick={() => void useTemplate(t.id)}
                  sx={{ borderRadius: 2 }}
                >
                  <ListItemText
                    primary={t.name}
                    secondary={
                      t.sourceType === "UploadedDocument"
                        ? "Uploaded"
                        : "Manual"
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setTplOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ───── delete confirm ───── */}
      <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete report?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Report #{toDelete?.id.slice(0, 8)} will move to the Deleted list.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteDoc.isPending}
            onClick={() => {
              if (!toDelete) return;
              deleteDoc.mutate(toDelete.id, {
                onSettled: () => setToDelete(null),
              });
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
