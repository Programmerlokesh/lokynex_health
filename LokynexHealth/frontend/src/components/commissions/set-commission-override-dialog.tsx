"use client";

import { DepartmentCommissionEditor } from "@/components/commissions/department-commission-editor";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";

/**
 * "Set Override": pick Doctor / Referral / Technician, search the person,
 * choose a department - every test of that department then shows with its
 * rate, ready to edit and save in one go.
 */
export function SetCommissionOverrideDialog() {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
        sx={{ borderRadius: "999px", fontWeight: 700 }}
      >
        Set Override
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
        fullScreen={fullScreen}
        slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : "24px" } } }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: 3,
            pt: 2.5,
            pb: 1,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Set commission override
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overrides the test&apos;s default commission for one person.
            </Typography>
          </Box>
          <IconButton aria-label="Close" onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 1.5 }}>
          <DepartmentCommissionEditor />
        </DialogContent>
      </Dialog>
    </>
  );
}