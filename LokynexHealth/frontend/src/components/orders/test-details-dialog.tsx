"use client";

import { useEntityOverrides } from "@/hooks/use-commissions";
import { formatMoney } from "@/lib/format";
import { commissionAmount } from "@/lib/order-math";
import { LookupDto } from "@/types/lookup";
import { OrderItemInput } from "@/types/order";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        gap: 2,
        py: 0.75,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, textAlign: "right", minWidth: 0 }}
      >
        {value}
      </Typography>
    </Box>
  );
}

/**
 * Opens in place of the doctor-commission amount when a referral is chosen:
 * the doctor earns nothing on this order, so we show the full test details
 * for the patient instead.
 */
export function TestDetailsDialog({
  open,
  onClose,
  item,
  patientName,
  patientPhone,
  referral,
}: {
  open: boolean;
  onClose: () => void;
  item: OrderItemInput | null;
  patientName: string;
  patientPhone: string;
  referral: LookupDto | null;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // A commission set for THIS referral on this test beats the test default —
  // the same rule the server applies when the order is saved.
  const { data: overrides } = useEntityOverrides(
    "Referral",
    referral?.id ?? null,
  );
  if (!item) return null;

  const custom = overrides?.items.find((o) => o.testId === item.testId);
  const ruleType = custom?.commissionType ?? item.referralCommissionType;
  const ruleValue = custom?.commissionValue ?? item.referralCommissionValue;
  const referralAmount = commissionAmount(ruleType, ruleValue, item.price);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ fontWeight: 700 }}>Test details</DialogTitle>
      <DialogContent dividers>
        <Typography variant="overline" color="text.secondary">
          Patient
        </Typography>
        <Row label="Name" value={patientName || "—"} />
        <Row label="Phone" value={patientPhone || "—"} />

        <Divider sx={{ my: 1.5 }} />
        <Typography variant="overline" color="text.secondary">
          Test
        </Typography>
        <Row label="Test" value={item.testName} />
        <Row label="Department" value={item.departmentName || "—"} />
        <Row label="Price" value={formatMoney(item.price)} />

        <Divider sx={{ my: 1.5 }} />
        <Typography variant="overline" color="text.secondary">
          Referral
        </Typography>
        <Row label="Referred by" value={referral?.fullName ?? "—"} />
        <Row
          label="Commission rule"
          value={
            ruleType === "Percentage"
              ? `${ruleValue}% of price`
              : `Flat ${formatMoney(ruleValue)}`
          }
        />
        <Row
          label="Referral commission"
          value={
            item.referralCommissionEnabled
              ? formatMoney(referralAmount)
              : "Not applied"
          }
        />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1.5 }}
        >
          A referral is selected, so no doctor commission is paid on this order.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
