"use client";

import { Pill } from "@/components/report-builder/report-toolbar-ui";
import { useDeleteReportTemplate } from "@/hooks/use-report-builder";
import { ReportTemplateDto } from "@/types/report-builder";
import { Box, Button, Typography } from "@mui/material";
import { motion } from "framer-motion";

export function TemplatesCards({
  rows,
  showDeleted,
}: {
  rows: ReportTemplateDto[];
  showDeleted: boolean;
}) {
  const deleteTemplate = useDeleteReportTemplate();

  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {showDeleted ? "No deleted templates." : "No templates found."}
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2.5,
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, 1fr)",
          xl: "repeat(3, 1fr)",
        },
      }}
    >
      {rows.map((row, i) => (
        <motion.div
          key={row.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: Math.min(i, 12) * 0.03 }}
          style={{ display: "flex" }}
        >
          <Box
            sx={{
              flex: 1,
              borderRadius: "28px",
              p: 2.5,
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
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 1,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 15 }} noWrap>
                  {row.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 10.5,
                    color: "text.secondary",
                    fontWeight: 600,
                  }}
                >
                  {new Date(row.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Typography>
              </Box>
              <Pill tone={row.isDeleted ? "warning" : "success"}>
                {row.isDeleted ? "Trash" : "Active"}
              </Pill>
            </Box>

            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              <Pill tone="info">
                {row.sourceType === "UploadedDocument" ? "Uploaded" : "Manual"}
              </Pill>
            </Box>

            {!row.isDeleted && (
              <Box sx={{ mt: "auto" }}>
                <Button
                  fullWidth
                  onClick={() => deleteTemplate.mutate(row.id)}
                  disabled={deleteTemplate.isPending}
                  sx={{
                    borderRadius: "999px",
                    py: 1,
                    fontWeight: 800,
                    bgcolor: "error.light",
                    color: "error.main",
                    border: 1,
                    borderColor: "error.main",
                  }}
                >
                  Delete
                </Button>
              </Box>
            )}
          </Box>
        </motion.div>
      ))}
    </Box>
  );
}
