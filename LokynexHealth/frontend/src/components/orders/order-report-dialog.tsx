"use client";

import { printHtml } from "@/lib/order-report";
import CloseIcon from "@mui/icons-material/Close";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import {
  Box,
  Button,
  Dialog,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

/** Popup shown after "Download PDF": preview of the report + Print (Save as PDF). */
export function OrderReportDialog({
  open,
  onClose,
  html,
}: {
  open: boolean;
  onClose: () => void;
  html: string;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="lg"
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: { xs: 1.5, sm: 3 },
          py: 1,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
          Orders report
        </Typography>
        <Button
          variant="contained"
          startIcon={<PrintOutlinedIcon />}
          onClick={() => printHtml(html)}
        >
          Print / Save PDF
        </Button>
        <IconButton aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Phones scroll the wide preview sideways inside this box; the page itself never does. */}
      <Box
        sx={{
          overflow: "auto",
          bgcolor: "action.hover",
          p: { xs: 1, sm: 2 },
          height: { xs: "100%", md: "70vh" },
        }}
      >
        <Box
          component="iframe"
          title="Orders report preview"
          srcDoc={html}
          sx={{
            display: "block",
            width: "100%",
            minWidth: 900,
            height: "100%",
            minHeight: 480,
            border: 0,
            bgcolor: "#fff",
            boxShadow: 2,
          }}
        />
      </Box>
    </Dialog>
  );
}
