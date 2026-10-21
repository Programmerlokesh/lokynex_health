"use client";

import { DepartmentList } from "@/components/departments/department-list";
import { getDeptMeta } from "@/components/departments/department-meta";
import { DepartmentSelectDialog } from "@/components/departments/department-select-dialog";
import { DeptIconBadge } from "@/components/departments/dept-icon-badge";
import { ReportIcon } from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { Pill } from "@/components/report-builder/report-toolbar-ui";
import { FormatEditor } from "@/components/test-format/format-editor";
import { useDebounce } from "@/hooks/use-debounce";
import { useDepartmentSelection } from "@/hooks/use-department-selection";
import { useDepartments } from "@/hooks/use-departments";
import { useTestFormat, useTestFormats } from "@/hooks/use-test-formats";
import CloseIcon from "@mui/icons-material/Close";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useRef, useState } from "react";

type Filter = "all" | "with" | "none";

function FormatPane({
  testId,
  onBack,
  onDirtyChange,
}: {
  testId: string;
  onBack?: () => void;
  onDirtyChange: (d: boolean) => void;
}) {
  const q = useTestFormat(testId);

  if (q.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (q.isError || !q.data) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void q.refetch()}>
            Retry
          </Button>
        }
      >
        Could not load this test format.
      </Alert>
    );
  }

  // key changes after every save/refetch -> editor restarts from the saved data
  return (
    <FormatEditor
      key={`${testId}:${q.dataUpdatedAt}`}
      format={q.data}
      onBack={onBack}
      onDirtyChange={onDirtyChange}
    />
  );
}

