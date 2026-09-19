import { json } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { fileDb } from "@/lib/commerce/file-db";
import { supportStore } from "@/lib/support/support-store";

/* ═══════════════════════════════════════════════════════════════
   CHATBOT API — Product-aware assistant using site data
   No paid API key required. Answers from product catalog,
   categories, and site settings.
   ═══════════════════════════════════════════════════════════════ */

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_CONTEXT = `You are a helpful assistant for Queens Care Laboratories, a premium pharmaceutical and wellness brand. You help customers find products, understand ingredients, benefits, and usage. You answer using ONLY information from the website's product catalog and content. You NEVER invent medical claims, diagnoses, prescriptions, dosages, or clinical results. If asked about medical conditions, direct the user to consult a healthcare professional.`;

function findRelevantProducts(query: string, products: Record<string, unknown>[]) {
  const lower = query.toLowerCase();
  const keywords = lower.split(/\s+/).filter((w) => w.length > 2);

  return products
    .map((p) => {
      const text = `${p.name} ${p.category} ${p.description || ""} ${p.benefits || ""}`.toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) score += 1;
      }
      if (String(p.name || "").toLowerCase().includes(lower)) score += 5;
      return { product: p, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((r) => r.product);
}

function formatProductInfo(p: Record<string, unknown>) {
  const parts = [`**${p.name}**`];
  if (p.category) parts.push(`Category: ${p.category}`);
  if (p.price) parts.push(`Price: ₹${Number(p.price).toLocaleString("en-IN")}`);
  if (p.description) parts.push(String(p.description).substring(0, 200));
  if (p.benefits) parts.push(`Benefits: ${String(p.benefits).substring(0, 150)}`);
  if (p.slug) parts.push(`View: /products/${p.slug}`);
  return parts.join("\n");
}

function generateResponse(query: string, products: Record<string, unknown>[], settings: Record<string, unknown>[]) {
  const lower = query.toLowerCase();

  // Greeting
  if (/^(hi|hello|hey|good morning|good evening|namaste)/i.test(lower)) {
    return "Hello! 👋 Welcome to Queens Care Laboratories. I'm here to help you find the right products, understand our ingredients, or navigate our website. What can I help you with?";
  }

  // Product search
  const matched = findRelevantProducts(query, products);
  if (matched.length > 0) {
    const productInfo = matched.map(formatProductInfo).join("\n\n");
    return `I found ${matched.length} product${matched.length > 1 ? "s" : ""} that match your query:\n\n${productInfo}\n\nWould you like more details about any of these?`;
  }

  // Category query
  if (/categor|product.*list|what.*sell|what.*have|product.*offer|product.*available|show.*product|list.*product|range|collection/i.test(lower)) {
    const categories = [...new Set(products.map((p) => String(p.category || "Uncategorized")))];
    return `Our product categories include:\n\n${categories.map((c) => `• ${c}`).join("\n")}\n\nWould you like me to show you products in a specific category?`;
  }

  // Shipping info
  if (/ship|deliver|delivery|track|dispatch/i.test(lower)) {
    const threshold = settings.find((s) => s.key === "free_shipping_threshold");
    const charge = settings.find((s) => s.key === "shipping_charge");
    let response = "We offer shipping across India. ";
    if (threshold?.value) response += `Free shipping on orders above ₹${threshold.value}. `;
    if (charge?.value) response += `Standard shipping charge: ₹${charge.value}. `;
    response += "\n\nYou can track your order from your account page or using the Track Order link in the footer.";
    return response;
  }

  // Return/refund
  if (/return|refund|cancel|exchange/i.test(lower)) {
    return "Our return policy allows returns within 7 days of delivery for unused products in original packaging. To request a return:\n\n1. Go to your account → Orders\n2. Select the order\n3. Click 'Request Return'\n\nRefunds are processed within 5-7 business days after we receive the returned item. For any issues, please contact our support team.";
  }

  // Contact
  if (/contact|reach|email|phone|support|help/i.test(lower)) {
    const email = settings.find((s) => s.key === "contact_email");
    const phone = settings.find((s) => s.key === "contact_phone");
    let response = "You can reach us through:\n\n";
    if (email?.value) response += `📧 Email: ${email.value}\n`;
    if (phone?.value) response += `📞 Phone: ${phone.value}\n`;
    response += "\nOr visit our Contact page for more options.";
    return response;
  }

  // About
  if (/about|story|who|what.*queens|brand/i.test(lower)) {
    return "Queens Care Laboratories is a premium pharmaceutical and wellness brand committed to scientific rigor and human-centered care. We combine pharmaceutical precision with thoughtful formulation to create products that integrate seamlessly into your daily wellness routine.\n\nVisit our About page to learn more about our story and mission.";
  }

  // Ingredients/science
  if (/ingredient|science|formul|research|clinical/i.test(lower)) {
    return "Our products are formulated with clinically studied ingredients at effective dosages. Each product undergoes rigorous quality testing.\n\nVisit our Science page to learn about our formulation philosophy and research approach.\n\n⚠️ Please note: I can provide general product information, but for specific medical advice, please consult a healthcare professional.";
  }

  // FAQ
  if (/faq|question|common/i.test(lower)) {
    return "Here are some common questions:\n\n• **Shipping**: Free shipping on orders above ₹1,500\n• **Returns**: 7-day return policy for unused products\n• **Payment**: We accept UPI, cards, net banking, and COD\n• **Authenticity**: All products are sourced directly from Queens Care Laboratories\n\nVisit our FAQ page for more details.";
  }

  // No match
  return "I'm not sure I understand that question. I can help you with:\n\n• Finding products\n• Product information and ingredients\n• Shipping and delivery\n• Returns and refunds\n• Order tracking\n• Contact information\n\nTry asking about a specific product or topic!";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== "string") {
      return json({ error: "Message required" }, 400);
    }

    // Safety check
    const forbidden = ["diagnos", "prescri", "dosage", "clinical trial", "fda approval", "cure disease"];
    const lowerMsg = message.toLowerCase();
    if (forbidden.some((f) => lowerMsg.includes(f))) {
      return json({
        response: "I'm sorry, but I cannot provide medical diagnoses, prescriptions, or clinical advice. Please consult a qualified healthcare professional for medical concerns.\n\nI can help you with product information, ingredients, benefits, and website navigation.",
        products: [],
      });
    }

    // If conversationId is provided, integrate with supportStore
    const conversationId = body.conversationId ? String(body.conversationId) : null;
    if (conversationId) {
      const conv = supportStore.getConversation(conversationId);
      if (conv) {
        const result = await supportStore.addCustomerMessage(conversationId, message);
        return json({
          response: result.assistantMsg?.content || "Message received by our support team.",
          products: result.assistantMsg?.products || [],
          conversation: result.conversation,
        });
      }
    }

    // Load product data
    const products = await store.products.all();
    const settings = fileDb.findMany("settings");

    // Generate response
    const response = generateResponse(message, products, settings);

    // Find relevant products for card display
    const relevantProducts = findRelevantProducts(message, products).slice(0, 3).map((p: Record<string, unknown>) => ({
      name: p.name,
      slug: p.slug,
      image: p.image,
      price: p.price,
      category: p.category,
    }));

    return json({ response, products: relevantProducts });
  } catch {
    return json({ response: "I'm having trouble processing your request. Please try again.", products: [] });
  }
}
