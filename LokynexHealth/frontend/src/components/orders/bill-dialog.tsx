"use client";

import { printSheet } from "@/lib/print-sheet";
import { OrderInvoiceDto } from "@/types/order";
import CloseIcon from "@mui/icons-material/Close";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import { Box, Button, Dialog, IconButton, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {
  INVOICE_CSS,
  InvoiceSheet,
  PAPER_MM,
  PaperSize,
} from "./invoice-sheet";

const MM_TO_PX = 96 / 25.4;

/** The bill is always printed on A5. */
const PAPER: PaperSize = "A5";

/**
 * Mounted only while the dialog is open, so `printedOn` is fresh every time a
 * bill is generated.
 */
function BillPreview({
  data,
  onClose,
}: {
  data: OrderInvoiceDto;
  onClose: () => void;
}) {
  const [printedOn] = useState(() => new Date());

  const sheetRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [sheetH, setSheetH] = useState(0);

  const sheetW = PAPER_MM[PAPER].w * MM_TO_PX;

  // Shrink the real-size sheet to the available width (phones) — never enlarge.
  useEffect(() => {
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
  }, [sheetW]);

  return (
    <>
      <style>{INVOICE_CSS}</style>

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
          Bill · A5
        </Typography>
        <Button
          variant="contained"
          startIcon={<PrintOutlinedIcon />}
          onClick={() =>
            sheetRef.current && printSheet(sheetRef.current, PAPER)
          }
        >
          Print Bill
        </Button>
        <IconButton aria-label="Close" onClick={onClose}>
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
            height: (sheetH || PAPER_MM[PAPER].h * MM_TO_PX) * scale,
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
              paper={PAPER}
              printedOn={printedOn}
            />
          </Box>
        </Box>
      </Box>
    </>
  );
}

/** "Generate Bill": opens the A5 bill preview with Print + Close in the top corner. */
export function BillDialog({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: OrderInvoiceDto;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <BillPreview data={data} onClose={onClose} />
    </Dialog>
  );
}
