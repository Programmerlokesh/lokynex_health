"use client";

import { DepartmentList } from "@/components/departments/department-list";
import { getDeptMeta } from "@/components/departments/department-meta";
import { DepartmentSelectDialog } from "@/components/departments/department-select-dialog";
import { DeptIconBadge } from "@/components/departments/dept-icon-badge";
import { ReportPadEditor } from "@/components/report-pad/report-pad-editor";
import { HeaderCard } from "@/components/reports/report-shell";
import {
  useCustomPadDepartments,
  useLabReportSettings,
} from "@/hooks/use-blood-reports";
import { useDepartmentSelection } from "@/hooks/use-department-selection";
import { useDepartments } from "@/hooks/use-departments";
import { getApiErrorMessage } from "@/lib/api-error";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

/** null = the lab default pad (used by every department without its own pad). */
type Scope = "default" | string;

export default function ReportPadPage() {
  const [scope, setScope] = useState<Scope>("default");
  const [dirty, setDirty] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const { data: departments } = useDepartments();
  const {
    selectedIds,
    toggle: toggleDepartment,
    setMany: setManyDepartments,
    select: selectDepartment,
  } = useDepartmentSelection();
  const { data: customIds } = useCustomPadDepartments();

  const visibleDepartments = useMemo(
    () => (departments ?? []).filter((d) => selectedIds.has(d.id)),
    [departments, selectedIds],
  );
  const activeDept = useMemo(
    () =>
      scope === "default"
        ? null
        : (visibleDepartments.find((d) => d.id === scope) ?? null),
    [scope, visibleDepartments],
  );
  const departmentId = activeDept?.id ?? null;
  const meta = activeDept ? getDeptMeta(activeDept.name) : null;

  const q = useLabReportSettings(departmentId);

  function changeScope(next: Scope) {
    if (next === scope) return;
    if (dirty && !window.confirm("You have unsaved changes. Discard them?"))
      return;
    setDirty(false);
    setScope(next);
  }

  const customCount = customIds?.length ?? 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <HeaderCard
        title="Report Pad"
        subtitle="Header, footer, blank space & signature, set separately for each department"
        note="Pick a department to edit only that department's report pad. Departments without their own pad use the lab default."
        actions={
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlaylistAddCheckIcon />}
            onClick={() => setSelectorOpen(true)}
            disabled={!departments}
          >
            Select departments
            {departments ? ` (${visibleDepartments.length})` : ""}
          </Button>
        }
      />

      <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            mb: 2,
          }}
        >
          <Chip
            clickable
            color={scope === "default" ? "primary" : "default"}
            variant={scope === "default" ? "filled" : "outlined"}
            label="Lab default pad"
            onClick={() => changeScope("default")}
            sx={{ fontWeight: 700 }}
          />
          <Typography variant="caption" color="text.secondary">
            {customCount > 0
              ? `${customCount} department${customCount === 1 ? " has" : "s have"} their own pad`
              : "No department has its own pad yet"}
          </Typography>
        </Box>

        <DepartmentList
          selectedId={departmentId}
          visibleIds={selectedIds}
          onSelect={changeScope}
          onDeleted={(id) => {
            if (id === scope) setScope("default");
          }}
          onCreated={selectDepartment}
          onOpenSelector={() => setSelectorOpen(true)}
        />
      </Paper>

      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}
      >
        {meta && activeDept && (
          <DeptIconBadge Icon={meta.Icon} color={meta.color} size={40} />
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ lineHeight: 1.2 }} noWrap>
            {activeDept ? `${activeDept.name} pad` : "Lab default pad"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {activeDept
              ? "Used only for reports of this department."
              : "Used by every department that has no pad of its own."}
          </Typography>
        </Box>
      </Box>

      {q.isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {q.isError && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void q.refetch()}
            >
              Retry
            </Button>
          }
        >
          {getApiErrorMessage(q.error, "Could not load the report pad.")}
        </Alert>
      )}

      {q.data && (
        <ReportPadEditor
          key={`${scope}:${q.dataUpdatedAt}`}
          initial={q.data}
          departmentId={departmentId}
          departmentName={activeDept?.name}
          onDirtyChange={setDirty}
        />
      )}

      <DepartmentSelectDialog
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        departments={departments ?? []}
        selectedIds={selectedIds}
        onToggle={toggleDepartment}
        onSetMany={setManyDepartments}
      />
    </Box>
  );
}
