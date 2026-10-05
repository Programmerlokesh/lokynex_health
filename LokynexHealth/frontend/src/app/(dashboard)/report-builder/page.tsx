"use client";

import { ReportIcon } from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { CreateTemplateDialog } from "@/components/report-builder/create-template-dialog";
import { DocumentsCards } from "@/components/report-builder/documents-cards";
import { DocumentsTable } from "@/components/report-builder/documents-table";
import { EditDocumentDialog } from "@/components/report-builder/edit-document-dialog";
import { GenerateDocumentDialog } from "@/components/report-builder/generate-document-dialog";
import { ReportFilters } from "@/components/report-builder/report-filters";
import {
  Pill,
  PillButton,
} from "@/components/report-builder/report-toolbar-ui";
import { TemplatesCards } from "@/components/report-builder/templates-cards";
import { TemplatesTable } from "@/components/report-builder/templates-table";
import {
  useReportDocuments,
  useReportTemplates,
} from "@/hooks/use-report-builder";
import {
  activeRange,
  countActiveFilters,
  filterDocuments,
  filterTemplates,
  initialReportFilters,
  QuickRange,
  rangeFor,
  ReportFilterState,
} from "@/lib/report-builder-filters";
import { ReportDocumentDto } from "@/types/report-builder";
import FilterListIcon from "@mui/icons-material/FilterList";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useMemo, useState } from "react";

type ViewMode = "cards" | "table";

export default function ReportBuilderPage() {
  const [tab, setTab] = useState<"templates" | "documents">("templates");
  const [showDeleted, setShowDeleted] = useState(false);
  const [view, setView] = useState<ViewMode>("cards");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [applied, setApplied] =
    useState<ReportFilterState>(initialReportFilters);
  const [editingDoc, setEditingDoc] = useState<ReportDocumentDto | null>(null);

  const { data: templates, isLoading: templatesLoading } =
    useReportTemplates(showDeleted);
  const { data: documents, isLoading: documentsLoading } = useReportDocuments({
    showDeleted,
    pageSize: 100,
  });

  const isTemplates = tab === "templates";
  const isLoading = isTemplates ? templatesLoading : documentsLoading;

  const templateRows = useMemo(
    () => filterTemplates(templates?.items ?? [], applied),
    [templates, applied],
  );
  const documentRows = useMemo(
    () => filterDocuments(documents?.items ?? [], applied),
    [documents, applied],
  );

  const found = isTemplates ? templateRows.length : documentRows.length;
  const total = isTemplates
    ? (templates?.totalCount ?? 0)
    : (documents?.totalCount ?? 0);
  const activeFilters = countActiveFilters(applied, isTemplates);
  const quick = activeRange(applied);

  // Pill stats
  const manualCount = templateRows.filter(
    (t) => t.sourceType === "Manual",
  ).length;
  const uploadedCount = templateRows.length - manualCount;
  const orderCount = new Set(documentRows.map((d) => d.orderNumber)).size;
  const testCount = new Set(documentRows.map((d) => d.testName)).size;

  function toggleQuick(r: QuickRange) {
    setApplied((a) =>
      quick === r
        ? { ...a, dateFrom: "", dateTo: "" }
        : { ...a, ...rangeFor(r) },
    );
  }

  function switchTab(next: "templates" | "documents") {
    setTab(next);
    setApplied(initialReportFilters);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* ───────── Header card: title, summary pills, mode buttons ───────── */}
      <Box
        sx={{
          borderRadius: "28px",
          p: { xs: 2, sm: 2.5 },
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          boxShadow: "0 8px 24px rgba(23,43,77,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              flexWrap: "wrap",
            }}
          >
            <Box
              sx={{
                bgcolor: "#FEF3C7",
                color: brand.orange,
                p: 1.1,
                borderRadius: "16px",
                display: "flex",
              }}
            >
              <ReportIcon fontSize="small" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mr: 0.5 }}>
              Report Builder
            </Typography>

            <Pill>{found} found</Pill>
            {total !== found && <Pill>of {total}</Pill>}
            {isTemplates ? (
              <>
                <Pill tone="info">Manual {manualCount}</Pill>
                <Pill tone="info">Uploaded {uploadedCount}</Pill>
              </>
            ) : (
              <>
                <Pill tone="info">Orders {orderCount}</Pill>
                <Pill tone="info">Tests {testCount}</Pill>
              </>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <PillButton
              active={tab === "templates"}
              onClick={() => switchTab("templates")}
            >
              Templates
            </PillButton>
            <PillButton
              active={tab === "documents"}
              onClick={() => switchTab("documents")}
            >
              Generated Documents
            </PillButton>
            <PillButton
              active={showDeleted}
              onClick={() => setShowDeleted((v) => !v)}
            >
              Deleted List
            </PillButton>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Pill tone={showDeleted ? "warning" : "success"}>
              {showDeleted ? "TRASH" : "ACTIVE"}
            </Pill>
            <Pill>Mode: {view.toUpperCase()}</Pill>
            <Pill tone={activeFilters ? "info" : "default"}>
              Filters: {activeFilters || "none"}
            </Pill>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <PillButton
              active={view === "cards"}
              onClick={() => setView("cards")}
            >
              Cards
            </PillButton>
            <PillButton
              active={view === "table"}
              onClick={() => setView("table")}
            >
              Table
            </PillButton>
            <PillButton
              active={quick === "today"}
              onClick={() => toggleQuick("today")}
            >
              Day
            </PillButton>
            <PillButton
              active={quick === "week"}
              onClick={() => toggleQuick("week")}
            >
              Week
            </PillButton>
            <PillButton
              active={quick === "month"}
              onClick={() => toggleQuick("month")}
            >
              Month
            </PillButton>
            <PillButton
              active={filtersOpen}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <FilterListIcon sx={{ fontSize: 14 }} />
              Filters
            </PillButton>
            {isTemplates ? (
              <CreateTemplateDialog />
            ) : (
              <GenerateDocumentDialog />
            )}
          </Box>
        </Box>
      </Box>

      {/* ───────── Filter panel ───────── */}
      <ReportFilters
        // re-mount when filters change from outside (Day/Week/Month, tab switch)
        key={`${tab}|${applied.dateFrom}|${applied.dateTo}|${applied.search}|${applied.source}`}
        open={filtersOpen}
        mode={tab}
        applied={applied}
        onApply={setApplied}
      />

      {/* ───────── List ───────── */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : isTemplates ? (
        view === "cards" ? (
          <TemplatesCards rows={templateRows} showDeleted={showDeleted} />
        ) : (
          <TemplatesTable rows={templateRows} showDeleted={showDeleted} />
        )
      ) : view === "cards" ? (
        <DocumentsCards
          rows={documentRows}
          showDeleted={showDeleted}
          onEdit={setEditingDoc}
        />
      ) : (
        <DocumentsTable
          rows={documentRows}
          showDeleted={showDeleted}
          onEdit={setEditingDoc}
        />
      )}

      <EditDocumentDialog
        key={editingDoc?.id ?? "closed"}
        document={editingDoc}
        onClose={() => setEditingDoc(null)}
      />
    </Box>
  );
}
