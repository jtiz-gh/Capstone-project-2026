import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/records/:id/sensor-data
export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const recordId = parseInt(id)

  if (isNaN(recordId)) {
    return NextResponse.json({ error: "Invalid record ID" }, { status: 400 })
  }

  try {
    const data = await prisma.sensorData.findMany({
      where: { recordId },
      orderBy: { timestamp: "asc" },
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching sensor data for record:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}
