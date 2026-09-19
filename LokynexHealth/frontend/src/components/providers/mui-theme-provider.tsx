"use client";

import { useThemeStore } from "@/store/theme-store";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useEffect, useMemo } from "react";

// Brand colors stay fixed across light/dark — only backgrounds, paper and
// text swap, so the app's identity (navy sidebar, teal/orange accents) never
// changes, just what it sits on top of.
export const brand = {
  navy: "#062B5C",
  blue: "#1976D2",
  electricBlue: "#0EA5E9",
  teal: "#00BFA6",
  cyan: "#22D3EE",
  purple: "#7C3AED",
  orange: "#F97316",
};

const FONT_FAMILY = "var(--font-app), 'Public Sans', 'Inter', sans-serif";

function buildTheme(mode: "light" | "dark") {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: { main: "#1976D2", dark: "#0D47A1" },
      secondary: { main: "#00BFA6" },
      success: { main: "#16A34A", light: isDark ? "#14532D" : "#DCFCE7" },
      warning: { main: "#F59E0B", light: isDark ? "#78350F" : "#FEF3C7" },
      error: { main: "#EF4444", light: isDark ? "#7F1D1D" : "#FEE2E2" },
      info: { main: "#0EA5E9", light: isDark ? "#0C4A6E" : "#E0F2FE" },
      background: {
        default: isDark ? "#0B1220" : "#F5F9FC",
        paper: isDark ? "#111A2E" : "#FFFFFF",
      },
      text: {
        primary: isDark ? "#E7ECF3" : "#172B4D",
        secondary: isDark ? "#9AA7BD" : "#64748B",
      },
      divider: isDark ? "#243044" : "#E2E8F0",
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: FONT_FAMILY,
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: "none", fontWeight: 600, borderRadius: 8 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { border: `1px solid ${isDark ? "#243044" : "#E2E8F0"}` },
        },
      },
    },
  });
}

export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => buildTheme(mode), [mode]);

  // Keep Tailwind's `.dark` variant (used by shadcn/ui components) in sync
  // with the MUI theme, so both styling systems agree on the current mode.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  return (
    // AppRouterCacheProvider ensures Emotion's generated CSS class names are
    // injected in the SAME order on the server and the client — this is the
    // root cause fix for the hydration mismatch, not a workaround.
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
