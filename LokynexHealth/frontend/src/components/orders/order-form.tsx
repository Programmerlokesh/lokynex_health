"use client";

import { OrderFlowIcon } from "@/components/icons/lab-icons";
import { RAIL_WIDTH } from "@/components/layout/sidebar";
import { OrderSummary } from "@/components/orders/order-summary";
import { PatientSection } from "@/components/orders/patient-section";
import {
  PaymentRow,
  PaymentsEditor,
} from "@/components/orders/payments-editor";
import { PersonSearchSelect } from "@/components/orders/person-search-select";
import { TestDetailsDialog } from "@/components/orders/test-details-dialog";
import { TestSelector } from "@/components/orders/test-selector";
import { brand } from "@/components/providers/mui-theme-provider";
import { useBranches } from "@/hooks/use-branches";
import { useCreateOrder, useUpdateOrder } from "@/hooks/use-orders";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/lib/format";
import { computeTotals } from "@/lib/order-math";
import {
  buildPatientPayload,
  emptyPatientForm,
  normalizePhone,
  PatientFormState,
  subjectName,
  validatePatient,
} from "@/lib/patient-form";
import { LookupDto } from "@/types/lookup";
import { OrderEditDto, OrderItemInput } from "@/types/order";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

/** Turns the saved order into the form's own state so the edit screen opens pre-filled. */
function fromOrder(o: OrderEditDto) {
  const patient: PatientFormState = {
    phone: o.patient.phone,
    guardian: {
      id: o.patient.id,
      patientCode: o.patient.patientCode,
      fullName: o.patient.fullName,
      phone: o.patient.phone,
      age: o.patient.age,
      gender: o.patient.gender,
      address: o.patient.address,
      email: o.patient.email,
      relatives: o.patient.relatives,
    },
    name: "",
    age: "",
    gender: "Male",
    address: "",
    subject: o.relativeId
      ? { kind: "relative", relativeId: o.relativeId }
      : { kind: "guardian" },
  };
  const items: OrderItemInput[] = o.items.map((i) => ({
    testId: i.testId,
    testName: i.testName,
    departmentId: i.departmentId,
    departmentName: i.departmentName,
    price: i.price,
    referralCommissionType: i.referralCommissionType,
    referralCommissionValue: i.referralCommissionValue,
    technicianId: i.technicianId ?? undefined,
    doctorCommissionEnabled: i.doctorCommissionEnabled,
    referralCommissionEnabled: i.referralCommissionEnabled,
  }));
  const payments: PaymentRow[] = o.payments.length
    ? o.payments.map((p) => ({ method: p.method, amount: String(p.amount) }))
    : [{ method: "Cash", amount: "" }];
  return {
    patient,
    items,
    payments,
    doctor: (o.doctor as LookupDto | null) ?? null,
    referral: (o.referral as LookupDto | null) ?? null,
    discountType: o.discountType,
    discountValue: o.discountValue ? String(o.discountValue) : "",
    isComplimentary: o.isComplimentary,
  };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mb: { xs: 2, sm: 3 } }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

/**
 * The order form. Without `initial` it creates a new order; with `initial` (the
 * saved order) it edits it. One component, so both screens always behave alike.
 * Mount it with key={order.id} so a different order always starts from fresh state.
 */