function TestFormatsPage() {
  const search = useSearchParams();

  const [text, setText] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(search.get("test"));
  const [dirty, setDirty] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: departments } = useDepartments();
  const {
    selectedIds,
    toggle: toggleDepartment,
    setMany: setManyDepartments,
    select: selectDepartment,
  } = useDepartmentSelection();

  const visibleDepartments = useMemo(
    () => (departments ?? []).filter((d) => selectedIds.has(d.id)),
    [departments, selectedIds],
  );
  const debounced = useDebounce(text, 350);
  const { data, isLoading, isError, refetch } = useTestFormats(
    debounced.trim(),
  );

  // Deep link (?test=...) with no department chosen yet: open that test's department.
  const linkedDept = useMemo(() => {
    if (selectedDeptId || !selected) return null;
    const t = (data ?? []).find((x) => x.testId === selected);
    if (!t) return null;
    return (
      (departments ?? []).find(
        (d) => d.name.trim().toLowerCase() === t.departmentName.trim().toLowerCase(),
      ) ?? null
    );
  }, [selectedDeptId, selected, data, departments]);

  const activeDept = useMemo(
    () => visibleDepartments.find((d) => d.id === selectedDeptId) ?? linkedDept,
    [visibleDepartments, selectedDeptId, linkedDept],
  );
  const meta = activeDept ? getDeptMeta(activeDept.name) : null;

  // Only the tests of the chosen department (same flow as Departments & Tests).
  const all = useMemo(
    () =>
      activeDept
        ? (data ?? []).filter(
            (t) =>
              t.departmentName.trim().toLowerCase() ===
              activeDept.name.trim().toLowerCase(),
          )
        : [],
    [data, activeDept],
  );
  const items = all.filter((t) =>
    filter === "with"
      ? t.parameterCount > 0
      : filter === "none"
        ? t.parameterCount === 0
        : true,
  );
  const withCount = all.filter((t) => t.parameterCount > 0).length;

  function confirmLeave() {
    if (dirty && !window.confirm("You have unsaved changes. Discard them?"))
      return false;
    setDirty(false);
    return true;
  }

  function selectTest(id: string | null) {
    if (id === selected) return;
    if (!confirmLeave()) return;
    setSelected(id);
  }

  function handleSelectDepartment(id: string) {
    if (id !== selectedDeptId && !confirmLeave()) return;
    setSelectedDeptId(id);
    setSelected(null);
    setText("");
    setFilter("all");
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 899.95px)").matches
    ) {
      requestAnimationFrame(() =>
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  }

  const hasDepartments = (departments?.length ?? 0) > 0;

  const testList = (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          {meta && <DeptIconBadge Icon={meta.Icon} color={meta.color} size={44} />}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }} noWrap>
              {activeDept?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isLoading
                ? "Loading tests..."
                : `${all.length} test${all.length === 1 ? "" : "s"} · ${withCount} with format`}
            </Typography>
          </Box>
        </Box>
        <TextField
          size="small"
          placeholder="Search tests by name..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: brand.blue }} />
                </InputAdornment>
              ),
              endAdornment: text ? (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" onClick={() => setText("")}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
          sx={{
            width: { xs: "100%", md: 340 },
            "& .MuiOutlinedInput-root": { height: 44, borderRadius: "12px" },
          }}
        />
      </Box>

      <ToggleButtonGroup
        exclusive
        size="small"
        value={filter}
        onChange={(_, v: Filter | null) => v && setFilter(v)}
        sx={{ flexWrap: "wrap", gap: 0.75, mb: 1.5 }}
      >
        {(
          [
            ["all", `All ${all.length}`],
            ["with", `With format ${withCount}`],
            ["none", `No format ${all.length - withCount}`],
          ] as [Filter, string][]
        ).map(([v, label]) => (
          <ToggleButton
            key={v}
            value={v}
            sx={{
              borderRadius: "999px !important",
              border: 1,
              px: 1.5,
              py: 0.25,
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {isLoading ? (
        <Box sx={{ display: "grid", gap: 1 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={52} />
          ))}
        </Box>
      ) : isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          Could not load tests.
        </Alert>
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No tests found in this department. Add tests from Departments &amp;
          Tests first.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
              xl: "repeat(3, 1fr)",
            },
          }}
        >
          {items.map((t) => (
            <Box
              key={t.testId}
              component="button"
              type="button"
              onClick={() => selectTest(t.testId)}
              sx={{
                textAlign: "left",
                cursor: "pointer",
                font: "inherit",
                color: "text.primary",
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
                borderRadius: 3,
                px: 1.75,
                py: 1.25,
                display: "flex",
                gap: 1,
                alignItems: "center",
                justifyContent: "space-between",
                transition: "border-color .15s, box-shadow .15s",
                "&:hover": {
                  borderColor: meta?.color ?? "primary.main",
                  boxShadow: "0 4px 14px rgba(23,43,77,0.08)",
                },
              }}
            >
              <Typography
                sx={{ fontWeight: 700, fontSize: 13.5, wordBreak: "break-word" }}
              >
                {t.testName}
              </Typography>
              <Pill tone={t.parameterCount > 0 ? "success" : "warning"}>
                {t.parameterCount > 0 ? `${t.parameterCount} params` : "No format"}
              </Pill>
            </Box>
          ))}
        </Box>
      )}
    </>
  );

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 }, minWidth: 0 }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Box
          sx={{
            bgcolor: "#FEF3C7",
            color: brand.orange,
            p: 1,
            borderRadius: 2,
            display: "flex",
          }}
        >
          <ReportIcon fontSize="small" />
        </Box>
        <Box sx={{ mr: "auto" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Test Formats
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
            Parameters, units, normal ranges, machine &amp; chemical details.
            Changes apply to new reports only.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<PlaylistAddCheckIcon />}
          onClick={() => setSelectorOpen(true)}
          disabled={!departments}
          sx={{ flexShrink: 0 }}
        >
          Select departments
          {departments ? ` (${visibleDepartments.length})` : ""}
        </Button>
      </Box>

      {/* 1. department picker, same as Departments & Tests */}
      <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <DepartmentList
          selectedId={activeDept?.id ?? null}
          visibleIds={selectedIds}
          onSelect={handleSelectDepartment}
          onDeleted={(id) => {
            if (id === selectedDeptId) setSelectedDeptId(null);
          }}
          onCreated={selectDepartment}
          onOpenSelector={() => setSelectorOpen(true)}
        />
      </Paper>

      {/* 2. tests of the department, then the format editor */}
      <Paper
        ref={panelRef}
        sx={{ p: { xs: 1.5, sm: 2.5 }, scrollMarginTop: { xs: 72, md: 16 }, minWidth: 0 }}
      >
        {!activeDept ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ py: 3, textAlign: "center" }}
          >
            {!hasDepartments
              ? "Add a department first, then its tests will show up here."
              : visibleDepartments.length === 0
                ? "Select the departments your lab needs (top right) to see them here."
                : "Select a department above to see its tests."}
          </Typography>
        ) : selected ? (
          <FormatPane
            testId={selected}
            onBack={() => selectTest(null)}
            onDirtyChange={setDirty}
          />
        ) : (
          testList
        )}
      </Paper>

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

export default function TestFormatsPageWrapper() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      }
    >
      <TestFormatsPage />
    </Suspense>
  );
}