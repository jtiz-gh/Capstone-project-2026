

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PATCH /api/events/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const eventId = parseInt(params.id)

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...body,
        date: body.date ? new Date(body.date) : undefined,
        eventStartTime: body.eventStartTime ? new Date(body.eventStartTime) : undefined,
        raceStartTime: body.raceStartTime ? new Date(body.raceStartTime) : undefined,
      },
    })

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Error updating event' }, { status: 500 })
  }
}

// DELETE /api/events/:id
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const eventId = parseInt(params.id)

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    await prisma.event.delete({
      where: { id: eventId },
    })

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Error deleting event' }, { status: 500 })
  }
}