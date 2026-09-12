"use client";

import {
  EyeIcon,
  EyeOffIcon,
  MicroscopeIcon,
  SampleDropIcon,
  TestTubeIcon,
} from "@/components/icons/lab-icons";
import { brand } from "@/components/providers/mui-theme-provider";
import { loginApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth-store";
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
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      setAuth(data.token, {
        userId: data.userId,
        name: data.name,
        role: data.role,
      });
      document.cookie = `lokynex-token=${data.token}; path=/; max-age=3600`;
      router.push("/dashboard");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Left brand panel */}
      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          p: 7,
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
            gap: 4,
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
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#F5F9FC",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <Card
            sx={{
              width: 380,
              borderRadius: 3,
              boxShadow: "0 12px 32px rgba(23,43,77,0.08)",
            }}
          >
            <CardContent sx={{ p: 4.5 }}>
              <Typography variant="h5" sx={{ mb: 0.5 }}>
                Welcome back
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3.5 }}
              >
                Sign in to your lab dashboard.
              </Typography>

              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}
              >
                <TextField
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Password"
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
                  <Alert severity="error">Invalid username or password.</Alert>
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
