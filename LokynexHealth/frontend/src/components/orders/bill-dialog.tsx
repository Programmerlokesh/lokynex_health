"use client";

import { printSheet } from "@/lib/print-sheet";
import { OrderInvoiceDto } from "@/types/order";
import CloseIcon from "@mui/icons-material/Close";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";
import {
  INVOICE_CSS,
  InvoiceSheet,
  PAPER_MM,
  PaperSize,
} from "./invoice-sheet";

const MM_TO_PX = 96 / 25.4;

/**
 * "Generate Bill": step 1 picks the paper (A4 / A5), step 2 previews the exact
 * sheet with Print + Close in the top corner.
 */
export function BillDialog({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: OrderInvoiceDto;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [paper, setPaper] = useState<PaperSize>("A4");
  const [stage, setStage] = useState<"choose" | "preview">("choose");
  const [printedOn, setPrintedOn] = useState(() => new Date());

  const sheetRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [sheetH, setSheetH] = useState(0);

  const sheetW = PAPER_MM[paper].w * MM_TO_PX;

  // Shrink the real-size sheet to the available width (phones) — never enlarge.
  useEffect(() => {
    if (stage !== "preview") return;
    const el = boxRef.current;
    if (!el) return;
    const update = () => {
      setScale(Math.min(1, (el.clientWidth - 2) / sheetW));
      // A long test list makes the sheet taller than one page; follow its real height.
      setSheetH(sheetRef.current?.offsetHeight ?? 0);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (sheetRef.current) ro.observe(sheetRef.current);
    return () => ro.disconnect();
  }, [stage, sheetW, open]);

  function handleClose() {
    onClose();
    setTimeout(() => setStage("choose"), 200);
  }

  function handleGenerate() {
    setPrintedOn(new Date());
    setStage("preview");
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen || stage === "preview"}
      fullWidth
      maxWidth={stage === "choose" ? "xs" : false}
    >
      <style>{INVOICE_CSS}</style>

      {stage === "choose" ? (
        <>
          <DialogTitle sx={{ fontWeight: 700 }}>Generate Bill</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Which paper does your lab print on?
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              color="primary"
              value={paper}
              onChange={(_, v: PaperSize | null) => v && setPaper(v)}
            >
              <ToggleButton value="A4" sx={{ py: 2, flexDirection: "column" }}>
                <b>A4</b>
                <Typography variant="caption">210 × 297 mm</Typography>
              </ToggleButton>
              <ToggleButton value="A5" sx={{ py: 2, flexDirection: "column" }}>
                <b>A5</b>
                <Typography variant="caption">148 × 210 mm</Typography>
              </ToggleButton>
            </ToggleButtonGroup>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="contained" onClick={handleGenerate}>
              Generate bill
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: { xs: 1.5, sm: 3 },
              py: 1,
              borderBottom: 1,
              borderColor: "divider",
              position: "sticky",
              top: 0,
              bgcolor: "background.paper",
              zIndex: 1,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, flexGrow: 1 }}
              noWrap
            >
              Bill · {paper}
            </Typography>
            <Button
              variant="contained"
              startIcon={<PrintOutlinedIcon />}
              onClick={() =>
                sheetRef.current && printSheet(sheetRef.current, paper)
              }
            >
              Print Bill
            </Button>
            <IconButton aria-label="Close" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            ref={boxRef}
            sx={{
              flexGrow: 1,
              overflow: "auto",
              bgcolor: "action.hover",
              p: { xs: 1, sm: 3 },
            }}
          >
            {/* Wrapper takes the scaled footprint so scrolling matches what is visible */}
            <Box
              sx={{
                width: sheetW * scale,
                height: (sheetH || PAPER_MM[paper].h * MM_TO_PX) * scale,
                mx: "auto",
                boxShadow: 3,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  width: sheetW,
                }}
              >
                <InvoiceSheet
                  ref={sheetRef}
                  data={data}
                  paper={paper}
                  printedOn={printedOn}
                />
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Dialog>
  );
}
