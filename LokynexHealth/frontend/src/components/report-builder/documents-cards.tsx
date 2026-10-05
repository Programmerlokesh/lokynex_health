"use client";

import { Pill } from "@/components/report-builder/report-toolbar-ui";
import { useDeleteReportDocument } from "@/hooks/use-report-builder";
import { ReportDocumentDto } from "@/types/report-builder";
import { Box, Button, Typography } from "@mui/material";
import { motion } from "framer-motion";

export function DocumentsCards({
  rows,
  showDeleted,
  onEdit,
}: {
  rows: ReportDocumentDto[];
  showDeleted: boolean;
  onEdit: (doc: ReportDocumentDto) => void;
}) {
  const deleteDocument = useDeleteReportDocument();

  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {showDeleted ? "No deleted documents." : "No documents found."}
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
                <Typography sx={{ fontWeight: 800, fontSize: 15 }}>
                  Order #{row.orderNumber}
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
              <Box
                sx={{
                  display: "flex",
                  gap: 0.75,
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <Pill tone={row.isDeleted ? "warning" : "success"}>
                  {row.isDeleted ? "Trash" : "Generated"}
                </Pill>
                {row.bodyContent && <Pill tone="info">Body ready</Pill>}
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                {row.patientName}
              </Typography>
              <Typography
                sx={{ fontSize: 11, color: "text.secondary", fontWeight: 600 }}
              >
                Test: {row.testName}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              <Pill>Header {row.headerContent ? "✓" : "–"}</Pill>
              <Pill>Body {row.bodyContent ? "✓" : "–"}</Pill>
              <Pill>Footer {row.footerContent ? "✓" : "–"}</Pill>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: row.isDeleted ? "1fr" : "1fr 1fr",
                gap: 1.25,
                mt: "auto",
              }}
            >
              {!row.isDeleted && (
                <>
                  <Button
                    onClick={() => onEdit(row)}
                    sx={{
                      borderRadius: "999px",
                      py: 1,
                      fontWeight: 800,
                      bgcolor: "background.paper",
                      color: "text.primary",
                      boxShadow: "0 1px 4px rgba(23,43,77,0.12)",
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => deleteDocument.mutate(row.id)}
                    disabled={deleteDocument.isPending}
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
                </>
              )}
              {row.isDeleted && (
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "text.secondary",
                    textAlign: "center",
                  }}
                >
                  Deleted document
                </Typography>
              )}
            </Box>
          </Box>
        </motion.div>
      ))}
    </Box>
  );
}
