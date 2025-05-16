import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let clientLastNotificationId = 0;

      const sendEvent = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          console.error("Error sending SSE event:", e);
        }
      };

      sendEvent({ type: 'WELCOME', message: 'Connected to notification service.' });

      const intervalId = setInterval(async () => {
        if (request.signal.aborted) {
          clearInterval(intervalId);
          try {
            controller.close();
          } catch (e) {}
          return;
        }
        try {
          const newNotifications = await prisma.notification.findMany({
            where: {
              id: {
                gt: clientLastNotificationId,
              },
            },
            orderBy: {
              id: 'asc',
            },
            take: 10,
          });
          if (newNotifications.length > 0) {
            newNotifications.forEach(notification => {
              sendEvent({ type: 'NEW_NOTIFICATION', payload: notification });
            });
            clientLastNotificationId = newNotifications[newNotifications.length - 1].id;
          } else {
            sendEvent({ type: 'HEARTBEAT', timestamp: new Date().toISOString() });
          }
        } catch (error) {
          console.error('Error polling notifications:', error);
          sendEvent({ type: 'ERROR', message: 'Failed to fetch notifications.' });
        }
      }, 5000);

      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        try {
          controller.close();
        } catch (e) {}
      });
    },
    cancel() {
      // Called when the ReadableStream is cancelled
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
