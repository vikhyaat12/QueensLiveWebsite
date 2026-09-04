import { store } from "../lib/commerce/store.js";
import { fileDb } from "../lib/commerce/file-db.js";

async function run() {
  console.log("Testing review purchase verification...");

  // 1. Create a review for user without an order
  const r1 = await store.reviews.create({
    productId: "lumine-c-serum",
    customerEmail: "random-shopper@example.com",
    customerName: "Random Shopper",
    rating: 4,
    title: "Very nice",
    body: "Tried a sample and liked the non-greasy finish.",
  });
  console.log("Review without order verified status:", r1.verified);
  if (r1.verified !== false) {
    throw new Error("Expected r1.verified to be false!");
  }

  // 2. Create a test order for a buyer, then create review
  const testOrderId = `QC-TEST-${Date.now()}`;
  const buyerEmail = "verified.buyer@queenscare.in";
  fileDb.insert("orders", {
    id: testOrderId,
    status: "delivered",
    userId: "usr-buyer-verified",
    lines: [{ productId: "lumine-c-serum", quantity: 1, unitPrice: 1550 }],
    shipping: { email: buyerEmail, fullName: "Dr. Sunita Rao" },
    createdAt: new Date().toISOString(),
  });

  const r2 = await store.reviews.create({
    productId: "lumine-c-serum",
    customerEmail: buyerEmail,
    customerName: "Dr. Sunita Rao",
    rating: 5,
    title: "Clinically stable ascorbic formulation",
    body: "Consistent barrier tolerance and zero oxidation over 4 weeks.",
  });
  console.log("Review WITH delivered order verified status:", r2.verified);
  if (r2.verified !== true) {
    throw new Error("Expected r2.verified to be true!");
  }

  // Clean up test order and test reviews so db remains clean
  fileDb.remove("orders", testOrderId);
  fileDb.remove("reviews", r1.id);
  fileDb.remove("reviews", r2.id);

  console.log("✓ Review verification logic successfully tested and cleaned up!");
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
