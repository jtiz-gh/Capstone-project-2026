import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    // Parse JSON data from request body
    const data = await request.json()

    // Validate required fields
    if (
      !data.serialNo ||
      !data.readings ||
      !data.eventId ||
      !data.competitionId ||
      !data.sessionId
    ) {
      return NextResponse.json(
        { error: "Missing required fields: serialNo, readings, eventId, competitionId, sessionId" },
        { status: 400 }
      )
    }

    // Find device
    const device = await prisma.device.findUnique({
      where: { serialNo: data.serialNo },
    })

    if (!device) {
      return NextResponse.json(
        { error: "Device with specified serial number not found" },
        { status: 404 }
      )
    }

    // Create new Record
    const record = await prisma.record.create({
      data: {
        eventId: data.eventId,
        competitionId: data.competitionId,
        deviceId: device.id,
      },
    })

    // Process sensor data
    const sensorDataPromises = data.readings.map((reading: any) => {
      return prisma.sensorData.create({
        data: {
          timestamp: new Date(reading.timestamp),
          voltage: reading.voltage,
          current: reading.current,
          sessionId: data.sessionId,
          recordId: record.id,
          deviceId: device.id,
        },
      })
    })

    await Promise.all(sensorDataPromises)

    // Calculate and update average current, voltage and energy
    if (data.readings.length > 0) {
      const voltageValues = data.readings.map((r: any) => r.voltage).filter(Boolean)
      const currentValues = data.readings.map((r: any) => r.current).filter(Boolean)

      const avgVoltage =
        voltageValues.length > 0
          ? voltageValues.reduce((sum: number, val: number) => sum + val, 0) / voltageValues.length
          : null

      const avgCurrent =
        currentValues.length > 0
          ? currentValues.reduce((sum: number, val: number) => sum + val, 0) / currentValues.length
          : null

      // Simple energy calculation
      const energy =
        avgVoltage && avgCurrent ? (avgVoltage * avgCurrent * data.readings.length) / 3600 : null

      await prisma.record.update({
        where: { id: record.id },
        data: {
          avgVoltage,
          avgCurrent,
          energy,
          stopTime: new Date(),
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        recordId: record.id,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error processing sensor data:", error)
    return NextResponse.json({ error: "Server error", message: error.message }, { status: 500 })
  }
}
