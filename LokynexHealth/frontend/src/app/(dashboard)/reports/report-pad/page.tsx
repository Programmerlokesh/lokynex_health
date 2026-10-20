"use client";

import { ReportPadEditor } from "@/components/report-pad/report-pad-editor";
import { HeaderCard } from "@/components/reports/report-shell";
import { useLabReportSettings } from "@/hooks/use-blood-reports";
import { getApiErrorMessage } from "@/lib/api-error";
import { Alert, Box, Button, CircularProgress } from "@mui/material";

export default function ReportPadPage() {
  const q = useLabReportSettings();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <HeaderCard
        title="Report Pad"
        subtitle="Header, footer, blank space & pathologist signature of your lab reports"
        note="Applies to Blood / Lab Test Format reports (print, PDF and WhatsApp). Check the live preview, then save."
      />

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

      {q.data && <ReportPadEditor initial={q.data} />}
    </Box>
  );
}
