// app/api/records/merge/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { recordIds, timeOffsets, competitionId, deviceId } = body

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length < 2) {
      return NextResponse.json({ error: "At least 2 record IDs are required" }, { status: 400 })
    }

    if (!timeOffsets || !Array.isArray(timeOffsets)) {
      return NextResponse.json({ error: "Time offsets are required" }, { status: 400 })
    }

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 })
    }

    // Get all records to be merged
    const recordsToMerge = await prisma.record.findMany({
      where: {
        id: { in: recordIds },
      },
      include: {
        sensorData: true,
        device: true,
      },
    })

    if (recordsToMerge.length !== recordIds.length) {
      return NextResponse.json({ error: "Some records not found" }, { status: 404 })
    }

    // Create a new record for the merged data
    const newRecord = await prisma.record.create({
      data: {
        deviceId: deviceId,
        competitionId: competitionId || null,
        mergedFromIds: recordIds,
        stopTime: new Date(),
        disabled: false,
        timeOffset: 0,
        sortOrder: 0,
      },
    })

    // Collect all sensor data with time offsets applied
    const allSensorData = []
    let globalOffset = 0

    for (const offset of timeOffsets) {
      const record = recordsToMerge.find((r) => r.id === offset.recordId)
      if (!record) continue

      const recordSensorData = record.sensorData.map((data) => ({
        timestamp: Number(data.timestamp) + globalOffset + offset.offset,
        deviceId: data.deviceId,
        sessionId: data.sessionId,
        measurementId: data.measurementId,
        recordId: newRecord.id, // Assign to new record
        avgVoltage: data.avgVoltage,
        avgCurrent: data.avgCurrent,
        avgPower: data.avgPower,
        peakVoltage: data.peakVoltage,
        peakCurrent: data.peakCurrent,
        peakPower: data.peakPower,
        energy: data.energy,
      }))

      allSensorData.push(...recordSensorData)

      // Calculate global offset for the next record
      if (record.sensorData.length > 0) {
        const lastTimestamp = Math.max(...record.sensorData.map((d) => Number(d.timestamp)))
        globalOffset = Math.max(globalOffset, lastTimestamp + offset.offset + 1000) // Add 1 second buffer
      }
    }

    // Create all sensor data for the new record
    if (allSensorData.length > 0) {
      await prisma.sensorData.createMany({
        data: allSensorData,
      })

      // Calculate and update record summary values
      const validVoltages = allSensorData
        .filter((d) => d.avgVoltage !== null)
        .map((d) => d.avgVoltage!)
      const validCurrents = allSensorData
        .filter((d) => d.avgCurrent !== null)
        .map((d) => d.avgCurrent!)
      const validEnergies = allSensorData.filter((d) => d.energy !== null).map((d) => d.energy!)

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

      await prisma.record.update({
        where: { id: newRecord.id },
        data: {
          avgVoltage,
          avgCurrent,
          energy: totalEnergy,
        },
      })
    }

    // Mark original records as disabled (not deleted)
    await prisma.record.updateMany({
      where: {
        id: { in: recordIds },
      },
      data: {
        disabled: true,
      },
    })

    // Return the complete new record
    const completeNewRecord = await prisma.record.findUnique({
      where: { id: newRecord.id },
      include: {
        device: {
          include: {
            team: true,
          },
        },
        race: true,
        competition: true,
        _count: {
          select: {
            sensorData: true,
          },
        },
      },
    })

    return NextResponse.json(completeNewRecord)
  } catch (error) {
    console.error("Error merging records:", error)
    return NextResponse.json({ error: "Failed to merge records" }, { status: 500 })
  }
}
