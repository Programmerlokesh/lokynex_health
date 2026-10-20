"use client";

import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";

const PAPER_W = 794; // A4 at 96 dpi
const PAPER_H = 1123;

interface Props {
  /** "letterhead" = print lab header/footer, "blank" = pre-printed pad */
  mode: "letterhead" | "blank";
  headerHtml: string;
  bodyHtml: string;
  footerHtml: string;
  headerMm: number;
  footerMm: number;
  hasHeader: boolean;
  hasFooter: boolean;
}

function Guide({ label, mm }: { label: string; mm: number }) {
  return (
    <Box
      sx={{
        height: `${mm}mm`,
        border: "1.5px dashed #9AA7BD",
        bgcolor: "rgba(79,139,255,0.06)",
        color: "#5B6B86",
        borderRadius: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontSize: 12,
        fontWeight: 700,
        px: 1,
      }}
    >
      {label}
    </Box>
  );
}

/** White A4 sheet, scaled down to fit narrow phone screens. */
export function ReportPadPreview({
  mode,
  headerHtml,
  bodyHtml,
  footerHtml,
  headerMm,
  footerMm,
  hasHeader,
  hasFooter,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    const paper = paperRef.current;
    if (!host || !paper) return;
    const update = () => {
      const s = Math.min(1, host.clientWidth / PAPER_W);
      setScale(s);
      setHeight(paper.scrollHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(host);
    ro.observe(paper);
    return () => ro.disconnect();
  }, []);

  return (
    <Box ref={hostRef} sx={{ width: "100%", overflow: "hidden" }}>
      <Box sx={{ height: height || "auto" }}>
        <Box
          ref={paperRef}
          sx={{
            width: PAPER_W,
            minHeight: PAPER_H,
            display: "flex",
            flexDirection: "column",
            bgcolor: "#fff",
            color: "#111",
            px: "10mm",
            py: "8mm",
            borderRadius: 2,
            boxShadow: "0 10px 40px rgba(20,40,80,.18)",
            transformOrigin: "top left",
            transform: `scale(${scale})`,
          }}
        >
          {/* header */}
          {mode === "blank" ? (
            <Guide
              label={`Pre-printed header area · ${headerMm} mm (nothing is printed here)`}
              mm={Math.max(headerMm, 8)}
            />
          ) : hasHeader ? (
            // header html is sanitized inside buildReportParts()
            <Box dangerouslySetInnerHTML={{ __html: headerHtml }} />
          ) : (
            <Guide label="No header yet — upload one on the left" mm={22} />
          )}

          {/* body (sample report) */}
          <Box
            sx={{ flex: 1, minHeight: 0 }}
            // body html escapes every dynamic value
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          {/* footer */}
          {mode === "blank" ? (
            <Guide
              label={`Pre-printed footer area · ${footerMm} mm (nothing is printed here)`}
              mm={Math.max(footerMm, 8)}
            />
          ) : hasFooter ? (
            <Box dangerouslySetInnerHTML={{ __html: footerHtml }} />
          ) : (
            <Guide label="No footer yet — upload one on the left" mm={16} />
          )}
        </Box>
      </Box>
    </Box>
  );
}
