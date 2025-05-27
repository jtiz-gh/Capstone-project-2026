"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Event } from "@/types/teams"

interface EventTypeFormProps {
  onSubmit: (team: Omit<Event, "id">) => void
  onCancel?: () => void
  initialEvent?: Event
  submitLabel?: string
}

export function EventTypeForm({
  onSubmit,
  onCancel,
  initialEvent,
  submitLabel = "Add Team",
}: EventTypeFormProps) {
  const [eventName, setEventName] = useState("")

  useEffect(() => {
    if (initialEvent) {
      setEventName(initialEvent.eventName)
    }
  }, [initialEvent])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!eventName.trim()) return

    onSubmit({
      eventName: eventName,
      eventType: "Dynamic",
      completed: false,
    })

    // Reset form if not editing
    if (!initialEvent) {
      setEventName("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="event-type-name">Event Type Name</Label>
        <Input
          id="event-type-name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="Enter event type name"
          required
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1 hover:cursor-pointer">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="hover:cursor-pointer"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
