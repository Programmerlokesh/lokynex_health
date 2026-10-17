"use client";

import { Box, Paper, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Measures an element's width so SVG charts can draw in real pixels (crisp text on phones). */
export function useContainerWidth<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width] as const;
}

/** useId() contains ":" which breaks url(#id) in some browsers. */
export function useSvgId() {
  return useId().replace(/[^a-zA-Z0-9]/g, "");
}

/** "Nice" axis (always includes zero). */
export function niceScale(min: number, max: number, target = 4) {
  let lo = Math.min(min, 0);
  let hi = Math.max(max, 0);
  if (hi === lo) hi = lo + 1;
  const rough = (hi - lo) / target;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) {
    ticks.push(Math.round(v / step) * step);
  }
  return { lo, hi, ticks };
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  delay = 0,
  sx,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  delay?: number;
  sx?: SxProps<Theme>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      style={{ height: "100%", minWidth: 0 }}
    >
      <Paper
        sx={[
          { p: { xs: 1.75, sm: 2.5 }, height: "100%" },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, lineHeight: 1.25 }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Box>
        {children}
      </Paper>
    </motion.div>
  );
}
