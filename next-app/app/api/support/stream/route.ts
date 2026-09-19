import { safeText } from "@/lib/http";
import { supportEventBus } from "@/lib/support/event-bus";
import { supportStore } from "@/lib/support/support-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const conversationId = safeText(url.searchParams.get("conversationId"), 100);

  if (!conversationId) {
    return new Response("conversationId required", { status: 400 });
  }

  const conv = supportStore.getConversation(conversationId);
  if (!conv) {
    return new Response("Conversation not found", { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      // Send initial handshake
      send({ type: "connected", conversationId });

      const handler = (event: any) => {
        // Never send internal notes to customer
        if (event.type === "message:created" && event.message?.isInternal) {
          return;
        }
        send(event);
      };

      supportEventBus.on(`conversation:${conversationId}`, handler);

      // 15-second heartbeat ping
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        supportEventBus.off(`conversation:${conversationId}`, handler);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
