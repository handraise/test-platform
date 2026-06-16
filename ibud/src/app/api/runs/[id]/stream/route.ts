import { NextRequest } from "next/server";
import { getRunHistory, subscribeRun, RunEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

/** SSE stream of run events: history first, then live until run_finished. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: RunEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      const { events, done } = getRunHistory(id);
      events.forEach(send);

      if (done) {
        controller.close();
        return;
      }

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 15_000);

      const unsubscribe = subscribeRun(id, (event) => {
        send(event);
        if (event.type === "run_finished") {
          cleanup();
          controller.close();
        }
      });

      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };

      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
