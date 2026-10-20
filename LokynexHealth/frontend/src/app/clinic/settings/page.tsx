"use client";

import { PageTitle } from "@/components/clinic/clinic-shell";
import { useToast } from "@/components/clinic/clinic-ui";
import { useClinicMe, useClinicSettingsMutations } from "@/hooks/use-clinic";
import { getApiErrorMessage } from "@/lib/api-error";
import { fileToAvatarDataUrl } from "@/lib/image-utils";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";

const SWATCHES = [
  "#0E7C86",
  "#2563EB",
  "#7C3AED",
  "#BE185D",
  "#B45309",
  "#15803D",
  "#0F172A",
];

export default function ClinicSettingsPage() {
  const { toast, toastNode } = useToast();
  const { data: me } = useClinicMe();
  const { profile, password } = useClinicSettingsMutations();
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({
    tagline: "",
    address: "",
    phone: "",
    email: "",
    pincode: "",
    registrationNo: "",
    footerNote: "",
    accentColor: "#0E7C86",
    logoUrl: "",
  });
  const [pw, setPw] = useState({ current: "", next: "" });
  const loaded = useRef(false);

  useEffect(() => {
    if (!me || loaded.current) return;
    loaded.current = true;
    setF({
      tagline: me.tagline ?? "",
      address: me.address,
      phone: me.phone,
      email: me.email,
      pincode: me.pincode,
      registrationNo: me.registrationNo ?? "",
      footerNote: me.footerNote ?? "",
      accentColor: me.accentColor,
      logoUrl: me.logoUrl ?? "",
    });
  }, [me]);

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const txt = (
    k: keyof typeof f,
    label: string,
    extra: Record<string, unknown> = {},
  ) => (
    <TextField
      size="small"
      fullWidth
      label={label}
      value={f[k]}
      disabled={!me?.isAdmin}
      onChange={(e) => set(k, e.target.value)}
      {...extra}
    />
  );

  const pickLogo = async (file?: File) => {
    if (!file) return;
    try {
      set("logoUrl", await fileToAvatarDataUrl(file, 256));
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Could not use this image.",
        "error",
      );
    }
  };

  return (
    <>
      <PageTitle
        title="Clinic settings"
        subtitle="What is printed on every prescription"
      />
      <Box sx={{ display: "grid", gap: 2, maxWidth: 820 }}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1.5, sm: 2.5 },
            borderRadius: 4,
            display: "grid",
            gap: 1.5,
          }}
        >
          {!me?.isAdmin && (
            <Alert severity="info">
              Only the clinic admin can change these details.
            </Alert>
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={f.logoUrl || undefined}
              variant="rounded"
              sx={{ width: 64, height: 64, bgcolor: f.accentColor }}
            >
              {me?.clinicName?.[0]}
            </Avatar>
            {me?.isAdmin && (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => pickLogo(e.target.files?.[0])}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => fileRef.current?.click()}
                >
                  Upload logo
                </Button>
                {f.logoUrl && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => set("logoUrl", "")}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            )}
          </Box>
          {txt("tagline", "Tagline")}
          {txt("address", "Address")}
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            }}
          >
            {txt("phone", "Phone")}
            {txt("email", "Email")}
          </Box>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            }}
          >
            {txt("pincode", "Pincode")}
            {txt("registrationNo", "Clinic registration no.")}
          </Box>
          {txt(
            "footerNote",
            "Footer note (e.g. “Not valid for medico-legal purposes”)",
            { multiline: true, minRows: 2 },
          )}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700 }}
            >
              PRESCRIPTION COLOUR
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                mt: 0.5,
                flexWrap: "wrap",
              }}
            >
              {SWATCHES.map((c) => (
                <Box
                  key={c}
                  component="button"
                  type="button"
                  disabled={!me?.isAdmin}
                  onClick={() => set("accentColor", c)}
                  aria-label={`Colour ${c}`}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: c,
                    cursor: "pointer",
                    border:
                      f.accentColor === c
                        ? "3px solid"
                        : "2px solid transparent",
                    borderColor:
                      f.accentColor === c ? "text.primary" : "transparent",
                  }}
                />
              ))}
              <input
                type="color"
                value={f.accentColor}
                disabled={!me?.isAdmin}
                onChange={(e) => set("accentColor", e.target.value)}
                style={{ width: 40, height: 32, border: 0, background: "none" }}
                aria-label="Custom colour"
              />
            </Box>
          </Box>
          {me?.isAdmin && (
            <Box>
              <Button
                variant="contained"
                disabled={profile.isPending}
                onClick={() =>
                  profile.mutate(f, {
                    onSuccess: () => toast("Settings saved"),
                    onError: (e) => toast(getApiErrorMessage(e), "error"),
                  })
                }
              >
                Save settings
              </Button>
            </Box>
          )}
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1.5, sm: 2.5 },
            borderRadius: 4,
            display: "grid",
            gap: 1.5,
          }}
        >
          <Typography sx={{ fontWeight: 800 }}>Change my password</Typography>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            }}
          >
            <TextField
              size="small"
              type="password"
              label="Current password"
              value={pw.current}
              onChange={(e) =>
                setPw((p) => ({ ...p, current: e.target.value }))
              }
              autoComplete="current-password"
            />
            <TextField
              size="small"
              type="password"
              label="New password (min 8)"
              value={pw.next}
              onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
              autoComplete="new-password"
            />
          </Box>
          <Box>
            <Button
              variant="outlined"
              disabled={!pw.current || pw.next.length < 8 || password.isPending}
              onClick={() =>
                password.mutate(
                  { currentPassword: pw.current, newPassword: pw.next },
                  {
                    onSuccess: () => {
                      setPw({ current: "", next: "" });
                      toast("Password changed");
                    },
                    onError: (e) => toast(getApiErrorMessage(e), "error"),
                  },
                )
              }
            >
              Change password
            </Button>
          </Box>
        </Paper>
      </Box>
      {toastNode}
    </>
  );
}
