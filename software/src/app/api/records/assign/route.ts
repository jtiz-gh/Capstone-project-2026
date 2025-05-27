// app/api/records/assign/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/records/assign
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { recordId, competitionId } = body

    if (!recordId || !competitionId) {
      return NextResponse.json(
        { error: "recordId and competitionId are required" },
        { status: 400 }
      )
    }

    // Update the record to assign it to the competition
    const updatedRecord = await prisma.record.update({
      where: {
        id: parseInt(recordId),
      },
      data: {
        competitionId: parseInt(competitionId),
      },
      include: {
        race: true,
        competition: true,
        device: {
          include: {
            team: true,
          },
        },
        _count: {
          select: {
            sensorData: true,
          },
        },
      },
    })

    return NextResponse.json(updatedRecord)
  } catch (error) {
    console.error("Error assigning record:", error)
    return NextResponse.json({ error: "Failed to assign record" }, { status: 500 })
  }
}
