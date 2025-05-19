// app/api/teams/route.ts

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET /api/teams
export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        devices: true, // Include devices linked to teams
        rankings: true, // Include rankings if needed
      },
    })
    return NextResponse.json(teams)
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "Error fetching teams" }, { status: 500 })
  }
}

// POST /api/teams
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { teamName, vehicleClass, vehicleType } = body

    if (!teamName || !vehicleClass || !vehicleType) {
      return NextResponse.json(
        { error: "Missing teamName or vehicleClass or vehicleType" },
        { status: 400 }
      )
    }

    const newTeam = await prisma.team.create({
      data: {
        teamName,
        vehicleClass,
        vehicleType,
      },
    })

    return NextResponse.json(newTeam, { status: 201 })
  } catch (error) {
    console.error("Error creating team:", error)
    return NextResponse.json({ error: "Error creating team" }, { status: 500 })
  }
}
