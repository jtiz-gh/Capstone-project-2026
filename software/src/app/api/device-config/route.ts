import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

// GET /api/device-configs
export async function GET() {
  try {
    const configs = await prisma.deviceConfig.findMany({
      include: {
        device: { select: { serialNo: true } },
      },
    })

    return NextResponse.json(configs)
  } catch (error) {
    console.error("Error fetching device configs:", error)
    return NextResponse.json({ error: "Failed to fetch configs" }, { status: 500 })
  }
}

// POST /api/device-configs
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { deviceId, settings, configName } = body

    if (!deviceId || !settings) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const config = await prisma.deviceConfig.upsert({
      where: { deviceId },
      update: {
        settings,
        configName,
      },
      create: {
        deviceId,
        settings,
        configName,
      },
    })

    return NextResponse.json(config, { status: 201 })
  } catch (error) {
    console.error("Error saving device config:", error)
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }
}
