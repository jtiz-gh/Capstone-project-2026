// app/api/events/route.ts

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/events
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        rankings: true,
        records: true,
      },
    })
    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Error fetching events' }, { status: 500 })
  }
}

// POST /api/events
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { eventType, date, eventName, eventStartTime, raceStartTime } = body

    if (!eventType || !date || !eventName || !eventStartTime || !raceStartTime) {
      return NextResponse.json({
        error: 'Missing required fields: eventType, date, eventName, eventStartTime, raceStartTime',
      }, { status: 400 })
    }

    const newEvent = await prisma.event.create({
      data: {
        eventType,
        date: new Date(date),
        eventName,
        eventStartTime: new Date(eventStartTime),
        raceStartTime: new Date(raceStartTime),
      },
    })

    return NextResponse.json(newEvent, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json({ error: 'Error creating event' }, { status: 500 })
  }
}