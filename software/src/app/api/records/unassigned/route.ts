// app/api/records/unassigned/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/records/unassigned?teamId=X&includeDisabled=true/false
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const teamId = url.searchParams.get("teamId")
    const includeDisabled = url.searchParams.get("includeDisabled") === "false"

    if (!teamId) {
      return NextResponse.json({ error: "teamId is required" }, { status: 400 })
    }

    // Build filter conditions
    const where: any = {
      competitionId: null,
      device: {
        teamId: parseInt(teamId),
      },
    }

    // Always filter out disabled records unless explicitly requested
    if (!includeDisabled) {
      where.disabled = false
    }

    // Find unassigned records for the team (competitionId is null)
    const unassignedRecords = await prisma.record.findMany({
      where,
      include: {
        race: true,
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
      orderBy: {
        stopTime: "desc",
      },
    })

    return NextResponse.json(unassignedRecords)
  } catch (error) {
    console.error("Error fetching unassigned records:", error)
    return NextResponse.json({ error: "Failed to fetch unassigned records" }, { status: 500 })
  }
}
