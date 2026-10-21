"use client";

import { PageTitle } from "@/components/clinic/clinic-shell";
import {
  ConfirmDialog,
  EmptyState,
  useDialogFullScreen,
  useToast,
} from "@/components/clinic/clinic-ui";
import { OnlineMedicineSearch } from "@/components/clinic/online-medicine-search";
import {
  useClinicMe,
  useClinicMedicineMutations,
  useClinicMedicines,
  useMedicineCompanies,
} from "@/hooks/use-clinic";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { mapMedicineCsv, parseCsv } from "@/lib/clinic/csv";
import { canDo } from "@/lib/clinic/permissions";
import type { ClinicMedicine, ImportMedicineRow } from "@/types/clinic";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Pagination,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";

/* ---------- add / edit ---------- */
function MedicineDialog({
  med,
  onClose,
}: {
  med: ClinicMedicine | null;
  onClose: () => void;
}) {
  const fullScreen = useDialogFullScreen();
  const { toast, toastNode } = useToast();
  const { save } = useClinicMedicineMutations();
  const [f, setF] = useState({
    brandName: med?.brandName ?? "",
    company: med?.company ?? "",
    composition: med?.composition ?? "",
    form: med?.form ?? "",
    defaultDosage: med?.defaultDosage ?? "",
    defaultDuration: med?.defaultDuration ?? "",
    defaultInstructions: med?.defaultInstructions ?? "",
    isActive: med?.isActive ?? true,
  });
  const set = (k: keyof typeof f, v: string | boolean) =>
    setF((p) => ({ ...p, [k]: v }));
  const submit = () => {
    if (!f.brandName.trim()) {
      toast("Medicine name is required", "error");
      return;
    }
    save.mutate(
      { id: med?.id ?? null, data: f },
      {
        onSuccess: onClose,
        onError: (e) => toast(getApiErrorMessage(e), "error"),
      },
    );
  };
  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        {med ? "Edit medicine" : "Add medicine"}
      </DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 1.5, pt: "8px !important" }}>
        <OnlineMedicineSearch
          onPick={(m) =>
            setF((p) => ({
              ...p,
              brandName: m.brandName,
              company: m.company || p.company,
              composition: m.composition || m.genericName || p.composition,
              form:
                m.form ||
                (m.route
                  ? m.route.charAt(0).toUpperCase() + m.route.slice(1)
                  : p.form),
              defaultDosage: m.dosage || p.defaultDosage,
              defaultInstructions: m.frequency || p.defaultInstructions,
            }))
          }
        />
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", sm: "1.4fr 1fr" },
          }}
        >
          <TextField
            size="small"
            label="Medicine / brand name *"
            value={f.brandName}
            onChange={(e) => set("brandName", e.target.value)}
          />
          <TextField
            size="small"
            label="Company"
            value={f.company}
            onChange={(e) => set("company", e.target.value)}
          />
        </Box>
        <TextField
          size="small"
          label="Composition"
          placeholder="Paracetamol 500mg"
          value={f.composition}
          onChange={(e) => set("composition", e.target.value)}
        />
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr 1fr" },
          }}
        >
          <TextField
            size="small"
            label="Form"
            placeholder="Tablet"
            value={f.form}
            onChange={(e) => set("form", e.target.value)}
          />
          <TextField
            size="small"
            label="Default dosage"
            placeholder="1-0-1"
            value={f.defaultDosage}
            onChange={(e) => set("defaultDosage", e.target.value)}
          />
          <TextField
            size="small"
            label="Default duration"
            placeholder="5 days"
            value={f.defaultDuration}
            onChange={(e) => set("defaultDuration", e.target.value)}
          />
          <TextField
            size="small"
            label="Default timing"
            placeholder="After food"
            value={f.defaultInstructions}
            onChange={(e) => set("defaultInstructions", e.target.value)}
          />
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={f.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
            />
          }
          label="Active (shows in prescription search)"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={save.isPending}>
          Save
        </Button>
      </DialogActions>
      {toastNode}
    </Dialog>
  );
}

