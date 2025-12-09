// app/api/records/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/records?teamId=X&competitionId=Y&assigned=true/false&includeDisabled=true/false
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const teamId = url.searchParams.get("teamId")
    const competitionId = url.searchParams.get("competitionId")
    const assigned = url.searchParams.get("assigned")
    const includeDisabled = url.searchParams.get("includeDisabled") === "true"

    // Build filter conditions
    const where: any = {}

    // Always filter out disabled records unless explicitly requested
    if (!includeDisabled) {
      where.disabled = false
    }

    // Set up competitionId filter
    if (competitionId) {
      where.competitionId = parseInt(competitionId)
    }

    if (teamId) {
      where.device = {
        teamId: parseInt(teamId),
      }
    }

    // Filter by assignment status if specified
    if (assigned !== null && !competitionId) {
      // Only apply assignment filter if no specific competitionId was requested
      if (assigned === "true") {
        where.competitionId = { not: null }
      } else if (assigned === "false") {
        where.competitionId = null
      }
    }

    // If neither teamId nor competitionId is provided, return all records
    const records = await prisma.record.findMany({
      where,
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
      orderBy: [{ sortOrder: "asc" }, { stopTime: "desc" }],
    })

    return NextResponse.json({
      records,
      recordIds: records.map((r) => r.id),
    })
  } catch (error) {
    console.error("Error fetching filtered records:", error)
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
  }
}

// POST /api/records (optional — only if needed manually)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { raceId, competitionId, deviceId, avgVoltage, avgCurrent, energy } = body

    if (!raceId || !competitionId || !deviceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const record = await prisma.record.create({
      data: {
        raceId,
        competitionId,
        deviceId,
        avgVoltage,
        avgCurrent,
        energy,
        stopTime: new Date(),
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error("Error creating record:", error)
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 })
  }
}
