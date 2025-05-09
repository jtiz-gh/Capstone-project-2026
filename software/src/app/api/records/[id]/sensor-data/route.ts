import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET /api/records/:id/sensor-data
export async function GET(
  _: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params
  const recordId = parseInt(id)

  if (isNaN(recordId)) {
    return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 })
  }

  try {
    const data = await prisma.sensorData.findMany({
      where: { recordId },
      orderBy: { timestamp: 'asc' },
      select: {
        timestamp: true,
        avgVoltage: true,
        avgCurrent: true,
      },
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching sensor data for record:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}