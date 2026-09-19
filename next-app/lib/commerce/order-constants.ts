// Pure constants and client-safe order definitions (Zero server/fs dependencies)

export const ORDER_VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled", "rejected"],
  confirmed: ["processing", "cancelled"],
  processing: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["out_for_delivery", "delivered", "returned"],
  out_for_delivery: ["delivered", "returned"],
  delivered: ["returned", "refunded"],
  returned: ["refunded"],
  cancelled: [],
  rejected: [],
  refunded: [],
  failed: ["pending"],
};

export const STANDARD_REJECTION_REASONS = [
  "Prescription Invalid or Unreadable",
  "Prescription Expired",
  "Item Out of Stock / Discontinued",
  "Delivery Location Not Serviceable",
  "Suspected Fraudulent / Duplicate Order",
  "Customer Cancellation Requested",
  "Pricing / Technical Error",
  "Other",
] as const;

export type StandardRejectionReason = (typeof STANDARD_REJECTION_REASONS)[number];

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "rejected",
  "refunded",
] as const;

export type OrderStatusType = (typeof ORDER_STATUSES)[number];
