"use client";

import { CreateTestDialog } from "@/components/departments/create-test-dialog";
import { DepartmentList } from "@/components/departments/department-list";
import { EditTestDialog } from "@/components/departments/edit-test-dialog";
import { TestsTable } from "@/components/departments/tests-table";
import { TestTubeIcon } from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { useTests } from "@/hooks/use-departments";
import { TestDto } from "@/types/department";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

export default function DepartmentsPage() {
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [editingTest, setEditingTest] = useState<TestDto | null>(null);
  const [page, setPage] = useState(0); // MUI pagination is 0-based
  const [pageSize, setPageSize] = useState(50);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

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
      departmentId: selectedDeptId ?? undefined,
      search: search || undefined,
      pageNumber: page + 1,
      pageSize,
    },
    { enabled: !!selectedDeptId },
  );

  function handleSelectDepartment(id: string) {
    setSelectedDeptId(id);
    setPage(0);
    setSearchInput("");
    setSearch("");
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Departments & Tests
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
        }}
      >
        <DepartmentList
          selectedId={selectedDeptId}
          onSelect={handleSelectDepartment}
          onDeleted={(id) => {
            if (id === selectedDeptId) setSelectedDeptId(null);
          }}
        />

        <Divider
          orientation="vertical"
          flexItem
          sx={{ display: { xs: "none", md: "block" } }}
        />
        <Divider sx={{ display: { xs: "block", md: "none" } }} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1.5,
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {selectedDeptId
                ? `Tests${data ? ` (${data.totalCount})` : ""}`
                : "Select a department to view tests"}
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              {selectedDeptId && (
                <TextField
                  size="small"
                  placeholder="Search tests..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              )}
              <CreateTestDialog departmentId={selectedDeptId} />
            </Box>
          </Box>

          {!selectedDeptId && (
            <Typography variant="body2" color="text.secondary">
              Click a department on the left to see its tests.
            </Typography>
          )}

          {selectedDeptId && isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={26} />
            </Box>
          )}
          {selectedDeptId && isError && (
            <Alert severity="error">Failed to load tests.</Alert>
          )}
          {selectedDeptId && data && (
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
              />
            </>
          )}
        </Box>
      </Box>

      <EditTestDialog test={editingTest} onClose={() => setEditingTest(null)} />
    </Box>
  );
}