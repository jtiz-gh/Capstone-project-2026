import { Toaster } from "sonner"
import { NotificationsController } from "@/components/NotificationsController"

export default function NotificationDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="top-right" />
      <NotificationsController />
    </>
  )
}
