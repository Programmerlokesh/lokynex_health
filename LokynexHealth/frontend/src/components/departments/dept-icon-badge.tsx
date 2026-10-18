"use client";

import { Box } from "@mui/material";
import { alpha, lighten } from "@mui/material/styles";
import type { LucideIcon } from "lucide-react";

/**
 * Vivid department icon: white icon on a gradient colour box with a soft
 * coloured glow — much brighter than a pale tinted background.
 */
export function DeptIconBadge({
  Icon,
  color,
  size = 40,
}: {
  Icon: LucideIcon;
  color: string;
  size?: number;
}) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        background: `linear-gradient(135deg, ${lighten(color, 0.28)} 0%, ${color} 100%)`,
        boxShadow: `0 6px 14px -4px ${alpha(color, 0.65)}`,
      }}
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2.2} />
    </Box>
  );
}
