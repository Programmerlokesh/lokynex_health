"use client";

import { OrderFlowIcon } from "@/components/icons/lab-icons";
import { OrderSummary } from "@/components/orders/order-summary";
import { TestSelector } from "@/components/orders/test-selector";
import { brand } from "@/components/providers/mui-theme-provider";
import { useBranches } from "@/hooks/use-branches";
import { useDebounce } from "@/hooks/use-debounce";
import { useDoctors, useReferrals } from "@/hooks/use-lookups";
import { useCreateOrder } from "@/hooks/use-orders";
import { OrderItemInput } from "@/types/order";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewOrderPage() {
  const router = useRouter();

  const [branchId, setBranchId] = useState<string | null>(null);
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Male");

  const [doctorSearch, setDoctorSearch] = useState("");
  const [referralSearch, setReferralSearch] = useState("");
  const debouncedDoctorSearch = useDebounce(doctorSearch, 350);
  const debouncedReferralSearch = useDebounce(referralSearch, 350);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [referralId, setReferralId] = useState<string | null>(null);

  const [items, setItems] = useState<OrderItemInput[]>([]);
  const [discountType, setDiscountType] = useState("Flat");
  const [discountValue, setDiscountValue] = useState("0");
  const [isComplimentary, setIsComplimentary] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paidAmount, setPaidAmount] = useState("0");

  const { data: branches } = useBranches({ pageSize: 100 });
  const { data: doctorResult } = useDoctors(debouncedDoctorSearch);
  const { data: referralResult } = useReferrals(debouncedReferralSearch);
  const createOrder = useCreateOrder();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!branchId || items.length === 0) return;

    createOrder.mutate(
      {
        patientPhone,
        patientAge: patientAge ? Number(patientAge) : undefined,
        patientGender,
        branchId,
        doctorId: doctorId ?? undefined,
        referralId: referralId ?? undefined,
        discountType,
        discountValue: Number(discountValue),
        isComplimentary,
        paymentMethod,
        paidAmount: Number(paidAmount),
        items: items.map((i) => ({
          testId: i.testId,
          technicianId: i.technicianId,
          doctorCommissionEnabled: i.doctorCommissionEnabled,
          referralCommissionEnabled: i.referralCommissionEnabled,
        })),
      },
      { onSuccess: () => router.push("/orders") },
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
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
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          New Order
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid size={8}>
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                Patient & Branch
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField
                    select
                    label="Branch"
                    size="small"
                    fullWidth
                    required
                    value={branchId ?? ""}
                    onChange={(e) => setBranchId(e.target.value)}
                  >
                    {branches?.items && branches.items.length > 0 ? (
                      branches.items.map((b) => (
                        <MenuItem key={b.id} value={b.id}>
                          {b.branchName}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="" disabled>
                        No branches available
                      </MenuItem>
                    )}
                  </TextField>
                </Grid>
                <Grid size={6}>
                  <TextField
                    label="Patient Phone"
                    size="small"
                    fullWidth
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    label="Age"
                    type="number"
                    size="small"
                    fullWidth
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    select
                    label="Gender"
                    size="small"
                    fullWidth
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                Doctor & Referral (optional)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Autocomplete
                    options={doctorResult?.items ?? []}
                    getOptionLabel={(d) => `${d.fullName} — ${d.phone}`}
                    onInputChange={(_, v) => setDoctorSearch(v)}
                    onChange={(_, v) => setDoctorId(v?.id ?? null)}
                    renderInput={(params) => (
                      <TextField {...params} label="Doctor" size="small" />
                    )}
                  />
                </Grid>
                <Grid size={6}>
                  <Autocomplete
                    options={referralResult?.items ?? []}
                    getOptionLabel={(r) => `${r.fullName} — ${r.phone}`}
                    onInputChange={(_, v) => setReferralSearch(v)}
                    onChange={(_, v) => setReferralId(v?.id ?? null)}
                    renderInput={(params) => (
                      <TextField {...params} label="Referral" size="small" />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                Tests
              </Typography>
              <TestSelector
                branchId={branchId}
                doctorId={doctorId}
                referralId={referralId}
                items={items}
                onChange={setItems}
              />
            </Paper>
          </Grid>

          <Grid size={4}>
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                Discount & Payment
              </Typography>

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
                <>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={6}>
                      <TextField
                        select
                        label="Discount Type"
                        size="small"
                        fullWidth
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                      >
                        <MenuItem value="Flat">Flat</MenuItem>
                        <MenuItem value="Percentage">Percentage</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={6}>
                      <TextField
                        label="Discount Value"
                        type="number"
                        size="small"
                        fullWidth
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    select
                    label="Payment Method"
                    size="small"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Card">Card</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                  </TextField>

                  <TextField
                    label="Paid Amount"
                    type="number"
                    size="small"
                    fullWidth
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </>
              )}
            </Paper>

            <Paper sx={{ p: 0, borderRadius: 3, overflow: "hidden" }}>
              <OrderSummary
                items={items}
                discountType={discountType}
                discountValue={Number(discountValue) || 0}
                isComplimentary={isComplimentary}
                paidAmount={Number(paidAmount) || 0}
              />
            </Paper>

            {createOrder.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Failed to create order. Check all required fields.
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 2 }}
              disabled={
                !branchId || items.length === 0 || createOrder.isPending
              }
            >
              {createOrder.isPending ? "Creating..." : "Create Order"}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
