"use client";

import { ReportIcon } from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

export const cardSx = {
  borderRadius: "28px",
  bgcolor: "background.paper",
  border: 1,
  borderColor: "divider",
  boxShadow: "0 8px 24px rgba(23,43,77,0.06)",
} as const;

/** Same header card as Report Builder: icon tile, title, subtitle, actions. */
export function HeaderCard({
  title,
  subtitle,
  note,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  note?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Box
      sx={{
        ...cardSx,
        p: { xs: 2, sm: 2.5 },
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "stretch", md: "center" },
        justifyContent: "space-between",
        gap: 1.5,
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}
      >
        <Box
          sx={{
            bgcolor: "#FEF3C7",
            color: brand.orange,
            p: 1.1,
            borderRadius: "16px",
            display: "flex",
            flexShrink: 0,
          }}
        >
          <ReportIcon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography
              sx={{ fontSize: 12, fontWeight: 600, wordBreak: "break-word" }}
            >
              {subtitle}
            </Typography>
          )}
          {note && (
            <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
              {note}
            </Typography>
          )}
        </Box>
      </Box>
      {actions && (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {actions}
        </Box>
      )}
    </Box>
  );
}

export const pillBtnSx = {
  borderRadius: "999px",
  px: 2.25,
  fontWeight: 800,
} as const;
