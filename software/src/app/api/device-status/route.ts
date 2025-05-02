import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// POST /api/device-status
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { deviceId, internalTemperature, flashMemoryUsage, voltage, current } = body

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 })
    }

    const status = await prisma.deviceStatus.upsert({
      where: { deviceId },
      update: {
        internalTemperature,
        flashMemoryUsage,
        voltage,
        current,
      },
      create: {
        deviceId,
        internalTemperature,
        flashMemoryUsage,
        voltage,
        current,
      },
    })

    return NextResponse.json(status, { status: 201 })
  } catch (error) {
    console.error('Error updating device status:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}

// GET /api/device-status
export async function GET() {
  try {
    const statuses = await prisma.deviceStatus.findMany({
      include: {
        device: { select: { serialNo: true } },
      },
    })

    return NextResponse.json(statuses)
  } catch (error) {
    console.error('Error fetching device statuses:', error)
    return NextResponse.json({ error: 'Failed to fetch statuses' }, { status: 500 })
  }
}