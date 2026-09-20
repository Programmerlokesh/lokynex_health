"use client";

import { useCreateLab } from "@/hooks/use-super-admin";
import { getApiErrorMessage } from "@/lib/api-error";
import { ExtendBranchInput } from "@/types/super-admin";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

const emptyBranch: ExtendBranchInput = {
  branchName: "",
  branchCode: "",
  branchAddress: "",
  branchPincode: "",
  branchPhone: "",
};

export function CreateLabDialog() {
  const [open, setOpen] = useState(false);

  const [primaryBranchName, setPrimaryBranchName] = useState("");
  const [primaryBranchAddress, setPrimaryBranchAddress] = useState("");
  const [primaryBranchPhone, setPrimaryBranchPhone] = useState("");
  const [primaryBranchEmail, setPrimaryBranchEmail] = useState("");
  const [primaryBranchPincode, setPrimaryBranchPincode] = useState("");

  const [adminName, setAdminName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [userLimit, setUserLimit] = useState("10");
  const [extendBranches, setExtendBranches] = useState<ExtendBranchInput[]>([]);

  const createLab = useCreateLab();

  function resetForm() {
    setPrimaryBranchName("");
    setPrimaryBranchAddress("");
    setPrimaryBranchPhone("");
    setPrimaryBranchEmail("");
    setPrimaryBranchPincode("");
    setAdminName("");
    setAdminPhone("");
    setAdminEmail("");
    setAdminUsername("");
    setAdminPassword("");
    setUserLimit("10");
    setExtendBranches([]);
  }

  function addExtraBranch() {
    setExtendBranches((prev) => [...prev, { ...emptyBranch }]);
  }

  function updateExtraBranch(index: number, patch: Partial<ExtendBranchInput>) {
    setExtendBranches((prev) =>
      prev.map((b, i) => (i === index ? { ...b, ...patch } : b)),
    );
  }

  function removeExtraBranch(index: number) {
    setExtendBranches((prev) => prev.filter((_, i) => i !== index));
  }

  const requiredFieldsFilled =
    primaryBranchName &&
    primaryBranchAddress &&
    primaryBranchPhone &&
    primaryBranchEmail &&
    primaryBranchPincode &&
    adminName &&
    adminPhone &&
    adminEmail &&
    adminUsername &&
    adminPassword;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!requiredFieldsFilled) return;

    createLab.mutate(
      {
        primaryBranchName,
        primaryBranchAddress,
        primaryBranchPhone,
        primaryBranchEmail,
        primaryBranchPincode,
        adminName,
        adminPhone,
        adminEmail,
        adminUsername,
        adminPassword,
        userLimit: Number(userLimit),
        extendBranches,
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      },
    );
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
      >
        Create Lab
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Provision New Lab (Tenant)
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {createLab.isError && (
              <Alert severity="error">
                {getApiErrorMessage(createLab.error, "Could not create the lab.")}
              </Alert>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Primary Branch
            </Typography>
            <TextField
              label="Branch Name"
              size="small"
              fullWidth
              required
              value={primaryBranchName}
              onChange={(e) => setPrimaryBranchName(e.target.value)}
            />
            <TextField
              label="Branch Address"
              size="small"
              fullWidth
              required
              value={primaryBranchAddress}
              onChange={(e) => setPrimaryBranchAddress(e.target.value)}
            />
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
              <TextField
                label="Branch Phone"
                size="small"
                fullWidth
                required
                slotProps={{ htmlInput: { maxLength: 20 } }}
                value={primaryBranchPhone}
                onChange={(e) => setPrimaryBranchPhone(e.target.value)}
              />
              <TextField
                label="Branch Pincode"
                size="small"
                fullWidth
                required
                slotProps={{ htmlInput: { maxLength: 10 } }}
                value={primaryBranchPincode}
                onChange={(e) => setPrimaryBranchPincode(e.target.value)}
              />
            </Box>
            <TextField
              label="Branch Email"
              type="email"
              size="small"
              fullWidth
              required
              value={primaryBranchEmail}
              onChange={(e) => setPrimaryBranchEmail(e.target.value)}
            />

            <Divider />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Admin Account
            </Typography>
            <TextField
              label="Admin Name"
              size="small"
              fullWidth
              required
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
            />
           <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
              <TextField
                label="Admin Phone"
                size="small"
                fullWidth
                required
                slotProps={{ htmlInput: { maxLength: 20 } }}
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
              />
              <TextField
                label="Admin Email"
                type="email"
                size="small"
                fullWidth
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </Box>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
              <TextField
                label="Admin Username"
                size="small"
                fullWidth
                required
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
              />
              <TextField
                label="Admin Password"
                type="password"
                size="small"
                fullWidth
                required
                slotProps={{ htmlInput: { minLength: 8 } }}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </Box>
            <TextField
              label="User Limit"
              type="number"
              size="small"
              fullWidth
              required
              value={userLimit}
              onChange={(e) => setUserLimit(e.target.value)}
            />

            <Divider />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Additional Branches (optional)
              </Typography>
              <Button size="small" onClick={addExtraBranch}>
                + Add Branch
              </Button>
            </Box>

            {extendBranches.map((branch, i) => (
              <Box
                key={i}
                sx={{
                  border: 1, borderColor: "divider",
                  borderRadius: 2,
                  p: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    label="Branch Name"
                    size="small"
                    fullWidth
                    required
                    slotProps={{ htmlInput: { maxLength: 150 } }}
                    value={branch.branchName}
                    onChange={(e) =>
                      updateExtraBranch(i, { branchName: e.target.value })
                    }
                  />
                  <TextField
                    label="Branch Code"
                    size="small"
                    fullWidth
                    required
                    slotProps={{ htmlInput: { maxLength: 20 } }}
                    value={branch.branchCode}
                    onChange={(e) =>
                      updateExtraBranch(i, { branchCode: e.target.value })
                    }
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeExtraBranch(i)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
                <TextField
                  label="Branch Address"
                  size="small"
                  fullWidth
                  value={branch.branchAddress}
                  onChange={(e) =>
                    updateExtraBranch(i, { branchAddress: e.target.value })
                  }
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    label="Pincode"
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { maxLength: 10 } }}
                    value={branch.branchPincode}
                    onChange={(e) =>
                      updateExtraBranch(i, { branchPincode: e.target.value })
                    }
                  />
                  <TextField
                    label="Phone"
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { maxLength: 20 } }}
                    value={branch.branchPhone}
                    onChange={(e) =>
                      updateExtraBranch(i, { branchPhone: e.target.value })
                    }
                  />
                </Box>
              </Box>
            ))}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createLab.isPending || !requiredFieldsFilled}
            >
              {createLab.isPending ? "Provisioning..." : "Create Lab"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}