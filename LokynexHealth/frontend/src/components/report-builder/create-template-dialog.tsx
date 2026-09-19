"use client";

import { useDepartments } from "@/hooks/use-departments";
import { useCreateReportTemplate } from "@/hooks/use-report-builder";
import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

export function CreateTemplateDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [headerContent, setHeaderContent] = useState("");
  const [footerContent, setFooterContent] = useState("");
  const [bodyContent, setBodyContent] = useState("");

  const { data: departments } = useDepartments();
  const createTemplate = useCreateReportTemplate();

  function resetForm() {
    setName("");
    setDepartmentId("");
    setHeaderContent("");
    setFooterContent("");
    setBodyContent("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    createTemplate.mutate(
      {
        name,
        departmentId: departmentId || undefined,
        headerContent: headerContent || undefined,
        footerContent: footerContent || undefined,
        bodyContent: bodyContent || undefined,
        sourceType: "Manual",
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      },
    );
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
      >
        Create Template
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Create Report Template
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {createTemplate.isError && (
              <Alert severity="error">
                Could not create the template. Please try again.
              </Alert>
            )}

            <TextField
              label="Template Name"
              size="small"
              fullWidth
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <TextField
              select
              label="Department (optional)"
              size="small"
              fullWidth
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments?.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>

            <Typography variant="caption" color="text.secondary">
              Use merge fields like {"{{patient_name}}"}, {"{{test_name}}"},{" "}
              {"{{test_price}}"}, {"{{order_number}}"}, {"{{report_date}}"} —
              they&apos;re filled in automatically when a document is generated.
            </Typography>

            <TextField
              label="Header Content"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={headerContent}
              onChange={(e) => setHeaderContent(e.target.value)}
            />
            <TextField
              label="Body Content"
              size="small"
              fullWidth
              multiline
              minRows={4}
              value={bodyContent}
              onChange={(e) => setBodyContent(e.target.value)}
            />
            <TextField
              label="Footer Content"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={footerContent}
              onChange={(e) => setFooterContent(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createTemplate.isPending || !name}
            >
              {createTemplate.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
