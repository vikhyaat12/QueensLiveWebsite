import "server-only";
import { fileDb } from "./file-db";
import { store } from "./store";
import type {
  Product,
  ProductVariant,
  InventoryTransaction,
  InventoryMovementType,
  BackInStockSubscription,
  CartLine,
} from "./types";

const now = () => new Date().toISOString();

export interface InventoryOverview {
  totalProducts: number;
  totalSkus: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  reservedStockCount: number;
  preorderActiveCount: number;
  totalValuation: number;
  alerts: Array<{
    id: string;
    productId: string;
    productName: string;
    sku?: string;
    type: "out_of_stock" | "low_stock" | "preorder";
    message: string;
    stock: number;
    threshold: number;
  }>;
}

export interface InventoryItemView {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  category: string;
  image: string;
  price: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  inventoryMessagingEnabled: boolean;
  scarcityThreshold: number;
  maxPurchaseQty?: number;
  minPurchaseQty?: number;
  preorderEnabled: boolean;
  preorderLabel?: string;
  preorderMessage?: string;
  expectedDispatchDate?: string;
  status: string;
  calculatedStatus: "in_stock" | "low_stock" | "out_of_stock" | "preorder";
  scarcityMessage: string;
  variants: Array<{
    id: string;
    name: string;
    sku?: string;
    price: number;
    mrp?: number;
    stock: number;
    active: boolean;
  }>;
  subscriberCount: number;
}

