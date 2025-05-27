// app/api/devices/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/devices
export async function GET() {
  try {
    const devices = await prisma.device.findMany({
      include: {
        team: true,
        config: true,
      },
    })
    return NextResponse.json(devices)
  } catch (error) {
    console.error("Error fetching devices:", error)
    return NextResponse.json({ error: "Error fetching devices" }, { status: 500 })
  }
}

// POST /api/devices
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { serialNo } = body

    if (!serialNo) {
      return NextResponse.json({ error: "Missing required field: serialNo" }, { status: 400 })
    }

    // // Ensure the team exists
    // const team = await prisma.team.findUnique({ where: { id: teamId } })
    // if (!team) {
    //   return NextResponse.json({ error: "Team not found" }, { status: 404 })
    // }

    const newDevice = await prisma.device.create({
      data: {
        serialNo,
        // teamId,
      },
    })

    return NextResponse.json(newDevice, { status: 201 })
  } catch (error) {
    console.error("Error creating device:", error)
    return NextResponse.json({ error: "Error creating device" }, { status: 500 })
  }
}
