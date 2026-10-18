"use client";

import { CreateTestDialog } from "@/components/departments/create-test-dialog";
import { DepartmentList } from "@/components/departments/department-list";
import { getDeptMeta } from "@/components/departments/department-meta";
import { DepartmentSelectDialog } from "@/components/departments/department-select-dialog";
import { DeptIconBadge } from "@/components/departments/dept-icon-badge";
import { EditTestDialog } from "@/components/departments/edit-test-dialog";
import { TestsTable } from "@/components/departments/tests-table";
import { TestTubeIcon } from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { useDepartmentSelection } from "@/hooks/use-department-selection";
import { useDepartments, useTests } from "@/hooks/use-departments";
import { TestDto } from "@/types/department";
import CloseIcon from "@mui/icons-material/Close";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";

export default function DepartmentsPage() {
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [editingTest, setEditingTest] = useState<TestDto | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [page, setPage] = useState(0); // MUI pagination is 0-based
  const [pageSize, setPageSize] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: departments } = useDepartments();

  // The departments this lab chose to use. Everything else stays hidden.
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

  // Only the department the user picked (and only among the chosen ones).
  // Nothing is selected on first load, so no tests are shown until a
  // department is chosen. Derived — no effect.
  const activeDept = useMemo(() => {
    if (!selectedDeptId) return null;
    return visibleDepartments.find((d) => d.id === selectedDeptId) ?? null;
  }, [visibleDepartments, selectedDeptId]);
  const activeId = activeDept?.id ?? null;

  const totalTests = useMemo(
    () => visibleDepartments.reduce((sum, d) => sum + d.testCount, 0),
    [visibleDepartments],
  );
  const activeCount = useMemo(
    () => visibleDepartments.filter((d) => d.status === "Active").length,
    [visibleDepartments],
  );

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError } = useTests(
    {
      departmentId: activeId ?? undefined,
      search: search || undefined,
      pageNumber: page + 1,
      pageSize,
    },
    { enabled: !!activeId },
  );

  function handleSelectDepartment(id: string) {
    setSelectedDeptId(id);
    setPage(0);
    setSearchInput("");
    setSearch("");
    // On a phone the tests sit below the tiles — bring them into view.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 899.95px)").matches
    ) {
      requestAnimationFrame(() =>
        panelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      );
    }
  }

  const meta = activeDept ? getDeptMeta(activeDept.name) : null;
  const hasDepartments = (departments?.length ?? 0) > 0;

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}
    >
      {/* page header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <Box
          sx={{
            bgcolor: "#CCFBF1",
            color: brand.teal,
            p: 1,
            borderRadius: 2,
            display: "flex",
          }}
        >
          <TestTubeIcon fontSize="small" />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mr: "auto" }}>
          Departments & Tests
        </Typography>
        {departments && (
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            <Chip
              size="small"
              label={`${visibleDepartments.length} departments`}
            />
            <Chip size="small" label={`${totalTests} tests`} />
            <Chip
              size="small"
              color="success"
              variant="outlined"
              label={`${activeCount} active`}
            />
          </Box>
        )}
        {/* right-hand corner: choose which departments this lab uses */}
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

      {/* 1. department picker — only the departments the lab chose */}
      <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <DepartmentList
          selectedId={activeId}
          visibleIds={selectedIds}
          onSelect={handleSelectDepartment}
          onDeleted={(id) => {
            if (id === selectedDeptId) setSelectedDeptId(null);
          }}
          onCreated={selectDepartment}
          onOpenSelector={() => setSelectorOpen(true)}
        />
      </Paper>

      {/* 2. tests of the chosen department */}
      <Paper
        ref={panelRef}
        sx={{
          p: { xs: 1.5, sm: 2.5 },
          scrollMarginTop: { xs: 72, md: 16 },
        }}
      >
        {!activeDept ? (
          <Box
            sx={{
              py: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
              textAlign: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {!hasDepartments
                ? "Add a department first, then its tests will show up here."
                : visibleDepartments.length === 0
                  ? "Select the departments your lab needs (top right) to see them here."
                  : "Select a department above to see its tests."}
            </Typography>
            <CreateTestDialog departmentId={null} />
          </Box>
        ) : (
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  minWidth: 0,
                }}
              >
                {meta && (
                  <DeptIconBadge
                    Icon={meta.Icon}
                    color={meta.color}
                    size={44}
                  />
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ lineHeight: 1.2 }} noWrap>
                    {activeDept.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {data
                      ? `${data.totalCount} test${data.totalCount === 1 ? "" : "s"}`
                      : "Loading tests..."}
                    {search ? ` matching “${search}”` : ""}
                    {activeDept.status !== "Active"
                      ? " · Inactive department"
                      : ""}
                  </Typography>
                </Box>
              </Box>

              {/* search box + add a new test */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  width: { xs: "100%", md: "auto" },
                  flexShrink: 0,
                }}
              >
                <TextField
                  size="small"
                  placeholder="Search tests by name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  slotProps={{
                    htmlInput: { "aria-label": "Search tests" },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: brand.blue }} />
                        </InputAdornment>
                      ),
                      endAdornment: searchInput ? (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            aria-label="Clear search"
                            onClick={() => setSearchInput("")}
                            edge="end"
                            sx={{
                              minWidth: "32px !important",
                              minHeight: "32px !important",
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : undefined,
                    },
                  }}
                  sx={{
                    // NOTE: don't use `flex: 1` here — it sets flex-basis to 0
                    // and the box collapses. Give it a real width instead.
                    flex: { xs: "1 1 auto", md: "0 0 auto" },
                    width: { xs: "auto", md: 340 },
                    minWidth: 0,
                    "& .MuiOutlinedInput-root": {
                      height: 44,
                      borderRadius: "12px",
                      bgcolor: "background.paper",
                      fontSize: 14.5,
                      transition: "box-shadow .2s, border-color .2s",
                      boxShadow: `0 2px 6px -2px ${alpha(brand.navy, 0.12)}`,
                      "& fieldset": {
                        borderColor: alpha(brand.blue, 0.28),
                        borderWidth: 1.5,
                      },
                      "&:hover fieldset": {
                        borderColor: alpha(brand.blue, 0.6),
                      },
                      "&.Mui-focused": {
                        boxShadow: `0 0 0 4px ${alpha(brand.blue, 0.15)}`,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: brand.blue,
                        borderWidth: 1.5,
                      },
                    },
                  }}
                />
                <Box sx={{ flexShrink: 0 }}>
                  <CreateTestDialog departmentId={activeId} />
                </Box>
              </Box>
            </Box>

            {isLoading && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={52} />
                ))}
              </Box>
            )}
            {isError && <Alert severity="error">Failed to load tests.</Alert>}
            {data && (
              <>
                <TestsTable tests={data.items} onEdit={setEditingTest} />
                <TablePagination
                  component="div"
                  count={data.totalCount}
                  page={page}
                  onPageChange={(_, p) => setPage(p)}
                  rowsPerPage={pageSize}
                  onRowsPerPageChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[25, 50, 100, 200]}
                  labelRowsPerPage="Per page"
                  sx={{
                    mt: 0.5,
                    "& .MuiTablePagination-toolbar": {
                      flexWrap: "wrap",
                      justifyContent: { xs: "space-between", sm: "flex-end" },
                      px: { xs: 0, sm: 1 },
                    },
                    "& .MuiTablePagination-spacer": { display: "none" },
                    // phone: keep only "1-25 of 120" and the arrows
                    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-input":
                      {
                        display: { xs: "none", sm: "flex" },
                      },
                  }}
                />
              </>
            )}
          </>
        )}
      </Paper>

      <EditTestDialog test={editingTest} onClose={() => setEditingTest(null)} />

      {/* popup: pick the departments this lab needs; "Close" is at the bottom */}
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
