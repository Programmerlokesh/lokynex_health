"use client";

import {
  createTheme,
  responsiveFontSizes,
  ThemeProvider,
} from "@mui/material/styles";

import { useThemeStore } from "@/store/theme-store";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
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

  const theme = createTheme({
    // xs 0-599 phone | sm 600-899 | md 900-1199 tablet | lg 1200-1535 laptop | xl 1536+
    breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
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
      MuiCssBaseline: {
        styleOverrides: {
          // touch device e: 16px input (iOS zoom bondho) + 44px tap target
          "@media (hover: none) and (pointer: coarse)": {
            ".MuiInputBase-input, .MuiSelect-select": { fontSize: 16 },
            ".MuiIconButton-root": { minWidth: 44, minHeight: 44 },
            ".MuiButton-root": { minHeight: 44 },
            ".MuiListItemButton-root": { minHeight: 48 },
            ".MuiCheckbox-root, .MuiRadio-root": { padding: 11 },
            ".MuiTab-root": { minHeight: 48 },
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: "none", fontWeight: 600, borderRadius: 8 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { border: `1px solid ${isDark ? "#243044" : "#E2E8F0"}` },
        },
      },

      // Table: page na, card er bhitore scroll hobe
      MuiTableContainer: {
        styleOverrides: {
          root: {
            width: "100%",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorX: "contain",
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: ({ theme }) => ({
            [theme.breakpoints.down("md")]: { whiteSpace: "nowrap" },
            [theme.breakpoints.down("sm")]: { padding: "10px 12px" },
          }),
          head: { fontWeight: 600 },
        },
      },

      // Dialog: phone e comfortable
      MuiDialog: {
        styleOverrides: {
          paper: ({ theme }) => ({
            [theme.breakpoints.down("sm")]: {
              margin: 12,
              width: "calc(100% - 24px)",
              maxWidth: "calc(100% - 24px)",
              maxHeight: "calc(100% - 24px)",
            },
          }),
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: ({ theme }) => ({
            [theme.breakpoints.down("sm")]: { padding: "16px 16px 8px" },
          }),
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: ({ theme }) => ({
            [theme.breakpoints.down("sm")]: { padding: "8px 16px" },
          }),
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: ({ theme }) => ({
            flexWrap: "wrap",
            gap: 8,
            [theme.breakpoints.down("sm")]: {
              padding: "12px 16px 16px !important",
              "& > :not(style) ~ :not(style)": { marginLeft: 0 },
              "& .MuiButton-root": { flex: "1 1 auto" },
            },
          }),
        },
      },

      // Tab beshi hole swipe korbe
      MuiTabs: {
        defaultProps: {
          variant: "scrollable",
          scrollButtons: "auto",
          allowScrollButtonsMobile: true,
        },
      },
      MuiTab: {
        styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
      },

      MuiTypography: {
        styleOverrides: { root: { overflowWrap: "break-word" } },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: { bottom: "calc(24px + env(safe-area-inset-bottom, 0px))" },
        },
      },
    },
  });

  return responsiveFontSizes(theme, { factor: 2.5 });
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