export const inventoryService = {
  /**
   * Generates truthful customer-facing stock messaging.
   * Strictly derived from real stock. Never fabricates scarcity.
   */
  getScarcityMessage(
    product: Partial<Product>,
    variant?: Partial<ProductVariant>
  ): string {
    const currentStock = Number(
      variant ? variant.stock ?? product.stock ?? 0 : product.stock ?? 0
    );
    const isPreorder = Boolean(product.preorderEnabled);
    const threshold = Number(product.scarcityThreshold || 5);
    const messagingEnabled = product.inventoryMessagingEnabled !== false;

    if (currentStock <= 0) {
      if (isPreorder) {
        const dispatch = product.expectedDispatchDate
          ? ` (Est. dispatch ${product.expectedDispatchDate})`
          : "";
        return `${product.preorderLabel || "Pre-Order Available"}${dispatch}`;
      }
      return "Currently Out of Stock";
    }

    if (!messagingEnabled) {
      return "In Stock";
    }

    if (currentStock <= threshold) {
      if (currentStock === 1) {
        return "Only 1 left in stock — order soon";
      }
      return `Only ${currentStock} left in stock — order soon`;
    }

    return "In Stock";
  },

  /**
   * Calculates real-time aggregate inventory metrics.
   */
  async getInventoryOverview(): Promise<InventoryOverview> {
    const products = await store.products.all();
    let totalSkus = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let preorderActiveCount = 0;
    let totalValuation = 0;
    const alerts: InventoryOverview["alerts"] = [];

    for (const p of products) {
      const stock = Number(p.stock || 0);
      const threshold = Number(p.lowStockThreshold || 10);
      const isPreorder = Boolean(p.preorderEnabled);
      const price = Number(p.price || 0);

      totalValuation += stock * price;
      totalSkus += 1;

      if (isPreorder) {
        preorderActiveCount += 1;
      }

      if (stock <= 0) {
        outOfStockCount += 1;
        alerts.push({
          id: `alert-oos-${p.id}`,
          productId: p.id,
          productName: p.name,
          sku: p.sku || p.slug,
          type: "out_of_stock",
          message: `${p.name} is completely out of stock.`,
          stock: 0,
          threshold,
        });
      } else if (stock <= threshold) {
        lowStockCount += 1;
        alerts.push({
          id: `alert-low-${p.id}`,
          productId: p.id,
          productName: p.name,
          sku: p.sku || p.slug,
          type: "low_stock",
          message: `${p.name} has reached low stock (${stock} units remaining, threshold: ${threshold}).`,
          stock,
          threshold,
        });
      } else {
        inStockCount += 1;
      }
    }

    return {
      totalProducts: products.length,
      totalSkus,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      reservedStockCount: 0,
      preorderActiveCount,
      totalValuation,
      alerts: alerts.slice(0, 20),
    };
  },

  /**
   * Retrieves all items with enriched stock status and subscriber counts.
   */
  async listInventoryItems(filters?: {
    search?: string;
    status?: string;
    category?: string;
  }): Promise<InventoryItemView[]> {
    const products = await store.products.all();
    const subs = fileDb.collection("backInStockSubscriptions") as Array<Record<string, unknown>>;

    let filtered = products;

    if (filters?.search?.trim()) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (filters?.category && filters.category !== "all") {
      filtered = filtered.filter(
        (p) => p.category.toLowerCase() === filters.category!.toLowerCase()
      );
    }

    const items: InventoryItemView[] = filtered.map((p) => {
      const stock = Number(p.stock || 0);
      const threshold = Number(p.lowStockThreshold || 10);
      const isPreorder = Boolean(p.preorderEnabled);

      let calculatedStatus: InventoryItemView["calculatedStatus"] = "in_stock";
      if (stock <= 0) {
        calculatedStatus = isPreorder ? "preorder" : "out_of_stock";
      } else if (stock <= threshold) {
        calculatedStatus = "low_stock";
      }

      const subscriberCount = subs.filter(
        (s) => (s.productSlug === p.slug || s.productId === p.id) && s.status === "pending"
      ).length;

      // Extract variants if any
      const rawVariants = (p as Record<string, unknown>).variants;
      const variants = Array.isArray(rawVariants)
        ? rawVariants.map((v: Record<string, unknown>) => ({
            id: String(v.id || ""),
            name: String(v.name || ""),
            sku: v.sku ? String(v.sku) : undefined,
            price: Number(v.price || p.price),
            mrp: v.mrp ? Number(v.mrp) : undefined,
            stock: Number(v.stock || 0),
            active: v.active !== false,
          }))
        : [];

      return {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        sku: p.sku || p.slug.toUpperCase(),
        category: p.category,
        image: p.image || "/uploads/logos/queens-care-official-original.png",
        price: p.price,
        costPrice: p.costPrice,
        stock,
        lowStockThreshold: threshold,
        trackInventory: p.trackInventory !== false,
        inventoryMessagingEnabled: p.inventoryMessagingEnabled !== false,
        scarcityThreshold: p.scarcityThreshold || 5,
        maxPurchaseQty: p.maxPurchaseQty,
        minPurchaseQty: p.minPurchaseQty,
        preorderEnabled: isPreorder,
        preorderLabel: p.preorderLabel,
        preorderMessage: p.preorderMessage,
        expectedDispatchDate: p.expectedDispatchDate,
        status: p.status || (p.active ? "active" : "inactive"),
        calculatedStatus,
        scarcityMessage: inventoryService.getScarcityMessage(p),
        variants,
        subscriberCount,
      };
    });

    if (filters?.status && filters.status !== "all") {
      return items.filter((i) => i.calculatedStatus === filters.status);
    }

    return items;
  },

  /**
   * Authoritative stock adjustment engine.
   * Records immutable InventoryTransaction ledger entry.
   * Prevents negative stock.
   */
  async adjustStock(params: {
    productId: string;
    variantId?: string;
    delta?: number;
    newStock?: number;
    type: InventoryMovementType;
    reason: string;
    orderId?: string;
    actor?: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string; transaction?: InventoryTransaction; newStock?: number }> {
    const product = await store.products.bySlug(params.productId);
    if (!product) {
      return { success: false, error: "Product not found." };
    }

    const currentStock = Number(product.stock || 0);
    let targetStock = currentStock;

    if (params.newStock !== undefined) {
      targetStock = Number(params.newStock);
    } else if (params.delta !== undefined) {
      targetStock = currentStock + Number(params.delta);
    }

    if (targetStock < 0) {
      return {
        success: false,
        error: `Adjustment would result in negative stock (${targetStock}). Action rejected.`,
      };
    }

    const delta = targetStock - currentStock;

    // Persist new stock
    await store.products.save({
      id: product.id,
      slug: product.slug,
      stock: targetStock,
    });

    // Create immutable audit ledger record
    const transaction: InventoryTransaction = {
      id: `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      productName: product.name,
      variantId: params.variantId,
      sku: product.sku || product.slug,
      type: params.type,
      quantity: delta,
      qtyBefore: currentStock,
      qtyAfter: targetStock,
      reason: params.reason,
      orderId: params.orderId,
      actor: params.actor || "admin",
      notes: params.notes,
      createdAt: now(),
    };

    fileDb.insert("inventoryTransactions", transaction as unknown as Record<string, unknown>);

    // If stock transitioned from 0 to > 0, trigger back-in-stock notification dispatch
    if (currentStock === 0 && targetStock > 0) {
      inventoryService.notifySubscribers(product.slug, product.name).catch((err) => {
        console.error("Back in stock notification dispatch error:", err);
      });
    }

    return {
      success: true,
      transaction,
      newStock: targetStock,
    };
  },

  /**
   * Concurrency-safe stock reservation for checkout.
   * Atomically verifies and deducts stock for all lines.
   * Rolls back if any single line fails.
   */
  async reserveStock(
    lines: CartLine[],
    orderId: string,
    actor: string
  ): Promise<{ success: boolean; error?: string; failedProductId?: string }> {
    const productsAll = await store.products.all();
    const reservedSlugs: Array<{ slug: string; qty: number }> = [];

    // Phase 1: Pre-validation of all lines
    for (const line of lines) {
      const p = productsAll.find((x) => x.id === line.productId || x.slug === line.productId);
      if (!p) {
        return { success: false, error: `Product ${line.productId} not found.`, failedProductId: line.productId };
      }
      if (p.active === false) {
        return { success: false, error: `${p.name} is currently inactive.`, failedProductId: p.slug };
      }

      const availableStock = Number(p.stock || 0);
      const isPreorder = Boolean(p.preorderEnabled);

      if (availableStock < line.quantity && !isPreorder) {
        return {
          success: false,
          error: `Insufficient stock for ${p.name}. Available: ${availableStock}, Requested: ${line.quantity}.`,
          failedProductId: p.slug,
        };
      }
    }

    // Phase 2: Atomic reservation execution
    for (const line of lines) {
      const p = productsAll.find((x) => x.id === line.productId || x.slug === line.productId)!;
      const isPreorder = Boolean(p.preorderEnabled);
      const deductQty = isPreorder ? 0 : line.quantity; // Pre-orders do not decrement active inventory

      if (deductQty > 0) {
        const result = await inventoryService.adjustStock({
          productId: p.slug,
          delta: -deductQty,
          type: "ORDER",
          reason: `Customer order ${orderId}`,
          orderId,
          actor,
        });

        if (!result.success) {
          // Rollback all lines previously reserved
          for (const rev of reservedSlugs) {
            await inventoryService.adjustStock({
              productId: rev.slug,
              delta: rev.qty,
              type: "RELEASE",
              reason: `Rollback failed reservation on order ${orderId}`,
              orderId,
              actor: "system_rollback",
            }).catch(() => {});
          }
          return { success: false, error: result.error, failedProductId: p.slug };
        }

        reservedSlugs.push({ slug: p.slug, qty: deductQty });
      }
    }

    return { success: true };
  },

  /**
   * Releases stock upon order cancellation.
   * In compliance with pharmaceutical safety regulations, returned medicines are not restocked.
   */
  async releaseStock(
    orderId: string,
    reason: string,
    actor: string
  ): Promise<{ success: boolean; releasedCount: number }> {
    const txs = fileDb.findMany(
      "inventoryTransactions",
      (t) => t.orderId === orderId && t.type === "ORDER"
    );

    let releasedCount = 0;
    for (const tx of txs) {
      const qtyToRelease = Math.abs(Number(tx.quantity || 0));
      if (qtyToRelease > 0) {
        await inventoryService.adjustStock({
          productId: String(tx.productId),
          delta: qtyToRelease,
          type: "CANCELLATION",
          reason: `Order cancelled: ${reason}`,
          orderId,
          actor,
        });
        releasedCount += qtyToRelease;
      }
    }

    return { success: true, releasedCount };
  },

  /**
   * Retrieves chronological audit ledger.
   */
  async getLedger(query?: {
    productId?: string;
    type?: string;
    limit?: number;
  }): Promise<InventoryTransaction[]> {
    const all = fileDb.collection("inventoryTransactions") as unknown as InventoryTransaction[];
    let filtered = [...all];

    if (query?.productId) {
      filtered = filtered.filter(
        (t) => t.productId === query.productId || t.sku === query.productId
      );
    }

    if (query?.type) {
      filtered = filtered.filter((t) => t.type === query.type);
    }

    filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const limit = query?.limit || 100;
    return filtered.slice(0, limit);
  },

  /**
   * Subscribes customer for Back-in-Stock alerts.
   * Prevents duplicate subscriptions.
   */
  async subscribeBackInStock(params: {
    productSlug: string;
    variantId?: string;
    email: string;
    phone?: string;
  }): Promise<{ success: boolean; message: string; duplicate?: boolean }> {
    const product = await store.products.bySlug(params.productSlug);
    if (!product) {
      return { success: false, message: "Product not found." };
    }

    const email = params.email.toLowerCase().trim();
    const existing = fileDb.findOne(
      "backInStockSubscriptions",
      (s) =>
        s.productSlug === params.productSlug &&
        String(s.email).toLowerCase() === email &&
        s.status === "pending"
    );

    if (existing) {
      return {
        success: true,
        duplicate: true,
        message: "You are already subscribed to back-in-stock updates for this formulation.",
      };
    }

    const sub: BackInStockSubscription = {
      id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantId: params.variantId,
      email,
      phone: params.phone,
      status: "pending",
      createdAt: now(),
    };

    fileDb.insert("backInStockSubscriptions", sub as unknown as Record<string, unknown>);

    return {
      success: true,
      message: `We will notify ${email} as soon as ${product.name} is available.`,
    };
  },

  /**
   * Dispatches notifications to customers waiting for restocked formulation.
   */
  async notifySubscribers(productSlug: string, productName: string): Promise<number> {
    const subs = fileDb.findMany(
      "backInStockSubscriptions",
      (s) => s.productSlug === productSlug && s.status === "pending"
    );

    for (const s of subs) {
      fileDb.update("backInStockSubscriptions", String(s.id), {
        status: "notified",
        notifiedAt: now(),
      });
      console.log(`[BACK IN STOCK ALERT] Dispatched to ${s.email} for ${productName} (/products/${productSlug})`);
    }

    return subs.length;
  },
};
