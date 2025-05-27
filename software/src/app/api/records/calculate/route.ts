// app/api/records/calculate/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/records/calculate
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { recordId } = body

    if (!recordId) {
      return NextResponse.json({ error: "recordId is required" }, { status: 400 })
    }

    // Get all sensor data for this record
    const sensorData = await prisma.sensorData.findMany({
      where: { recordId: parseInt(recordId) },
      select: {
        avgVoltage: true,
        avgCurrent: true,
        energy: true,
      },
    })

    if (sensorData.length === 0) {
      return NextResponse.json({ error: "No sensor data found for this record" }, { status: 404 })
    }

    // Calculate averages and total energy
    const validVoltages = sensorData.filter((d) => d.avgVoltage !== null).map((d) => d.avgVoltage!)
    const validCurrents = sensorData.filter((d) => d.avgCurrent !== null).map((d) => d.avgCurrent!)
    const validEnergies = sensorData.filter((d) => d.energy !== null).map((d) => d.energy!)

    const avgVoltage =
      validVoltages.length > 0
        ? validVoltages.reduce((sum, v) => sum + v, 0) / validVoltages.length
        : null

    const avgCurrent =
      validCurrents.length > 0
        ? validCurrents.reduce((sum, c) => sum + c, 0) / validCurrents.length
        : null

    const totalEnergy =
      validEnergies.length > 0 ? validEnergies.reduce((sum, e) => sum + e, 0) : null

    // Update the record with calculated values
    const updatedRecord = await prisma.record.update({
      where: { id: parseInt(recordId) },
      data: {
        avgVoltage,
        avgCurrent,
        energy: totalEnergy,
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
    console.error("Error calculating record values:", error)
    return NextResponse.json({ error: "Failed to calculate record values" }, { status: 500 })
  }
}
