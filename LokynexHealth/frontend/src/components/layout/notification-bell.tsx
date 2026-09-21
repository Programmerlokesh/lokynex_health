"use client";

import {
  useMarkMyNotificationsRead,
  useMyNotifications,
} from "@/hooks/use-my-notifications";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Popover,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const { data, isLoading, isError } = useMyNotifications();
  const markRead = useMarkMyNotificationsRead();

  const unreadCount = data?.unreadCount ?? 0;
  const items = data?.items ?? [];

  // A lab user whose token carries no tenant gets a 401 from this endpoint.
  // Showing a broken bell would be worse than showing none, so hide it.
  if (isError) return null;

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsNoneOutlinedIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: 300, sm: 380 },
              maxHeight: 460,
              borderRadius: 3,
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Typography sx={{ fontWeight: 700 }}>Notifications</Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              disabled={markRead.isPending}
              onClick={() => markRead.mutate([])}
            >
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Nothing here yet.
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {items.map((n) => (
              <ListItemButton
                key={n.id}
                onClick={() => {
                  if (!n.isRead) markRead.mutate([n.id]);
                }}
                sx={{
                  alignItems: "flex-start",
                  gap: 1,
                  py: 1.25,
                  borderLeft: "3px solid",
                  borderColor: n.isRead ? "transparent" : "primary.main",
                  bgcolor: n.isRead ? "transparent" : "action.hover",
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      mb: 0.25,
                    }}
                  >
                    {n.isBroadcast && (
                      <CampaignOutlinedIcon
                        fontSize="inherit"
                        sx={{ color: "text.secondary" }}
                      />
                    )}
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: n.isRead ? 500 : 700 }}
                    >
                      {n.title}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="div"
                    sx={{ whiteSpace: "normal" }}
                  >
                    {n.message}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    component="div"
                    sx={{ mt: 0.5 }}
                  >
                    {timeAgo(n.createdAt)}
                  </Typography>
                </Box>
              </ListItemButton>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}
