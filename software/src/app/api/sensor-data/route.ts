// app/api/sensor-data/route.ts

import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const { serialNo, readings, raceId, competitionId, sessionId } = data

    if (!serialNo || !readings || !raceId || !competitionId || !sessionId) {
      return NextResponse.json(
        {
          error: "Missing required fields: serialNo, readings, eventId, competitionId, sessionId",
        },
        { status: 400 }
      )
    }

    // Find the device by serial number
    const device = await prisma.device.findUnique({
      where: { serialNo: parseInt(serialNo) },
    })

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    // Create a new record for this upload
    const record = await prisma.record.create({
      data: {
        raceId,
        competitionId,
        deviceId: device.id,
      },
    })

    // Store all sensor readings
    const sensorDataCreates = readings.map((reading: any) => ({
      sessionId,
      recordId: record.id,
      deviceId: device.id,
      measurementId: reading.measurementId,
      timestamp: new Date(reading.timestamp),
      avgVoltage: reading.avgVoltage,
      avgCurrent: reading.avgCurrent,
      avgPower: reading.avgPower,
      peakVoltage: reading.peakVoltage,
      peakCurrent: reading.peakCurrent,
      peakPower: reading.peakPower,
      energy: reading.energy,
      temperature: reading.temperature,
    }))

    await prisma.sensorData.createMany({
      data: sensorDataCreates,
    })

    // Calculate average voltage/current and energy
    const voltages = readings.map((r: any) => r.avgVoltage).filter(Boolean)
    const currents = readings.map((r: any) => r.avgCurrent).filter(Boolean)

    const avgVoltage = voltages.length
      ? voltages.reduce((a: number, b: number) => a + b, 0) / voltages.length
      : null

    const avgCurrent = currents.length
      ? currents.reduce((a: number, b: number) => a + b, 0) / currents.length
      : null
    const energy =
      avgVoltage && avgCurrent ? (avgVoltage * avgCurrent * readings.length) / 3600 : null

    await prisma.record.update({
      where: { id: record.id },
      data: {
        avgVoltage,
        avgCurrent,
        energy,
        stopTime: new Date(),
      },
    })

    return NextResponse.json({ success: true, recordId: record.id }, { status: 201 })
  } catch (error: any) {
    console.error("Error uploading sensor data:", error)
    return NextResponse.json({ error: "Server error", message: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const sensorData = await prisma.sensorData.findMany({
      take: 1000, // optional: limit results
      orderBy: { timestamp: "asc" },
      include: {
        device: { select: { serialNo: true } },
        record: { select: { id: true, raceId: true, competitionId: true } },
      },
    })

    return NextResponse.json(sensorData)
  } catch (error) {
    console.error("Error fetching sensor data:", error)
    return NextResponse.json({ error: "Failed to fetch sensor data" }, { status: 500 })
  }
}
