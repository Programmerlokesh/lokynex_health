"use client";

import {
  Avatar,
  EmptyState,
  kitCardSx,
  StatusPill,
} from "@/components/common/page-kit";
import { BranchDto } from "@/types/branch";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { EditBranchDialog } from "./edit-branch-dialog";

function Line({ icon, text }: { icon: React.ReactNode; text?: string | null }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "flex-start",
        color: "text.secondary",
        fontSize: 13,
        minWidth: 0,
      }}
    >
      <Box sx={{ display: "flex", mt: "2px" }}>{icon}</Box>
      <Typography sx={{ fontSize: 13, wordBreak: "break-word" }}>
        {text || "—"}
      </Typography>
    </Box>
  );
}

export function BranchesTable({ branches }: { branches: BranchDto[] }) {
  const [editing, setEditing] = useState<BranchDto | null>(null);

  if (branches.length === 0) return <EmptyState text="No branches found." />;

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, 1fr)",
            xl: "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
        {branches.map((b) => {
          const active = b.status === "Active";
          return (
            <Box
              key={b.id}
              sx={{
                ...kitCardSx,
                p: 2.25,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                borderLeft: 4,
                borderLeftColor: active ? "success.main" : "divider",
              }}
            >
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                <Avatar name={b.branchName} size={44} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}
                    noWrap
                  >
                    {b.branchName}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.75, mt: 0.5, flexWrap: "wrap" }}>
                    <Chip label={b.branchCode} size="small" variant="outlined" />
                    {b.isMain && (
                      <Chip label="Main" size="small" color="primary" />
                    )}
                  </Box>
                </Box>
                <Tooltip title="Edit branch">
                  <IconButton onClick={() => setEditing(b)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display: "grid", gap: 0.75 }}>
                <Line icon={<CallOutlinedIcon sx={{ fontSize: 16 }} />} text={b.branchPhone} />
                <Line icon={<MailOutlineIcon sx={{ fontSize: 16 }} />} text={b.branchEmail} />
                <Line
                  icon={<PlaceOutlinedIcon sx={{ fontSize: 16 }} />}
                  text={[b.branchAddress, b.branchPincode].filter(Boolean).join(" - ")}
                />
              </Box>

              <Box>
                <StatusPill active={active} label={b.status} />
              </Box>
            </Box>
          );
        })}
      </Box>

      <EditBranchDialog
        key={editing?.id ?? "closed"}
        branch={editing}
        open={!!editing}
        onClose={() => setEditing(null)}
      />
    </>
  );
}