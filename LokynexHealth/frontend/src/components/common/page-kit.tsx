"use client";

import SearchIcon from "@mui/icons-material/Search";
import { Box, InputAdornment, TextField, Typography } from "@mui/material";
import type { ReactNode } from "react";

export const kitCardSx = {
  borderRadius: "20px",
  bgcolor: "background.paper",
  border: 1,
  borderColor: "divider",
  boxShadow: "0 6px 20px rgba(23,43,77,0.05)",
} as const;

/** Page title row: coloured icon tile, title, subtitle, right-side actions. */
export function PageHeader({
  icon,
  tint = "#E0F2FE",
  color = "#0EA5E9",
  title,
  subtitle,
  actions,
}: {
  icon: ReactNode;
  tint?: string;
  color?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        flexDirection: { xs: "column", sm: "row" },
        gap: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        <Box
          sx={{
            bgcolor: tint,
            color,
            width: 46,
            height: 46,
            borderRadius: "14px",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {actions && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>{actions}</Box>
      )}
    </Box>
  );
}

/** Row of small count tiles (Total / Active / ...). */
export function StatStrip({
  items,
}: {
  items: { label: string; value: ReactNode; color?: string }[];
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: `repeat(${Math.min(items.length, 4)}, 1fr)`,
        },
        gap: 1.5,
      }}
    >
      {items.map((s) => (
        <Box key={s.label} sx={{ ...kitCardSx, px: 2, py: 1.5 }}>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            {s.label}
          </Typography>
          <Typography
            sx={{ fontSize: 24, fontWeight: 800, color: s.color ?? "text.primary" }}
          >
            {s.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  maxWidth = 420,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxWidth?: number;
}) {
  return (
    <TextField
      placeholder={placeholder}
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{
        width: "100%",
        maxWidth,
        "& .MuiOutlinedInput-root": {
          borderRadius: "14px",
          bgcolor: "background.paper",
        },
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

const AVATAR_COLORS = [
  "#0EA5E9",
  "#7C3AED",
  "#F97316",
  "#00BFA6",
  "#EF4444",
  "#1976D2",
  "#D946EF",
  "#16A34A",
];

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?";
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const bg = AVATAR_COLORS[h % AVATAR_COLORS.length];
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: bg,
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {initials}
    </Box>
  );
}

export function StatusPill({ active, label }: { active: boolean; label?: string }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        px: 1.1,
        py: 0.25,
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 700,
        bgcolor: active ? "success.light" : "action.hover",
        color: active ? "success.main" : "text.secondary",
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: active ? "success.main" : "text.disabled",
        }}
      />
      {label ?? (active ? "Active" : "Inactive")}
    </Box>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <Box sx={{ ...kitCardSx, p: 4, textAlign: "center" }}>
      <Typography color="text.secondary">{text}</Typography>
    </Box>
  );
}