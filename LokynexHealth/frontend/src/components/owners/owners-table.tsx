"use client";

import { OwnerFormDialog } from "@/components/owners/owner-form-dialog";
import { useSetOwnerStatus } from "@/hooks/use-owners";
import { formatDateTime } from "@/lib/format";
import { OwnerDto } from "@/types/owner";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

function OwnerActions({
  owner,
  onEdit,
  onToggle,
  onLedger,
}: {
  owner: OwnerDto;
  onEdit: () => void;
  onToggle: () => void;
  onLedger: () => void;
}) {
  const active = owner.status === "Active";
  return (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title="Ledger & P&L">
        <IconButton size="small" onClick={onLedger} aria-label="Ledger and P&L">
          <InsightsOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit">
        <IconButton size="small" onClick={onEdit} aria-label="Edit owner">
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={active ? "Deactivate" : "Activate"}>
        <IconButton
          size="small"
          color={active ? "error" : "success"}
          onClick={onToggle}
          aria-label={active ? "Deactivate owner" : "Activate owner"}
        >
          {active ? (
            <BlockOutlinedIcon fontSize="small" />
          ) : (
            <CheckCircleOutlineIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

const statusChip = (status: string) => (
  <Chip
    label={status}
    size="small"
    variant="outlined"
    color={status === "Active" ? "success" : "error"}
  />
);

export function OwnersTable({ rows }: { rows: OwnerDto[] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const setStatus = useSetOwnerStatus();

  const [editing, setEditing] = useState<OwnerDto | null>(null);
  const [toggling, setToggling] = useState<OwnerDto | null>(null);

  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No owners yet. Create one so your team can start adding labs.
      </Typography>
    );
  }

  const openLedger = (o: OwnerDto) =>
    router.push(`/superadmin/owners/${o.id}/ledger`);

  const confirmToggle = () => {
    if (!toggling) return;
    setStatus.mutate(
      {
        id: toggling.id,
        status: toggling.status === "Active" ? "Inactive" : "Active",
      },
      { onSettled: () => setToggling(null) },
    );
  };

  const toggleActive = toggling?.status === "Active";

  return (
    <>
      {isMobile ? (
        <Stack spacing={1.5}>
          {rows.map((o) => (
            <Card key={o.id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center" }}
              >
                <Avatar
                  src={o.profilePictureUrl ?? undefined}
                  sx={{ width: 44, height: 44 }}
                >
                  {o.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 700 }} noWrap>
                    {o.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    component="div"
                  >
                    {o.role} · @{o.username}
                  </Typography>
                </Box>
                {statusChip(o.status)}
              </Stack>
              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", mt: 1.5 }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body2">{o.phone}</Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="caption" color="text.secondary">
                    Labs added
                  </Typography>
                  <Typography variant="body2">{o.labCount}</Typography>
                </Box>
              </Stack>
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Since {formatDateTime(o.createdAt)}
                </Typography>
                <OwnerActions
                  owner={o}
                  onEdit={() => setEditing(o)}
                  onToggle={() => setToggling(o)}
                  onLedger={() => openLedger(o)}
                />
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                {[
                  "Owner",
                  "Role",
                  "Login ID",
                  "Phone",
                  "WhatsApp",
                  "Labs",
                  "Status",
                  "Created",
                ].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 600 }}>
                    {h}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={1.25}
                      sx={{ alignItems: "center" }}
                    >
                      <Avatar
                        src={o.profilePictureUrl ?? undefined}
                        sx={{ width: 32, height: 32, fontSize: 14 }}
                      >
                        {o.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {o.name}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{o.role}</TableCell>
                  <TableCell>{o.username}</TableCell>
                  <TableCell>{o.phone}</TableCell>
                  <TableCell>{o.whatsappNumber || "—"}</TableCell>
                  <TableCell>{o.labCount}</TableCell>
                  <TableCell>{statusChip(o.status)}</TableCell>
                  <TableCell>{formatDateTime(o.createdAt)}</TableCell>
                  <TableCell align="right">
                    <OwnerActions
                      owner={o}
                      onEdit={() => setEditing(o)}
                      onToggle={() => setToggling(o)}
                      onLedger={() => openLedger(o)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {editing && (
        <OwnerFormDialog
          key={editing.id}
          open
          owner={editing}
          onClose={() => setEditing(null)}
        />
      )}

      <Dialog open={!!toggling} onClose={() => setToggling(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {toggleActive ? "Deactivate owner?" : "Activate owner?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {toggleActive
              ? `${toggling?.name} will be signed out and will not be able to log in or add labs until you activate them again. Labs they already added are not affected.`
              : `${toggling?.name} will be able to log in and add labs again.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToggling(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={toggleActive ? "error" : "success"}
            onClick={confirmToggle}
            disabled={setStatus.isPending}
          >
            {toggleActive ? "Deactivate" : "Activate"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
