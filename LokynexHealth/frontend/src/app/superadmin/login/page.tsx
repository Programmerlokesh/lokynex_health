"use client";

import { useSuperAdminLogin } from "@/hooks/use-superadmin-auth";
import { useSuperAdminAuthStore } from "@/store/superadmin-auth-store";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Deliberately NOT styled like the tenant /login page (no gradient split
// screen, no lab branding) — this is a separate console for the platform
// owner, and should never look like "just another lab's login".
export default function SuperAdminLoginPage() {
  const router = useRouter();
  const isAuthenticated = useSuperAdminAuthStore((s) => s.isAuthenticated);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = useSuperAdminLogin();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/superadmin/dashboard");
    }
  }, [isAuthenticated, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate(
      { username, password },
      { onSuccess: () => router.push("/superadmin/dashboard") },
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#0B1220",
      }}
    >
      <Paper
        sx={{
          p: 4,
          width: 360,
          borderRadius: 3,
          bgcolor: "#111A2E",
          border: "1px solid #243044",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box
            sx={{
              bgcolor: "#1E293B",
              color: "#38BDF8",
              p: 1.5,
              borderRadius: "50%",
              display: "flex",
              mb: 1.5,
            }}
          >
            <LockOutlinedIcon />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#E7ECF3" }}>
            SuperAdmin Console
          </Typography>
          <Typography variant="caption" sx={{ color: "#9AA7BD" }}>
            Platform owner access only — not for lab staff
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {login.isError && (
            <Alert severity="error">Invalid username or password.</Alert>
          )}
          <TextField
            label="Username"
            size="small"
            fullWidth
            required
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            slotProps={{
              inputLabel: { sx: { color: "#9AA7BD" } },
            }}
            sx={{
              "& .MuiOutlinedInput-root": { color: "#E7ECF3" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#243044" },
            }}
          />
          <TextField
            label="Password"
            type="password"
            size="small"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            slotProps={{
              inputLabel: { sx: { color: "#9AA7BD" } },
            }}
            sx={{
              "& .MuiOutlinedInput-root": { color: "#E7ECF3" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#243044" },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={login.isPending}
            sx={{ bgcolor: "#0EA5E9", "&:hover": { bgcolor: "#0284C7" } }}
          >
            {login.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
