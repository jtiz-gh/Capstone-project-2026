"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Event } from "@/types/teams"
import { CalendarCog } from "lucide-react"

interface EventTypeListProps {
  events: Event[]
  onEditEvent?: (Event: Event) => void
  onDeleteEvent?: (eventId: number) => void
  emptyMessage?: string
  showActions?: boolean
  searchTerm?: string
}

export function EventTypeList({
  events,
  onEditEvent,
  onDeleteEvent,
  emptyMessage = "No eventTypes added yet. Add your first EventType!",
  showActions = true,
  searchTerm = "",
}: Readonly<EventTypeListProps>) {
  if (events.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <CalendarCog className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">
          {searchTerm ? (
            <>
              No results found for search &quot;<span className="font-semibold">{searchTerm}</span>&quot;.
            </>
          ) : (
            emptyMessage
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {events.map((Event) => (
        <Card key={Event.id}>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-xl font-semibold">{Event.eventName}</h3>
            </div>
            {showActions && (
              <div className="flex items-center gap-2">
                {onEditEvent && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:cursor-pointer"
                    onClick={() => onEditEvent(Event)}
                  >
                    View/Edit
                  </Button>
                )}
                {onDeleteEvent && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="hover:cursor-pointer"
                    onClick={() => onDeleteEvent(Event.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
