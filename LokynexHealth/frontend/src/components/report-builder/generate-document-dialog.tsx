"use client";

import { useDebounce } from "@/hooks/use-debounce";
import {
  useGenerateReportDocument,
  useOrderItemsLookup,
  useReportTemplates,
} from "@/hooks/use-report-builder";
import { OrderItemLookupDto } from "@/types/report-builder";
import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useState } from "react";

export function GenerateDocumentDialog() {
  const [open, setOpen] = useState(false);
  const [orderItem, setOrderItem] = useState<OrderItemLookupDto | null>(null);
  const [orderItemSearch, setOrderItemSearch] = useState("");
  const debouncedSearch = useDebounce(orderItemSearch, 350);
  const [templateId, setTemplateId] = useState("");

  const { data: orderItems } = useOrderItemsLookup(debouncedSearch);
  const { data: templates } = useReportTemplates(false);
  const generateDocument = useGenerateReportDocument();

  function resetForm() {
    setOrderItem(null);
    setOrderItemSearch("");
    setTemplateId("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderItem || !templateId) return;

    generateDocument.mutate(
      { orderItemId: orderItem.id, templateId },
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
        Generate Document
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Generate Report Document
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {generateDocument.isError && (
              <Alert severity="error">
                Could not generate the document. Please try again.
              </Alert>
            )}

            <Autocomplete
              options={orderItems ?? []}
              getOptionLabel={(o) =>
                `${o.orderNumber} · ${o.testName} · ${o.patientName}`
              }
              onInputChange={(_, v) => setOrderItemSearch(v)}
              onChange={(_, v) => setOrderItem(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Order Item (search by order #, test, or patient)"
                  size="small"
                  required
                />
              )}
            />

            <TextField
              select
              label="Template"
              size="small"
              fullWidth
              required
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {templates?.items.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={generateDocument.isPending || !orderItem || !templateId}
            >
              {generateDocument.isPending ? "Generating..." : "Generate"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
