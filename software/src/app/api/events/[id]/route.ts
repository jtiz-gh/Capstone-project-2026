import { PrismaClient } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(_: NextRequest, context: { params: { id: string } }) {
const { id } = await context.params 
const eventId = parseInt(id, 10)
  if (isNaN(eventId)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
  }
  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    return NextResponse.json(event)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = await context.params 
const eventId = parseInt(id, 10)
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }
    const body = await req.json()

    if (body.eventName) {
      const existingEvent = await prisma.event.findFirst({
        where: {
          eventName: {
            equals: body.eventName,
          },
          id: {
            not: eventId, // Exclude current event from the check
          },
        },
      })

      if (existingEvent) {
        return NextResponse.json(
          { error: "An event with this name already exists" },
          { status: 400 }
        )
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: body,
    })
    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = await context.params
    const eventId = parseInt(id, 10)
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }
    await prisma.event.delete({ where: { id: eventId } })
    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
