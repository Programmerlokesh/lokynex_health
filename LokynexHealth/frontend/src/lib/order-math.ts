import { OrderItemInput, OrderPaymentInput } from "@/types/order";

/** Money is kept in whole paise during maths so 0.1 + 0.2 style drift never reaches the UI. */
const toPaise = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100);
const fromPaise = (p: number) => p / 100;

export interface OrderTotals {
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  due: number;
  status: "Open" | "Partial" | "Paid";
}

/** Single pass over the lines (O(n)); mirrors CreateOrderCommandHandler exactly. */
export function computeTotals(input: {
  items: OrderItemInput[];
  discountType: string;
  discountValue: number;
  isComplimentary: boolean;
  payments: OrderPaymentInput[];
}): OrderTotals {
  let grossP = 0;
  for (const i of input.items) grossP += toPaise(i.price);

  if (input.isComplimentary) {
    return {
      subtotal: fromPaise(grossP),
      discount: fromPaise(grossP),
      total: 0,
      paid: 0,
      due: 0,
      status: "Paid",
    };
  }

  const rawDiscountP =
    input.discountType === "Percentage"
      ? Math.round(grossP * (Math.max(0, input.discountValue) / 100))
      : toPaise(Math.max(0, input.discountValue));
  const discountP = Math.min(rawDiscountP, grossP);
  const totalP = grossP - discountP;

  let paidP = 0;
  for (const p of input.payments) paidP += toPaise(p.amount);

  const dueP = Math.max(0, totalP - paidP);
  const status =
    grossP > 0 && paidP >= totalP ? "Paid" : paidP > 0 ? "Partial" : "Open";

  return {
    subtotal: fromPaise(grossP),
    discount: fromPaise(discountP),
    total: fromPaise(totalP),
    paid: fromPaise(paidP),
    due: fromPaise(dueP),
    status: status as OrderTotals["status"],
  };
}

/** Commission a test pays out, from its rule (flat or % of price). */
export function commissionAmount(
  type: string,
  value: number,
  price: number,
): number {
  return fromPaise(
    type === "Percentage"
      ? Math.round(toPaise(price) * (value / 100))
      : toPaise(value),
  );
}
