"use client";

import { Avatar, EmptyState, kitCardSx } from "@/components/common/page-kit";
import { CommissionOverrideDto } from "@/types/commission";
import { Box, Chip, Typography } from "@mui/material";

const TYPE_COLOR: Record<string, string> = {
  Doctor: "#0EA5E9",
  Referral: "#7C3AED",
  Technician: "#00BFA6",
};

export function CommissionOverridesTable({
  rows,
}: {
  rows: CommissionOverrideDto[];
}) {
  if (rows.length === 0) return <EmptyState text="No overrides set yet." />;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, 1fr)",
          xl: "repeat(3, 1fr)",
        },
        gap: 1.5,
      }}
    >
      {rows.map((row) => {
        const pct = row.commissionType === "Percentage";
        return (
          <Box
            key={row.id}
            sx={{
              ...kitCardSx,
              p: 1.75,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderLeft: 4,
              borderLeftColor: TYPE_COLOR[row.entityType] ?? "divider",
            }}
          >
            <Avatar name={row.entityName} size={40} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14.5 }} noWrap>
                {row.entityName}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: "text.secondary" }} noWrap>
                {row.testName}
              </Typography>
              <Chip
                label={row.entityType}
                size="small"
                variant="outlined"
                sx={{ mt: 0.5, height: 20, fontSize: 11 }}
              />
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                {pct ? `${row.commissionValue}%` : `₹${row.commissionValue}`}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                {pct ? "of price" : "flat"}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}