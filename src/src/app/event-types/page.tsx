"use client"

import { EventTypeForm } from "@/app/event-types/event-type-form"
import { EventTypeList } from "@/app/event-types/event-type-list"
import Navbar from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Event } from "@/types/teams"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [activeTab, setActiveTab] = useState("view")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events")
        if (res.ok) {
          setEvents(await res.json())
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const handleAddEvent = async (eventData: Omit<Event, "id">) => {
    if (editingEvent) {
      try {
        const res = await fetch(`/api/events/${editingEvent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        })
        if (res.ok) {
          const updated = await res.json()
          setEvents(events.map((e) => (e.id === updated.id ? updated : e)))
        } else {
          let errorMsg = "Failed to edit event"
          const errorJson = await res.json()
          errorMsg = errorJson.error || errorMsg
          toast.error(errorMsg)
        }
      } catch (error) {
        console.error("Error updating event:", error)
      }
      setEditingEvent(null)
    } else {
      try {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        })
        if (res.ok) {
          const newEvent = await res.json()
          setEvents([...events, newEvent])
        } else {
          let errorMsg = "Failed to create event"
          const errorJson = await res.json()
          errorMsg = errorJson.error || errorMsg
          toast.error(errorMsg)
        }
      } catch (error) {
        console.error("Error creating event:", error)
      }
    }

    setActiveTab("view")
  }

  const handleEditEvent = (Event: Event) => {
    setEditingEvent(Event)
    setActiveTab("add")
  }

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm("Delete this event type?")) return
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" })
      if (res.ok) {
        setEvents(events.filter((e) => e.id !== eventId))
        setEditingEvent(null)
        setActiveTab("view")
      } else {
        console.error("Failed to delete event type")
      }
    } catch (error) {
      console.error("Error deleting event type:", error)
    }
  }

  const handleCancelEdit = () => {
    setEditingEvent(null)
    setActiveTab("view")
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen justify-center gap-8 px-2 pt-4 pb-8 font-[family-name:var(--font-geist-sans)] sm:px-20 sm:pt-8">
        <main className="flex w-full max-w-full flex-col gap-4 sm:max-w-3xl sm:gap-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="hover:cursor-pointer"
                data-testid="back-button"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-[30px] font-bold">Event Types</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="view" className="hover:cursor-pointer">
                View Event Types
              </TabsTrigger>
              <TabsTrigger value="add" className="hover:cursor-pointer">
                {editingEvent ? "Edit Event Type" : "Add Event Type"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="mt-6">
              <div className="mb-4 flex w-full">
                <input
                  type="text"
                  placeholder="Search event types..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <p>Loading event types...</p>
                </div>
              ) : (
                <EventTypeList
                  events={events.filter((event) =>
                    event.eventName.toLowerCase().includes(search.toLowerCase())
                  )}
                  onEditEvent={handleEditEvent}
                  searchTerm={search} // <-- Pass search term here
                />
              )}
            </TabsContent>

            <TabsContent value="add" className="mt-6">
              <Card>
                <CardContent className="flex flex-col items-start justify-between gap-2 p-4 sm:flex-row sm:items-center sm:gap-0 sm:p-6">
                  <EventTypeForm
                    onSubmit={handleAddEvent}
                    onCancel={editingEvent ? handleCancelEdit : undefined}
                    initialEvent={editingEvent || undefined}
                    submitLabel={editingEvent ? "Update Event Type" : "Add Event Type"}
                    onDeleteEvent={editingEvent ? handleDeleteEvent : undefined}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  )
}
