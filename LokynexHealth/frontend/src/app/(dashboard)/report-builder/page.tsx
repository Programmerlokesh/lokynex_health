"use client";

import { ReportIcon } from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { CreateTemplateDialog } from "@/components/report-builder/create-template-dialog";
import { DocumentsTable } from "@/components/report-builder/documents-table";
import { EditDocumentDialog } from "@/components/report-builder/edit-document-dialog";
import { GenerateDocumentDialog } from "@/components/report-builder/generate-document-dialog";
import { TemplatesTable } from "@/components/report-builder/templates-table";
import {
  useReportDocuments,
  useReportTemplates,
} from "@/hooks/use-report-builder";
import { ReportDocumentDto } from "@/types/report-builder";
import {
  Box,
  CircularProgress,
  FormControlLabel,
  Switch,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useState } from "react";

export default function ReportBuilderPage() {
  const [tab, setTab] = useState(0);
  const [showDeleted, setShowDeleted] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ReportDocumentDto | null>(null);

  const { data: templates, isLoading: templatesLoading } =
    useReportTemplates(showDeleted);
  const { data: documents, isLoading: documentsLoading } = useReportDocuments({
    showDeleted,
    pageSize: 50,
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Report Builder
          </Typography>
        </Box>
        {tab === 0 ? <CreateTemplateDialog /> : <GenerateDocumentDialog />}
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Templates" />
          <Tab label="Generated Documents" />
        </Tabs>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
            />
          }
          label="Show Trash"
        />
      </Box>

      {tab === 0 ? (
        templatesLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <TemplatesTable
            rows={templates?.items ?? []}
            showDeleted={showDeleted}
          />
        )
      ) : documentsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <DocumentsTable
          rows={documents?.items ?? []}
          showDeleted={showDeleted}
          onEdit={setEditingDoc}
        />
      )}

      <EditDocumentDialog
        document={editingDoc}
        onClose={() => setEditingDoc(null)}
      />
    </Box>
  );
}