export function OrderForm({ initial }: { initial?: OrderEditDto }) {
  const router = useRouter();
  const isEdit = !!initial;
  const seed = useMemo(() => (initial ? fromOrder(initial) : null), [initial]);

  const [branchOverride, setBranchOverride] = useState<string | null>(
    initial?.branchId ?? null,
  );
  const [patient, setPatient] = useState<PatientFormState>(
    seed?.patient ?? emptyPatientForm,
  );
  const [doctor, setDoctor] = useState<LookupDto | null>(seed?.doctor ?? null);
  const [referral, setReferral] = useState<LookupDto | null>(
    seed?.referral ?? null,
  );
  const [items, setItems] = useState<OrderItemInput[]>(seed?.items ?? []);
  const [discountType, setDiscountType] = useState(
    seed?.discountType ?? "Flat",
  );
  const [discountValue, setDiscountValue] = useState(seed?.discountValue ?? "");
  const [isComplimentary, setIsComplimentary] = useState(
    seed?.isComplimentary ?? false,
  );
  const [payments, setPayments] = useState<PaymentRow[]>(
    seed?.payments ?? [{ method: "Cash", amount: "" }],
  );
  const [detailsItem, setDetailsItem] = useState<OrderItemInput | null>(null);

  const { data: branchResult } = useBranches({ pageSize: 100 });
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const saveOrder = isEdit ? updateOrder : createOrder;

  // Active branches only, Main first (the API already orders it that way; the
  // sort keeps it right even if it ever changes).
  const branches = useMemo(
    () =>
      (branchResult?.items ?? [])
        .filter((b) => b.status === "Active")
        .sort((a, b) => Number(!!b.isMain) - Number(!!a.isMain)),
    [branchResult],
  );
  // Main branch is pre-selected without an effect: override ?? default.
  const branchId = branchOverride ?? branches[0]?.id ?? null;

  const paymentInputs = useMemo(
    () =>
      payments
        .map((p) => ({ method: p.method, amount: Number(p.amount) || 0 }))
        .filter((p) => p.amount > 0),
    [payments],
  );

  const totals = useMemo(
    () =>
      computeTotals({
        items,
        discountType,
        discountValue: Number(discountValue) || 0,
        isComplimentary,
        payments: isComplimentary ? [] : paymentInputs,
      }),
    [items, discountType, discountValue, isComplimentary, paymentInputs],
  );

  // ---- Doctor / referral: referral REPLACES doctor commission ----
  function handleDoctor(d: LookupDto | null) {
    setDoctor(d);
    if (!d) {
      setItems((prev) =>
        prev.map((i) => ({ ...i, doctorCommissionEnabled: false })),
      );
    }
  }
  function handleReferral(r: LookupDto | null) {
    setReferral(r);
    setItems((prev) =>
      prev.map((i) => ({
        ...i,
        doctorCommissionEnabled: false,
        referralCommissionEnabled: !!r,
      })),
    );
  }
  function handleBranch(id: string) {
    setBranchOverride(id);
    // Technicians belong to a branch.
    setItems((prev) => prev.map((i) => ({ ...i, technicianId: undefined })));
  }

  const validationError =
    validatePatient(patient) ??
    (!branchId ? "Select a branch." : null) ??
    (items.length === 0 ? "Add at least one test." : null) ??
    (!isComplimentary && totals.paid > totals.total + 0.0001
      ? "Paid amount cannot be more than the total."
      : null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validationError || !branchId) return;

    const payload = {
      ...buildPatientPayload(patient),
      branchId,
      doctorId: doctor?.id,
      referralId: referral?.id,
      discountType,
      discountValue: Number(discountValue) || 0,
      isComplimentary,
      payments: isComplimentary ? [] : paymentInputs,
      items: items.map((i) => ({
        testId: i.testId,
        technicianId: i.technicianId,
        doctorCommissionEnabled: !referral && i.doctorCommissionEnabled,
        referralCommissionEnabled: !!referral && i.referralCommissionEnabled,
      })),
    };

    // Straight to the order details / bill page.
    if (initial) {
      updateOrder.mutate(
        { id: initial.id, data: payload },
        { onSuccess: () => router.push(`/orders/${initial.id}`) },
      );
    } else {
      createOrder.mutate(payload, {
        onSuccess: ({ id }) => router.push(`/orders/${id}`),
      });
    }
  }

  const submitLabel = saveOrder.isPending
    ? isEdit
      ? "Saving..."
      : "Creating..."
    : isEdit
      ? "Save Changes"
      : "Create Order";
  const canSubmit = !validationError && !saveOrder.isPending;

  return (
    <Box sx={{ pb: { xs: 11, lg: 0 } /* room for the sticky mobile bar */ }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: { xs: 2, sm: 3 },
        }}
      >
        <Box
          sx={{
            bgcolor: "#FFEDD5",
            color: brand.orange,
            p: 1,
            borderRadius: 2,
            display: "flex",
          }}
        >
          <OrderFlowIcon fontSize="small" />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {isEdit ? `Edit Order ${initial.orderNumber}` : "New Order"}
        </Typography>
        {isEdit && (
          <Button component={Link} href={`/orders/${initial.id}`} size="small">
            Cancel
          </Button>
        )}
      </Box>

      <Box component="form" id="order-form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={{ xs: 0, lg: 3 }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Section title="Branch & Patient">
              <TextField
                select
                label="Branch"
                size="small"
                fullWidth
                required
                sx={{ mb: 2 }}
                value={branchId ?? ""}
                onChange={(e) => handleBranch(e.target.value)}
              >
                {branches.length === 0 && (
                  <MenuItem value="" disabled>
                    No branches available
                  </MenuItem>
                )}
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.branchName}
                    {b.isMain && (
                      <Chip
                        label="Main"
                        size="small"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </MenuItem>
                ))}
              </TextField>

              <PatientSection value={patient} onChange={setPatient} />
            </Section>

            <Section title="Doctor & Referral (optional)">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <PersonSearchSelect
                    kind="doctor"
                    value={doctor}
                    onChange={handleDoctor}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <PersonSearchSelect
                    kind="referral"
                    value={referral}
                    onChange={handleReferral}
                  />
                </Grid>
              </Grid>
              {referral && doctor && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  A referral is selected, so the doctor will not receive
                  commission on this order.
                </Alert>
              )}
            </Section>

            <Section title="Tests">
              <TestSelector
                branchId={branchId}
                doctor={doctor}
                referral={referral}
                items={items}
                onChange={setItems}
                onShowDetails={setDetailsItem}
              />
            </Section>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Box
              sx={{
                position: { lg: "sticky" },
                top: { lg: 88 },
                maxHeight: { lg: "calc(100dvh - 104px)" },
                overflowY: { lg: "auto" },
              }}
            >
              <Section title="Discount & Payment">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isComplimentary}
                      onChange={(e) => setIsComplimentary(e.target.checked)}
                    />
                  }
                  label="Complimentary (zero charge)"
                  sx={{ mb: 1 }}
                />

                {!isComplimentary && (
                  <Box sx={{ display: "grid", gap: 2 }}>
                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      }}
                    >
                      <TextField
                        select
                        label="Discount Type"
                        size="small"
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                      >
                        <MenuItem value="Flat">Flat</MenuItem>
                        <MenuItem value="Percentage">Percentage</MenuItem>
                      </TextField>
                      <TextField
                        label={
                          discountType === "Percentage"
                            ? "Discount %"
                            : "Discount"
                        }
                        type="number"
                        size="small"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        slotProps={{
                          htmlInput: {
                            min: 0,
                            step: "0.01",
                            inputMode: "decimal",
                          },
                        }}
                      />
                    </Box>
                    <PaymentsEditor
                      rows={payments}
                      total={totals.total}
                      onChange={setPayments}
                    />
                  </Box>
                )}
              </Section>

              <Paper sx={{ borderRadius: 3, overflow: "hidden", mb: 2 }}>
                <OrderSummary totals={totals} />
              </Paper>

              {saveOrder.isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {getApiErrorMessage(
                    saveOrder.error,
                    isEdit
                      ? "Failed to save changes."
                      : "Failed to create order.",
                  )}
                </Alert>
              )}
              {validationError &&
                (items.length > 0 ||
                  normalizePhone(patient.phone).length > 0) && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {validationError}
                  </Alert>
                )}

              {/* Desktop submit; phones use the sticky bar below */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={!canSubmit}
                sx={{ display: { xs: "none", lg: "inline-flex" } }}
              >
                {submitLabel}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Sticky bottom bar (phone + tablet) */}
      <Paper
        elevation={8}
        sx={{
          display: { xs: "flex", lg: "none" },
          position: "fixed",
          left: { xs: 0, md: `${RAIL_WIDTH}px` }, // clear the tablet icon rail
          right: 0,
          bottom: 0,
          zIndex: (t) => t.zIndex.appBar,
          alignItems: "center",
          gap: 2,
          px: 2,
          pt: 1.25,
          pb: "max(10px, env(safe-area-inset-bottom))",
          borderRadius: 0,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Total · Due {formatMoney(totals.due)}
          </Typography>
          <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
            {formatMoney(totals.total)}
          </Typography>
        </Box>
        <Button
          type="submit"
          form="order-form"
          variant="contained"
          size="large"
          disabled={!canSubmit}
          sx={{ flexShrink: 0, minHeight: 48, px: 3 }}
        >
          {submitLabel}
        </Button>
      </Paper>

      <TestDetailsDialog
        open={!!detailsItem}
        onClose={() => setDetailsItem(null)}
        item={detailsItem}
        patientName={subjectName(patient)}
        patientPhone={patient.phone}
        referral={referral}
      />
    </Box>
  );
}
