"use client";

import { printSheet } from "@/lib/print-sheet";
import { OrderInvoiceDto } from "@/types/order";
import CloseIcon from "@mui/icons-material/Close";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import { Box, Button, Dialog, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {
  INVOICE_CSS,
  InvoiceSheet,
  PAPER_MM,
  PaperSize,
} from "./invoice-sheet";

const MM_TO_PX = 96 / 25.4;

/** The bill is always printed on A5 landscape. */
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
      setScale(Math.min(1, el.clientWidth / sheetW));
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
    <Box
      sx={{
        minHeight: "100%",
        p: { xs: 1, sm: 3 },
        background:
          "linear-gradient(135deg,#eef2ff 0%,#f5eefe 55%,#fdf2f8 100%)",
      }}
    >
      <style>{INVOICE_CSS}</style>

      <Box
        sx={{
          maxWidth: 1160,
          mx: "auto",
          p: { xs: 1.5, sm: 3 },
          borderRadius: { xs: 3, sm: 6 },
          bgcolor: "rgba(255,255,255,0.7)",
          boxShadow: "0 12px 40px rgba(80,70,160,0.15)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <PrintOutlinedIcon />
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Print Invoice
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
              A5 landscape, print-ready.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<CloseIcon fontSize="small" />}
            onClick={onClose}
            sx={{
              bgcolor: "#fff",
              color: "text.primary",
              borderRadius: 99,
              px: 3,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              "&:hover": { bgcolor: "#f3f4f6" },
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintOutlinedIcon fontSize="small" />}
            onClick={() =>
              sheetRef.current && printSheet(sheetRef.current, PAPER)
            }
            sx={{
              bgcolor: "#3b82f6",
              borderRadius: 99,
              px: 3,
              "&:hover": { bgcolor: "#2563eb" },
            }}
          >
            Print
          </Button>
        </Box>

        <Box
          sx={{
            p: { xs: 1, sm: 2 },
            borderRadius: { xs: 2, sm: 5 },
            bgcolor: "rgba(255,255,255,0.8)",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
            overflow: "auto",
          }}
        >
          <Box ref={boxRef} sx={{ width: "100%" }}>
            {/* Wrapper takes the scaled footprint so scrolling matches what is visible */}
            <Box
              sx={{
                width: sheetW * scale,
                height: (sheetH || PAPER_MM[PAPER].h * MM_TO_PX) * scale,
                mx: "auto",
                borderRadius: 3,
                boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
                overflow: "hidden",
                bgcolor: "#fff",
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
        </Box>
      </Box>
    </Box>
  );
}

/** "Generate Bill": opens the A5 landscape bill preview with Print + Close. */
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
