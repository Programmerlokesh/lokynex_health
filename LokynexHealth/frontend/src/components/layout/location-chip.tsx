"use client";

import { useUserLocation } from "@/hooks/use-user-location";
import LocationOffOutlinedIcon from "@mui/icons-material/LocationOffOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { Box, ButtonBase, CircularProgress, Tooltip } from "@mui/material";

// Shows the user's current place (from the browser's location permission)
// in the topbar. Text hides below `md` (icon only) so the bar never overflows.
export function LocationChip() {
  const { status, label, retry } = useUserLocation();

  if (status === "unsupported") return null;

  const isReady = status === "ready" && !!label;
  const canRetry = status === "denied" || status === "error";

  let text = "Locating…";
  let tip = "Detecting your location";
  if (isReady) {
    text = label;
    tip = `Your location: ${label}`;
  } else if (status === "denied") {
    text = "Location off";
    tip =
      "Location access is blocked. Click the lock icon in the browser address bar, allow Location, then click here.";
  } else if (status === "error") {
    text = "Retry location";
    tip = "Couldn't get your location. Click to try again.";
  }

  return (
    <Tooltip title={tip}>
      <ButtonBase
        onClick={canRetry ? retry : undefined}
        disabled={!canRetry && !isReady && status !== "loading"}
        aria-label={tip}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: { xs: 0.75, md: 1.25 },
          py: 0.5,
          minHeight: 32,
          borderRadius: 999,
          maxWidth: { xs: 40, md: 190 },
          cursor: canRetry ? "pointer" : "default",
          color: isReady ? "text.primary" : "text.secondary",
          bgcolor: (t) =>
            t.palette.mode === "dark"
              ? "rgba(255,255,255,0.06)"
              : "rgba(79,139,255,0.10)",
          "&:focus-visible": { outline: "2px solid #4F8BFF", outlineOffset: 2 },
        }}
      >
        {status === "loading" ? (
          <CircularProgress size={16} />
        ) : isReady || status === "error" ? (
          <LocationOnOutlinedIcon
            sx={{ fontSize: 18, color: isReady ? "#4F6BDB" : "inherit" }}
          />
        ) : (
          <LocationOffOutlinedIcon sx={{ fontSize: 18 }} />
        )}
        <Box
          component="span"
          sx={{
            display: { xs: "none", md: "block" },
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {text}
        </Box>
      </ButtonBase>
    </Tooltip>
  );
}
