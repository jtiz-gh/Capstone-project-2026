// app/api/races/route.ts

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET /api/races
export async function GET() {
  try {
    const races = await prisma.race.findMany({
      include: {
        rankings: true,
        records: true,
      },
    })
    return NextResponse.json(races)
  } catch (error) {
    console.error("Error fetching races:", error)
    return NextResponse.json({ error: "Error fetching races" }, { status: 500 })
  }
}

// POST /api/races
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: eventType, date, eventName, eventStartTime, raceStartTime",
        },
        { status: 400 }
      )
    }

    const newRace = await prisma.race.create({
      data: {
        event: { connect: { id: eventId } },
      },
    })

    return NextResponse.json(newRace, { status: 201 })
  } catch (error) {
    console.error("Error creating race:", error)
    return NextResponse.json({ error: "Error creating race" }, { status: 500 })
  }
}
