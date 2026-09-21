"use client";

import { LabSubscriptionSummary } from "@/types/super-admin";
import { Chip, ChipProps } from "@mui/material";

type Tone = "success" | "warning" | "error" | "default";

/**
 * Colour is driven by effectiveStatus + the expiring-soon flag, never by the
 * raw DB status: a row can still say "Active" days after it lapsed, because
 * nothing rewrites subscription rows on a schedule.
 */
export function subscriptionTone(
  subscription: LabSubscriptionSummary | null,
): Tone {
  if (!subscription) return "default";
  if (subscription.isExpired) return "error";
  if (subscription.isExpiringSoon) return "warning";
  if (subscription.effectiveStatus === "Cancelled") return "default";
  return "success";
}

export function subscriptionLabel(
  subscription: LabSubscriptionSummary | null,
): string {
  if (!subscription) return "No subscription";

  const { isExpired, daysRemaining, effectiveStatus } = subscription;

  if (effectiveStatus === "Cancelled") return "Cancelled";

  if (isExpired) {
    const days = Math.abs(daysRemaining);
    if (days === 0) return "Expired today";
    return `Expired ${days} ${days === 1 ? "day" : "days"} ago`;
  }

  if (daysRemaining === 0) return "Expires today";
  return `${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} left`;
}

export function SubscriptionChip({
  subscription,
  size = "small",
  variant = "outlined",
}: {
  subscription: LabSubscriptionSummary | null;
  size?: ChipProps["size"];
  variant?: ChipProps["variant"];
}) {
  return (
    <Chip
      label={subscriptionLabel(subscription)}
      size={size}
      variant={variant}
      color={subscriptionTone(subscription)}
      sx={{ fontWeight: 600 }}
    />
  );
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
