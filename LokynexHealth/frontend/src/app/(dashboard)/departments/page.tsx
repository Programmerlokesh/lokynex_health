"use client";

import { CreateTestDialog } from "@/components/departments/create-test-dialog";
import { DepartmentList } from "@/components/departments/department-list";
import { TestsTable } from "@/components/departments/tests-table";
import { TestTubeIcon } from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { useTests } from "@/hooks/use-departments";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import { useState } from "react";

export default function DepartmentsPage() {
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  const { data, isLoading, isError } = useTests({
    departmentId: selectedDeptId ?? undefined,
    pageNumber: 1,
    pageSize: 50,
  });

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

      <Box sx={{ display: "flex", gap: 3 }}>
        <DepartmentList
          selectedId={selectedDeptId}
          onSelect={setSelectedDeptId}
        />

        <Divider orientation="vertical" flexItem />

        <Box sx={{ flex: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {selectedDeptId ? "Tests" : "Select a department to view tests"}
            </Typography>
            <CreateTestDialog departmentId={selectedDeptId} />
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
          {selectedDeptId && data && <TestsTable tests={data.items} />}
        </Box>
      </Box>
    </Box>
  );
}