/* ---------- CSV import ---------- */
const CHUNK = 1000;

function ImportDialog({ onClose }: { onClose: () => void }) {
  const fullScreen = useDialogFullScreen();
  const { importRows } = useClinicMedicineMutations();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportMedicineRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    added: number;
    skipped: number;
  } | null>(null);
  const [running, setRunning] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setResult(null);
    setFileName(file.name);
    const { rows: mapped, missing } = mapMedicineCsv(
      parseCsv(await file.text()),
    );
    if (missing) {
      setError(missing);
      setRows([]);
      return;
    }
    setRows(mapped);
  };

  const run = async () => {
    setRunning(true);
    setError(null);
    setProgress(0);
    let added = 0,
      skipped = 0;
    try {
      for (let i = 0; i < rows.length; i += CHUNK) {
        const r = await importRows.mutateAsync(rows.slice(i, i + CHUNK));
        added += r.added;
        skipped += r.skipped;
        setProgress(
          Math.min(100, Math.round(((i + CHUNK) / rows.length) * 100)),
        );
      }
      setResult({ added, skipped });
    } catch (e) {
      setError(getApiErrorMessage(e, "Import failed."));
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog
      open
      onClose={running ? undefined : onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ fontWeight: 800 }}>Import medicines (CSV)</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 1.5, pt: "8px !important" }}>
        <Alert severity="info">
          Use any CSV with a medicine name column and, if you have them, company
          and composition columns (e.g. <b>name</b>, <b>manufacturer_name</b>,{" "}
          <b>short_composition1</b>). Public Indian medicine datasets work as
          they are. Make sure you may legally use the dataset you import.
        </Alert>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <Button
          variant="outlined"
          startIcon={<UploadFileIcon />}
          onClick={() => fileRef.current?.click()}
          disabled={running}
        >
          {fileName || "Choose CSV file"}
        </Button>
        {error && <Alert severity="error">{error}</Alert>}
        {!!rows.length && !result && (
          <Typography variant="body2">
            <b>{rows.length.toLocaleString("en-IN")}</b> medicines found. First:{" "}
            {rows
              .slice(0, 3)
              .map((r) => r.brandName)
              .join(", ")}
            …
          </Typography>
        )}
        {running && <LinearProgress variant="determinate" value={progress} />}
        {result && (
          <Alert severity="success">
            Added {result.added.toLocaleString("en-IN")} · skipped{" "}
            {result.skipped.toLocaleString("en-IN")} (already present /
            duplicate)
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={running}>
          {result ? "Close" : "Cancel"}
        </Button>
        {!result && (
          <Button
            variant="contained"
            onClick={run}
            disabled={!rows.length || running}
          >
            Import
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

/* ---------- page ---------- */
export default function MedicinesPage() {
  const { toast, toastNode } = useToast();
  const { data: me } = useClinicMe();
  const { remove } = useClinicMedicineMutations();
  const [company, setCompany] = useState<string | null>(null);
  const [companyInput, setCompanyInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState<ClinicMedicine | "new" | null>(null);
  const [del, setDel] = useState<ClinicMedicine | null>(null);
  const [importing, setImporting] = useState(false);
  const cq = useDebounce(companyInput.trim(), 250);
  const sq = useDebounce(search.trim(), 300);

  const { data: companies } = useMedicineCompanies(cq);
  const { data } = useClinicMedicines({
    search: sq || undefined,
    company: company ?? undefined,
    pageNumber: page,
    pageSize: 25,
  });
  const canCreate = canDo(me?.permissions, me?.isAdmin, "medicines", "create");
  const canEdit = canDo(me?.permissions, me?.isAdmin, "medicines", "edit");
  const canDelete = canDo(me?.permissions, me?.isAdmin, "medicines", "delete");

  const rowActions = (m: ClinicMedicine) => (
    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      {canEdit && (
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => setEdit(m)}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {canDelete && (
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => setDel(m)}>
            <DeleteOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  return (
    <>
      <PageTitle
        title="Medicines"
        subtitle="Your medicine list. Pick a company, then its medicines — details fill the prescription automatically"
        actions={
          canCreate && (
            <>
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => setImporting(true)}
              >
                Import CSV
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setEdit("new")}
              >
                Add medicine
              </Button>
            </>
          )
        }
      />

      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 4,
          mb: 2,
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1.4fr" },
        }}
      >
        <Autocomplete
          value={company}
          onChange={(_, v) => {
            setCompany(v);
            setPage(1);
          }}
          inputValue={companyInput}
          onInputChange={(_, v) => setCompanyInput(v)}
          options={(companies ?? []).map((c) => c.company)}
          filterOptions={(x) => x}
          renderInput={(p) => (
            <TextField
              {...p}
              size="small"
              label="Company"
              placeholder="Type a company name"
            />
          )}
        />
        <TextField
          size="small"
          label="Medicine name / composition"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </Paper>

      {!data?.items.length ? (
        <EmptyState text="No medicines yet. Add one, import a CSV, or just write prescriptions — new medicines are learned automatically." />
      ) : (
        <>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 4, display: { xs: "none", md: "block" } }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Medicine</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Composition</TableCell>
                  <TableCell>Default</TableCell>
                  <TableCell align="center">Used</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((m) => (
                  <TableRow
                    key={m.id}
                    hover
                    sx={{ opacity: m.isActive ? 1 : 0.5 }}
                  >
                    <TableCell sx={{ fontWeight: 700 }}>
                      {m.brandName}
                      {m.form && (
                        <Chip size="small" label={m.form} sx={{ ml: 0.75 }} />
                      )}
                    </TableCell>
                    <TableCell>{m.company || "—"}</TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" noWrap>
                        {m.composition || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {[
                        m.defaultDosage,
                        m.defaultDuration,
                        m.defaultInstructions,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </TableCell>
                    <TableCell align="center">{m.usageCount}</TableCell>
                    <TableCell align="right">{rowActions(m)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: { xs: "grid", md: "none" }, gap: 1 }}>
            {data.items.map((m) => (
              <Paper
                key={m.id}
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 3, opacity: m.isActive ? 1 : 0.5 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }} noWrap>
                      {m.brandName}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                      noWrap
                    >
                      {[m.company, m.composition].filter(Boolean).join(" · ")}
                    </Typography>
                  </Box>
                  {rowActions(m)}
                </Box>
                {(m.defaultDosage || m.defaultDuration) && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {[m.defaultDosage, m.defaultDuration, m.defaultInstructions]
                      .filter(Boolean)
                      .join(" · ")}
                  </Typography>
                )}
              </Paper>
            ))}
          </Box>
          {data.totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                count={data.totalPages}
                page={page}
                onChange={(_, v) => setPage(v)}
              />
            </Box>
          )}
        </>
      )}

      {edit && (
        <MedicineDialog
          key={edit === "new" ? "new" : edit.id}
          med={edit === "new" ? null : edit}
          onClose={() => setEdit(null)}
        />
      )}
      {importing && <ImportDialog onClose={() => setImporting(false)} />}
      <ConfirmDialog
        open={!!del}
        title="Delete medicine?"
        danger
        confirmLabel="Delete"
        busy={remove.isPending}
        text={
          del
            ? `“${del.brandName}” will be removed from your list. Old prescriptions are not affected.`
            : ""
        }
        onClose={() => setDel(null)}
        onConfirm={() =>
          del &&
          remove.mutate(del.id, {
            onSuccess: () => {
              setDel(null);
              toast("Medicine deleted");
            },
            onError: (e) => {
              setDel(null);
              toast(getApiErrorMessage(e), "error");
            },
          })
        }
      />
      {toastNode}
    </>
  );
}
