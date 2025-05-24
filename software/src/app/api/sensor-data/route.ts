// app/api/sensor-data/route.ts

import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

interface DecodedMeasurements {
  timestamp: number
  sessionId: number
  measurementId: number
  avgVoltage: number
  avgCurrent: number
  avgPower: number
  peakVoltage: number
  peakCurrent: number
  peakPower: number
  energy: number
}

function unpackProcessedFloatDataToDict(frameData: Buffer): DecodedMeasurements {
  // Inline unpacking of binary data
  // Read 3 uint32 values (4 bytes each)
  const timestamp = frameData.readUInt32LE(0)
  const sessionId = frameData.readUInt32LE(4)
  const measurementId = frameData.readUInt32LE(8)

  // Read 7 float values (4 bytes each)
  const avgVoltage = frameData.readFloatLE(12)
  const avgCurrent = frameData.readFloatLE(16)
  const avgPower = frameData.readFloatLE(20)
  const peakVoltage = frameData.readFloatLE(24)
  const peakCurrent = frameData.readFloatLE(28)
  const peakPower = frameData.readFloatLE(32)
  const energy = frameData.readFloatLE(36)

  return {
    timestamp,
    sessionId,
    measurementId,
    avgVoltage,
    avgCurrent,
    avgPower,
    peakVoltage,
    peakCurrent,
    peakPower,
    energy,
  }
}

export async function POST(request: Request) {
  try {
    const buffer = Buffer.from(await request.arrayBuffer())
    const serialNo = request.headers.get("Pico-ID")

    if (!serialNo) {
      return NextResponse.json(
        {
          error: "Missing required header: Pico-ID",
        },
        { status: 400 }
      )
    }

    // Check if device exists
    let device = await prisma.device.findUnique({
      where: { serialNo: serialNo },
    })

    if (!device) {
      // Create a new device if it doesn't exist
      device = await prisma.device.create({
        data: {
          serialNo: serialNo,
        },
      })
    }

    let offset = 0
    const decodedPackets: DecodedMeasurements[] = []

    try {
      // Check if the buffer length is a multiple of 40 bytes
      while (offset + 40 <= buffer.length) {
        const packetBuffer = buffer.subarray(offset, offset + 40)
        const decodedData = unpackProcessedFloatDataToDict(packetBuffer)
        decodedPackets.push(decodedData)
        offset += 40
      }

      if (decodedPackets.length > 0) {
        const readings = decodedPackets.map(async (packet) => {
          //Create record from session id if does not exist
          const record = await prisma.record.upsert({
            where: { id: packet.sessionId },
            update: {},
            create: {
              id: packet.sessionId,
              deviceId: device.id,
            },
          })

          return {
            measurementId: packet.measurementId,
            deviceId: device.id,
            timestamp: packet.timestamp,
            sessionId: packet.sessionId,
            recordId: record.id,
            avgVoltage: packet.avgVoltage,
            avgCurrent: packet.avgCurrent,
            avgPower: packet.avgPower,
            peakVoltage: packet.peakVoltage,
            peakCurrent: packet.peakCurrent,
            peakPower: packet.peakPower,
            energy: packet.energy,
          }
        })

        await prisma.sensorData.createMany({
          data: await Promise.all(readings),
        })
      } else {
        return NextResponse.json(
          {
            error: "No valid packets found in the data",
          },
          { status: 400 }
        )
      }
    } catch (binaryError) {
      console.error("Error decoding binary data:", binaryError)
      return NextResponse.json(
        {
          error: "Failed to decode binary data",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    console.error("Error uploading sensor data:", error)
    return NextResponse.json({ error: "Server error", message: error?.message }, { status: 500 })
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
