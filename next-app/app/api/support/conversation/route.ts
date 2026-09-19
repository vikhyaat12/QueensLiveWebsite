import { json, requireUser, safeText } from "@/lib/http";
import { supportStore } from "@/lib/support/support-store";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const visitorId = safeText(url.searchParams.get("visitorId"), 100);
    const conversationId = safeText(url.searchParams.get("conversationId"), 100);

    if (!visitorId && !conversationId) {
      return json({ error: "visitorId or conversationId required" }, 400);
    }

    const user = await requireUser();
    let conversation = conversationId ? supportStore.getConversation(conversationId) : null;

    if (!conversation && visitorId) {
      conversation = supportStore.getOrCreateConversation(visitorId, user);
    }

    if (!conversation) {
      return json({ error: "Conversation not found" }, 404);
    }

    // Security check: verify visitorId or customerId matches
    if (user && conversation.customerId && conversation.customerId !== user.id) {
      return json({ error: "Unauthorized" }, 403);
    } else if (!user && conversation.visitorId !== visitorId) {
      return json({ error: "Unauthorized" }, 403);
    }

    // Mark read by customer
    supportStore.markReadByCustomer(conversation.id);

    const messages = supportStore.getMessages(conversation.id, { includeInternal: false });
    const settings = supportStore.getSettings();

    return json({
      conversation,
      messages,
      settings: {
        chatEnabled: settings.chatEnabled,
        aiEnabled: settings.aiEnabled,
        humanSupportEnabled: settings.humanSupportEnabled,
        humanHandoffEnabled: settings.humanHandoffEnabled,
        isOnline: settings.isOnline,
        welcomeMessage: settings.welcomeMessage,
        offlineMessage: settings.offlineMessage,
        humanHandoffMessage: settings.humanHandoffMessage,
        resolutionMessage: settings.resolutionMessage,
      },
    });
  } catch (err: any) {
    return json({ error: err.message || "Failed to load conversation" }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const visitorId = safeText(body.visitorId, 100);

    if (!visitorId) {
      return json({ error: "visitorId required" }, 400);
    }

    const user = await requireUser();
    const conversation = supportStore.getOrCreateConversation(visitorId, user, {
      userAgent: safeText(body.userAgent, 300),
      currentUrl: safeText(body.currentUrl, 300),
    });

    const messages = supportStore.getMessages(conversation.id, { includeInternal: false });
    const settings = supportStore.getSettings();

    return json({
      conversation,
      messages,
      settings: {
        chatEnabled: settings.chatEnabled,
        aiEnabled: settings.aiEnabled,
        humanSupportEnabled: settings.humanSupportEnabled,
        humanHandoffEnabled: settings.humanHandoffEnabled,
        isOnline: settings.isOnline,
        welcomeMessage: settings.welcomeMessage,
        offlineMessage: settings.offlineMessage,
        humanHandoffMessage: settings.humanHandoffMessage,
        resolutionMessage: settings.resolutionMessage,
      },
    });
  } catch (err: any) {
    return json({ error: err.message || "Failed to create conversation" }, 500);
  }
}
