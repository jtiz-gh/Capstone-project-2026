"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export function NotificationsController() {
  useEffect(() => {
    const eventSource = new EventSource("/api/sse-notifications")

    eventSource.onopen = () => {
      console.log("SSE connection opened.")
    }

    const markAsRead = async (notificationId: number) => {
      try {
        const response = await fetch("/api/notifications", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: notificationId,
            read: true,
          }),
        })

        if (!response.ok) {
          console.error("Failed to mark notification as read:", await response.text())
        }
      } catch (error) {
        console.error("Error marking notification as read:", error)
      }
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "WELCOME") {
          // Optionally show welcome toast
        } else if (data.type === "NEW_NOTIFICATION" && data.payload) {
          const notification = data.payload

          // Get additional data if available
          const notificationData = notification.data ? notification.data : {}

          // Show toast with message (default content to display)
          toast.success(notification.message, {
            description: `${new Date(notification.createdAt).toLocaleTimeString()}`,
            duration: 10000,
            onDismiss: () => {
              // Mark notification as read when toast is dismissed
              markAsRead(notification.id)
            },
            action: {
              label: "Dismiss",
              onClick: () => markAsRead(notification.id),
            },
          })
        } else if (data.type === "HEARTBEAT") {
          // Heartbeat, can be ignored or logged
        } else if (data.type === "ERROR") {
          toast.error(data.message || "Notification service error.")
        }
      } catch (error) {
        console.error("Failed to parse SSE event data:", error)
        toast.error("Malformed notification data received.")
      }
    }

    eventSource.onerror = (error) => {
      console.error("SSE error:", error)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  return null
}
