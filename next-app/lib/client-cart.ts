import type { CartLine } from "@/lib/commerce/types";

const CART_KEY = "qc_cart_v1";
export const CART_CHANGE_EVENT = "qc-cart-changed";
const STORAGE_EVENT_NAME = "qc-cart-v1";

function emitChange(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  window.dispatchEvent(new CustomEvent(CART_CHANGE_EVENT, { detail: { lines, count } }));
  // Broadcast to other tabs
  window.dispatchEvent(new StorageEvent(STORAGE_EVENT_NAME, { key: CART_KEY, newValue: JSON.stringify(lines) }));
}

function parseCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (line): line is CartLine =>
          typeof line === "object" && line !== null && typeof line.productId === "string" && Number.isInteger(line.quantity) && line.quantity > 0
      )
      .map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        variantId: line.variantId || undefined,
        variantName: line.variantName || undefined,
        sku: line.sku || undefined,
        unitPrice: line.unitPrice !== undefined ? Number(line.unitPrice) : undefined,
      }));
  } catch {
    return [];
  }
}

export function getCartLines(): CartLine[] {
  if (typeof window === "undefined") return [];
  return parseCart(window.localStorage.getItem(CART_KEY));
}

export function getCartCount(): number {
  return getCartLines().reduce((s, l) => s + l.quantity, 0);
}

export function saveCartLines(lines: CartLine[]): CartLine[] {
  if (typeof window === "undefined") return lines;
  const normalized: CartLine[] = lines
    .filter((line) => typeof line.productId === "string" && Number.isInteger(line.quantity) && line.quantity > 0)
    .map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      variantId: line.variantId || undefined,
      variantName: line.variantName || undefined,
      sku: line.sku || undefined,
      unitPrice: line.unitPrice !== undefined ? Number(line.unitPrice) : undefined,
    }));
  window.localStorage.setItem(CART_KEY, JSON.stringify(normalized));
  emitChange(normalized);
  return normalized;
}

export function addToCart(line: CartLine): CartLine[] {
  const lines = getCartLines();
  const existing = lines.find((item) =>
    item.productId === line.productId &&
    (line.variantId ? item.variantId === line.variantId : !item.variantId)
  );
  if (existing) {
    existing.quantity = Math.max(1, existing.quantity + (Number.isInteger(line.quantity) ? line.quantity : 1));
  } else {
    lines.push({
      productId: line.productId,
      quantity: Math.max(1, line.quantity),
      variantId: line.variantId || undefined,
      variantName: line.variantName || undefined,
      sku: line.sku || undefined,
      unitPrice: line.unitPrice !== undefined ? Number(line.unitPrice) : undefined,
    });
  }
  return saveCartLines(lines);
}

export function updateCartLine(productId: string, quantity: number, variantId?: string): CartLine[] {
  const lines = getCartLines().map((item) => {
    const isMatch = variantId
      ? item.productId === productId && item.variantId === variantId
      : item.productId === productId && !item.variantId;
    return isMatch ? { ...item, quantity: Math.max(1, Number.isInteger(quantity) ? quantity : item.quantity) } : item;
  });
  return saveCartLines(lines);
}

export function removeFromCart(productId: string, variantId?: string): CartLine[] {
  const lines = getCartLines().filter((item) => {
    if (variantId) {
      return !(item.productId === productId && item.variantId === variantId);
    }
    return item.productId !== productId;
  });
  return saveCartLines(lines);
}

export function clearCart(): CartLine[] {
  return saveCartLines([]);
}

/** Subscribe to cart changes. Returns an unsubscribe function. */
export function subscribeCart(callback: (lines: CartLine[], count: number) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ lines: CartLine[]; count: number }>).detail;
    if (detail && Array.isArray(detail.lines)) {
      callback(detail.lines, detail.count ?? detail.lines.reduce((s, l) => s + l.quantity, 0));
    } else {
      const lines = getCartLines();
      callback(lines, lines.reduce((s, l) => s + l.quantity, 0));
    }
  };
  window.addEventListener(CART_CHANGE_EVENT, handler);
  const storageHandler = (event: StorageEvent) => {
    if (event.key === CART_KEY && event.newValue) {
      const lines = parseCart(event.newValue);
      callback(lines, lines.reduce((s, l) => s + l.quantity, 0));
    }
  };
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(CART_CHANGE_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
  };
}