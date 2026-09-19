"use client";

import { MotionConfig } from "framer-motion";

// OS er "reduce motion" setting sob framer-motion animation e apply hobe
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
