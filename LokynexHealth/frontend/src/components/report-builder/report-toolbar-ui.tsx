"use client";

import { Box, ButtonBase } from "@mui/material";
import { ReactNode } from "react";

/** Small rounded info pill ("57 found", "Mode: CARDS"...). */
export function Pill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "info";
}) {
  const colors = {
    default: { bg: "action.hover", fg: "text.primary" },
    success: { bg: "success.light", fg: "success.main" },
    warning: { bg: "warning.light", fg: "warning.main" },
    info: { bg: "info.light", fg: "info.main" },
  }[tone];

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1.5,
        py: 0.6,
        borderRadius: "999px",
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
        bgcolor: colors.bg,
        color: colors.fg,
        boxShadow: "0 1px 2px rgba(23,43,77,0.06)",
      }}
    >
      {children}
    </Box>
  );
}

/** Pill-shaped button used for Cards / Table / Day / Week / Month / quick ranges. */
export function PillButton({
  children,
  active = false,
  onClick,
  variant = "soft",
  title,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  variant?: "soft" | "primary";
  title?: string;
}) {
  const primary = variant === "primary";
  return (
    <ButtonBase
      onClick={onClick}
      title={title}
      sx={{
        px: 2,
        py: 0.9,
        borderRadius: "999px",
        fontSize: 12,
        fontWeight: 700,
        gap: 0.75,
        transition: "all .15s ease",
        bgcolor: primary || active ? "primary.main" : "background.paper",
        color: primary || active ? "#fff" : "text.primary",
        boxShadow:
          primary || active
            ? "0 6px 16px rgba(25,118,210,0.30)"
            : "0 1px 3px rgba(23,43,77,0.10)",
        "&:hover": {
          bgcolor: primary || active ? "primary.dark" : "action.hover",
        },
      }}
    >
      {children}
    </ButtonBase>
  );
}
