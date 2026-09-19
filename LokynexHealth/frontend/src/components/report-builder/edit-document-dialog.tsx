"use client";

import { useUpdateReportDocument } from "@/hooks/use-report-builder";
import { ReportDocumentDto } from "@/types/report-builder";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

export function EditDocumentDialog({
  document,
  onClose,
}: {
  document: ReportDocumentDto | null;
  onClose: () => void;
}) {
  const [headerContent, setHeaderContent] = useState("");
  const [footerContent, setFooterContent] = useState("");
  const [bodyContent, setBodyContent] = useState("");

  const updateDocument = useUpdateReportDocument();

  useEffect(() => {
    if (!document) return;
    setHeaderContent(document.headerContent ?? "");
    setFooterContent(document.footerContent ?? "");
    setBodyContent(document.bodyContent ?? "");
  }, [document]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!document) return;

    updateDocument.mutate(
      {
        id: document.id,
        data: { headerContent, footerContent, bodyContent },
      },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Dialog open={!!document} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>
        {document?.orderNumber} · {document?.testName}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {updateDocument.isError && (
            <Alert severity="error">
              Could not save changes. Please try again.
            </Alert>
          )}

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
            minRows={6}
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
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={updateDocument.isPending}
          >
            {updateDocument.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
