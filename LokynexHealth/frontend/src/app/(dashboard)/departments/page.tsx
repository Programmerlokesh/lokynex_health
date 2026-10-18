"use client";

import { CreateTestDialog } from "@/components/departments/create-test-dialog";
import { DepartmentList } from "@/components/departments/department-list";
import { getDeptMeta } from "@/components/departments/department-meta";
import { EditTestDialog } from "@/components/departments/edit-test-dialog";
import { TestsTable } from "@/components/departments/tests-table";
import { TestTubeIcon } from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { useDepartments, useTests } from "@/hooks/use-departments";
import { TestDto } from "@/types/department";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  alpha,
  Box,
  Chip,
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
  const [page, setPage] = useState(0); // MUI pagination is 0-based
  const [pageSize, setPageSize] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: departments } = useDepartments();

  // The chosen department, or (until the user picks one) the first by name,
  // so the tests panel is never empty. Derived — no effect needed.
  const activeDept = useMemo(() => {
    if (!departments || departments.length === 0) return null;
    return (
      departments.find((d) => d.id === selectedDeptId) ??
      [...departments].sort((a, b) => a.name.localeCompare(b.name))[0]
    );
  }, [departments, selectedDeptId]);
  const activeId = activeDept?.id ?? null;

  const totalTests = useMemo(
    () => (departments ?? []).reduce((sum, d) => sum + d.testCount, 0),
    [departments],
  );
  const activeCount = useMemo(
    () => (departments ?? []).filter((d) => d.status === "Active").length,
    [departments],
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
            <Chip size="small" label={`${departments.length} departments`} />
            <Chip size="small" label={`${totalTests} tests`} />
            <Chip
              size="small"
              color="success"
              variant="outlined"
              label={`${activeCount} active`}
            />
          </Box>
        )}
      </Box>

      {/* 1. department picker */}
      <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <DepartmentList
          selectedId={activeId}
          onSelect={handleSelectDepartment}
          onDeleted={(id) => {
            if (id === selectedDeptId) setSelectedDeptId(null);
          }}
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
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ py: 3, textAlign: "center" }}
          >
            Add a department first, then its tests will show up here.
          </Typography>
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
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      flexShrink: 0,
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: meta.color,
                      bgcolor: alpha(meta.color, 0.14),
                    }}
                  >
                    <meta.Icon size={22} strokeWidth={2} />
                  </Box>
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

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Search tests..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    width: { md: 260 },
                    flexGrow: { xs: 1, md: 0 },
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
    </Box>
  );
}
