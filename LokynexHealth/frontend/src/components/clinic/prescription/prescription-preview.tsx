"use client";

import { rxPreviewHtml, type RxParts } from "@/lib/clinic/prescription-html";
import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";

const PAPER_W = 794; // A4 at 96 dpi

/** Shows the prescription as a white A4 sheet, scaled down to fit narrow phone screens. */
export function PrescriptionPreview({ parts }: { parts: RxParts }) {
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
            minHeight: 1123,
            bgcolor: "#fff",
            color: "#111",
            px: "10mm",
            py: "6mm",
            borderRadius: 2,
            boxShadow: "0 10px 40px rgba(20,40,80,.18)",
            transformOrigin: "top left",
            transform: `scale(${scale})`,
          }}
          // every dynamic value is HTML-escaped inside buildRxParts()
          dangerouslySetInnerHTML={{ __html: rxPreviewHtml(parts) }}
        />
      </Box>
    </Box>
  );
}
