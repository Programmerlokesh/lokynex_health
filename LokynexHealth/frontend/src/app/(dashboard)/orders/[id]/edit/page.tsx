"use client";

import { OrderForm } from "@/components/orders/order-form";
import { useOrderPermissions } from "@/hooks/use-order-permissions";
import { useOrderForEdit } from "@/hooks/use-orders";
import { getApiErrorMessage } from "@/lib/api-error";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function EditOrderPage() {
  const params = useParams<{ id: string }>();
  const { canEdit } = useOrderPermissions();
  const { data, isLoading, isError, error } = useOrderForEdit(
    params.id ?? null,
  );

  if (!canEdit) {
    return (
      <Alert severity="warning">
        You do not have permission to edit orders.
      </Alert>
    );
  }
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (isError || !data) {
    return (
      <Alert severity="error">
        {getApiErrorMessage(error, "Failed to load order.")}
      </Alert>
    );
  }
  if (data.isDeleted) {
    return (
      <Alert
        severity="info"
        action={
          <Button component={Link} href={`/orders/${data.id}`} size="small">
            Open order
          </Button>
        }
      >
        This order is deleted. Restore it before editing.
      </Alert>
    );
  }

  // key => a different order always starts from fresh form state.
  return <OrderForm key={data.id} initial={data} />;
}
