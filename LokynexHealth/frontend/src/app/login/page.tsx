"use client";

import {
  EyeIcon,
  EyeOffIcon,
  MicroscopeIcon,
  SampleDropIcon,
  TestTubeIcon,
} from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { unifiedLoginApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth-store";
import { useSuperAdminAuthStore } from "@/store/superadmin-auth-store";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ONE login form for everyone. The API decides who signed in:
//   • SuperAdmin username + password  -> SuperAdmin session -> /superadmin/dashboard
//   • Lab user username + password    -> lab session        -> /dashboard
// A SuperAdmin login NEVER creates a lab session (and the API also rejects
// SuperAdmin tokens on every lab endpoint). A wrong username/password
// combination — including a lab username with the SuperAdmin's password —
// is simply "Invalid username or password".
function getLoginErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) {
      return "Cannot reach the server. Check that the API is running and your internet is working.";
    }
    const data = error.response.data as { errors?: string[] } | undefined;
    if (error.response.status === 401 || error.response.status === 400) {
      return data?.errors?.[0] ?? "Invalid username or password.";
    }
    if (error.response.status >= 500) {
      return "Server error. Please try again in a moment.";
    }
  }
  return "Something went wrong. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setSuperAdminAuth = useSuperAdminAuthStore((state) => state.setAuth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: unifiedLoginApi,
    onSuccess: (result) => {
      if (result.accountType === "SuperAdmin") {
        // A SuperAdmin must never carry a lab session: wipe any lab
        // session + cookie left over in this browser first.
        useAuthStore.getState().logout();
        document.cookie = "lokynex-token=; path=/; max-age=0";
        setSuperAdminAuth(result.token, result.name);
        router.push("/superadmin/dashboard");
      } else {
        // ...and a lab user must never carry a SuperAdmin session.
        useSuperAdminAuthStore.getState().logout();
        setAuth(result.token, {
          userId: result.userId,
          name: result.name,
          role: result.role,
          labName: result.labName ?? null,
        });
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `lokynex-token=${result.token}; path=/; max-age=3600; SameSite=Lax${secure}`;
        router.push("/dashboard");
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      {/* Left brand panel */}
      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          p: { md: 5, lg: 7 },
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(160deg, ${brand.navy} 0%, #0B3D7A 60%, ${brand.blue} 100%)`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 75% 20%, ${brand.cyan}33, transparent 55%)`,
            pointerEvents: "none",
          }}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, zIndex: 1 }}>
          <TestTubeIcon sx={{ color: brand.cyan, fontSize: 26 }} />
          <Typography sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
            LOKYNEX HEALTH
          </Typography>
        </Box>

        <Box sx={{ zIndex: 1, maxWidth: 420 }}>
          <Typography
            variant="h4"
            sx={{ mb: 2, lineHeight: 1.25, fontWeight: 700 }}
          >
            Precision lab management,{" "}
            <Box component="span" sx={{ color: brand.cyan }}>
              built right.
            </Box>
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            Orders, commissions, and reports — one dashboard for your entire lab
            network.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: { md: 2, lg: 4 },
            zIndex: 1,
            pt: 3,
            borderTop: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {[
            { icon: MicroscopeIcon, label: "340+ labs" },
            { icon: SampleDropIcon, label: "1.2M+ reports" },
            { icon: TestTubeIcon, label: "99.98% uptime" },
          ].map((s) => (
            <Box
              key={s.label}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <s.icon sx={{ fontSize: 20, color: brand.teal }} />
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.8)" }}
              >
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right form panel */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          bgcolor: "background.default",
          px: { xs: 2, sm: 4 },
          py: { xs: 3, sm: 4 },
          pt: "max(24px, var(--safe-top))",
          pb: "max(24px, var(--safe-bottom))",
        }}
      >
        {/* Phone e left panel hidden, tai chhoto brand mark */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            gap: 1,
          }}
        >
          <TestTubeIcon sx={{ color: brand.electricBlue, fontSize: 28 }} />
          <Typography
            sx={{ fontWeight: 700, letterSpacing: 0.5, color: "text.primary" }}
          >
            LOKYNEX HEALTH
          </Typography>
        </Box>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          style={{ width: "100%", maxWidth: 420 }}
        >
          <Card
            sx={{
              width: "100%",
              borderRadius: 3,
              boxShadow: "0 12px 32px rgba(23,43,77,0.08)",
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
              <Typography variant="h5" sx={{ mb: 0.5 }}>
                Welcome back
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3.5 }}
              >
                Sign in to continue.
              </Typography>

              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}
              >
                <TextField
                  label="Username"
                  autoComplete="username"
                  slotProps={{
                    htmlInput: { autoCapitalize: "none", spellCheck: false },
                  }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Password"
                  autoComplete="current-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                  size="small"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((v) => !v)}
                            edge="end"
                            size="small"
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <EyeOffIcon fontSize="small" />
                            ) : (
                              <EyeIcon fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                {loginMutation.isError && (
                  <Alert severity="error">
                    {getLoginErrorMessage(loginMutation.error)}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loginMutation.isPending}
                  sx={{
                    mt: 0.5,
                    py: 1.3,
                    background: `linear-gradient(90deg, ${brand.blue}, ${brand.electricBlue})`,
                    "&:hover": {
                      background: `linear-gradient(90deg, #0D47A1, ${brand.blue})`,
                    },
                  }}
                >
                  {loginMutation.isPending ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", textAlign: "center", mt: 3 }}
              >
                Protected by lab-grade encryption
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </Box>
  );
}
