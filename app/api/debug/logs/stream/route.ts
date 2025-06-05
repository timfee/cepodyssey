import { serverLogger } from '@/lib/logging/server-logger';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('debug-session')?.value;

  if (!sessionId) {
    return new Response('No debug session', { status: 400 });
  }

  let streamController: ReadableStreamDefaultController;
  const stream = new ReadableStream({
    start(controller) {
      streamController = controller;
      serverLogger.subscribe(sessionId, controller);

      serverLogger.getRecentLogs().then((logs) => {
        const encoder = new TextEncoder();
        logs.forEach((log) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(log)}\n\n`));
        });
      });
    },
    cancel() {
      serverLogger.unsubscribe(sessionId, streamController);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
