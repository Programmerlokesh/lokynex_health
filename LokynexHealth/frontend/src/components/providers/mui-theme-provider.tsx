"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#1976D2", dark: "#0D47A1" },
    secondary: { main: "#00BFA6" },
    success: { main: "#16A34A", light: "#DCFCE7" },
    warning: { main: "#F59E0B", light: "#FEF3C7" },
    error: { main: "#EF4444", light: "#FEE2E2" },
    info: { main: "#0EA5E9", light: "#E0F2FE" },
    background: { default: "#F5F9FC", paper: "#FFFFFF" },
    text: { primary: "#172B4D", secondary: "#64748B" },
    divider: "#E2E8F0",
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "'Inter', sans-serif",
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
        root: { border: "1px solid #E2E8F0" },
      },
    },
  },
});

export const brand = {
  navy: "#062B5C",
  blue: "#1976D2",
  electricBlue: "#0EA5E9",
  teal: "#00BFA6",
  cyan: "#22D3EE",
  purple: "#7C3AED",
  orange: "#F97316",
};

export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
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
