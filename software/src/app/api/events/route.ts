import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET api/events
export async function GET() {
  try {
    const events = await prisma.event.findMany()
    return NextResponse.json(events, { status: 200 })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

// POST api/events
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { eventName, eventType } = body

    if (!eventName || !eventType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

     // Check for existing event with the same name
    const existingEvent = await prisma.event.findFirst({
      where: {
        eventName: {
          equals: eventName,
        },
      },
    })

    if (existingEvent) {
      return NextResponse.json(
        { error: "An event with this name already exists" },
        { status: 400 }
      )
    }

    const newEvent = await prisma.event.create({
      data: {
        eventName,
        eventType,
      },
    })

    return NextResponse.json(newEvent, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}
