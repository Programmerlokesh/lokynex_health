import type { Theme } from "@mui/material/styles";

// ONE source of truth for the "new home page" look. The tenant home page,
// the slim home rail on inner pages and the SuperAdmin console all import
// from here, so the colour pattern never drifts between them.
// Font: nothing to do here — every screen inherits `--font-app` (Public Sans)
// from the root layout + MUI theme.

// light blue -> lavender -> soft pink (deep version for dark mode)
export const HOME_GRADIENT_LIGHT =
  "linear-gradient(135deg, #DCE8FF 0%, #EAE4FB 50%, #FBE8F4 100%)";
export const HOME_GRADIENT_DARK =
  "linear-gradient(135deg, #0B1220 0%, #141B36 50%, #1D1533 100%)";

export const homeGradient = (t: Theme) =>
  t.palette.mode === "dark" ? HOME_GRADIENT_DARK : HOME_GRADIENT_LIGHT;

// Accent colours used by the home page tiles / focus rings
export const HOME_ACCENT = "#4F8BFF";
export const HOME_ACCENT_TEXT = "#4F6BDB";
export const HOME_ACCENT_GRADIENT = "linear-gradient(135deg,#5B9BFF,#3B6FF5)";

// Frosted panel that wraps the rail and the card area
export const glassPanelSx = {
  bgcolor: (t: Theme) =>
    t.palette.mode === "dark"
      ? "rgba(17,26,46,0.55)"
      : "rgba(255,255,255,0.55)",
  backdropFilter: "blur(8px)",
  border: "1px solid",
  borderColor: "divider",
} as const;

// Solid-ish option card
export const homeCardSx = {
  display: "block",
  textDecoration: "none",
  color: "text.primary",
  p: { xs: 2, sm: 2.25 },
  borderRadius: { xs: "18px", sm: "20px" },
  bgcolor: (t: Theme) =>
    t.palette.mode === "dark"
      ? "rgba(17,26,46,0.85)"
      : "rgba(255,255,255,0.92)",
  border: "1px solid",
  borderColor: "divider",
  boxShadow: "0 8px 24px rgba(79,100,200,0.08)",
  minHeight: 88,
  transition: "box-shadow .2s ease, border-color .2s ease",
  "&:hover": {
    boxShadow: "0 14px 34px rgba(79,100,200,0.18)",
    borderColor: "#8FB0FF",
  },
  "&:focus-visible": { outline: `2px solid ${HOME_ACCENT}`, outlineOffset: 2 },
} as const;

// Row in the left rail (home page + SuperAdmin section rail)
export const railItemSx = (isActive: boolean) => ({
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  flexShrink: 0,
  cursor: "pointer",
  border: 0,
  font: "inherit",
  fontWeight: 700,
  fontSize: 14,
  color: "text.primary",
  textAlign: "left" as const,
  minHeight: 44,
  px: { xs: 1.5, md: 1.25 },
  py: { xs: 0.75, md: 1.1 },
  borderRadius: { xs: 999, md: "18px" },
  bgcolor: isActive
    ? (t: Theme) =>
        t.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "#fff"
    : "transparent",
  boxShadow: isActive ? "0 8px 22px rgba(79,100,200,0.16)" : "none",
  "&:hover": { bgcolor: isActive ? undefined : "rgba(255,255,255,0.5)" },
  "&:focus-visible": { outline: `2px solid ${HOME_ACCENT}`, outlineOffset: 2 },
});

// Rounded icon square inside a rail row
export const iconTileSx = (isActive: boolean) => ({
  width: 38,
  height: 38,
  borderRadius: "12px",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
  color: isActive ? "#fff" : HOME_ACCENT_TEXT,
  background: isActive ? HOME_ACCENT_GRADIENT : "rgba(255,255,255,0.75)",
  boxShadow: isActive ? "0 6px 14px rgba(59,111,245,0.35)" : "none",
});

// Frosted bar used by the Topbar and the slim home rail on every inner page,
// so the page gradient shows through exactly like on the home page.
// Blur is lighter on phones (cheaper to paint, avoids scroll jank).
export const glassBarSx = {
  bgcolor: (t: Theme) =>
    t.palette.mode === "dark" ? "rgba(11,18,32,0.55)" : "rgba(255,255,255,0.5)",
  backgroundImage: "none",
  backdropFilter: { xs: "blur(6px)", md: "blur(14px)" },
  WebkitBackdropFilter: { xs: "blur(6px)", md: "blur(14px)" },
} as const;

// Surface tokens reused by the MUI theme (Paper / Card / inputs / table head)
// so every tab's cards match the home-page option cards.
export const SURFACE = {
  paperLight: "rgba(255,255,255,0.92)",
  paperDark: "rgba(17,26,46,0.85)",
  shadowLight: "0 8px 24px rgba(79,100,200,0.08)",
  shadowDark: "0 8px 24px rgba(0,0,0,0.35)",
  inputLight: "rgba(255,255,255,0.75)",
  inputDark: "rgba(255,255,255,0.05)",
  headLight: "rgba(79,107,219,0.07)",
  headDark: "rgba(255,255,255,0.05)",
} as const;
