"use client";

import { useEffect } from 'react';
import { toast } from 'sonner';

export function NotificationsController() {
  useEffect(() => {
    const eventSource = new EventSource('/api/sse-notifications');

    eventSource.onopen = () => {
      console.log('SSE connection opened.');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WELCOME') {
          // Optionally show welcome toast
        } else if (data.type === 'NEW_NOTIFICATION' && data.payload) {
          const notification = data.payload;
          toast.success(`Notification: ${notification.message}`, {
            description: `ID: ${notification.id} - ${new Date(notification.createdAt).toLocaleTimeString()}`,
            duration: 10000,
          });
        } else if (data.type === 'HEARTBEAT') {
          // Heartbeat, can be ignored or logged
        } else if (data.type === 'ERROR') {
          toast.error(data.message || 'Notification service error.');
        }
      } catch (error) {
        console.error('Failed to parse SSE event data:', error);
        toast.error('Malformed notification data received.');
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return null;
}
