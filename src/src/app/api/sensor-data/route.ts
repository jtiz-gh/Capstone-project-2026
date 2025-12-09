// app/api/sensor-data/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
      console.error("Missing required header: Pico-ID")
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
        // Create a cache map for handling sessionId and deviceId combinations
        const recordCache: { [key: string]: number } = {}

        // Collect all unique session-device combinations
        const sessionDevicePairs = new Set<string>()
        decodedPackets.forEach((packet) => {
          const cacheKey = `${packet.sessionId}-${device.id}`
          sessionDevicePairs.add(cacheKey)
        })

        // Create or find existing Record for each sessionId
        for (const pairKey of sessionDevicePairs) {
          const sessionId = parseInt(pairKey.split("-")[0])

          // Look for existing SensorData records with the same sessionId
          const existingSensorData = await prisma.sensorData.findFirst({
            where: {
              sessionId: sessionId,
              deviceId: device.id,
            },
            select: {
              recordId: true,
            },
          })

          if (existingSensorData) {
            // If found, use the existing recordId
            recordCache[pairKey] = existingSensorData.recordId
          } else {
            // If not exists, create a new Record
            const newRecord = await prisma.record.create({
              data: {
                deviceId: device.id,
                stopTime: new Date(),
              },
            })
            recordCache[pairKey] = newRecord.id
          }
        }

        // Prepare sensor data for batch creation
        const sensorDataToCreate = decodedPackets.map((packet) => {
          const cacheKey = `${packet.sessionId}-${device.id}`
          const recordId = recordCache[cacheKey]

          return {
            measurementId: packet.measurementId,
            deviceId: device.id,
            timestamp: packet.timestamp,
            sessionId: packet.sessionId,
            recordId: recordId,
            avgVoltage: packet.avgVoltage,
            avgCurrent: packet.avgCurrent,
            avgPower: packet.avgPower,
            peakVoltage: packet.peakVoltage,
            peakCurrent: packet.peakCurrent,
            peakPower: packet.peakPower,
            energy: packet.energy,
          }
        })

        // Batch create all sensor data
        await prisma.sensorData.createMany({
          data: sensorDataToCreate,
        })

        // Calculate and update Record summary values
        const recordIds = Array.from(new Set(Object.values(recordCache)))
        await Promise.all(
          recordIds.map(async (recordId) => {
            // Get all sensor data for this record
            const recordSensorData = await prisma.sensorData.findMany({
              where: { recordId },
              select: {
                avgVoltage: true,
                avgCurrent: true,
                energy: true,
              },
            })

            if (recordSensorData.length > 0) {
              // Calculate averages and total energy
              const validVoltages = recordSensorData
                .filter((d) => d.avgVoltage !== null)
                .map((d) => d.avgVoltage!)
              const validCurrents = recordSensorData
                .filter((d) => d.avgCurrent !== null)
                .map((d) => d.avgCurrent!)
              const validEnergies = recordSensorData
                .filter((d) => d.energy !== null)
                .map((d) => d.energy!)

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
              await prisma.record.update({
                where: { id: recordId },
                data: {
                  avgVoltage,
                  avgCurrent,
                  energy: totalEnergy,
                },
              })
            }
          })
        )

        console.log(
          `Uploaded ${decodedPackets.length} sensor data packets for device ${serialNo}. Record IDs: ${Object.values(recordCache).join(", ")}`
        )
      } else {
        console.warn("No valid packets found in the data")
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const recordId = url.searchParams.get("recordId")
    const countOnly = url.searchParams.get("count")

    if (recordId && countOnly === "1") {
      // Return only the count of sensor data for this record
      const count = await prisma.sensorData.count({
        where: { recordId: parseInt(recordId) },
      })
      return NextResponse.json({ count })
    }

    if (recordId) {
      // Get sensor data for a specific record
      const sensorData = await prisma.sensorData.findMany({
        where: { recordId: parseInt(recordId) },
        orderBy: { timestamp: "asc" },
      })
      return NextResponse.json(sensorData)
    }

    // Default behavior - get all sensor data with limit
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
