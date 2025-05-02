import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET /api/records/:id/sensor-data
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const recordId = parseInt(params.id)

  if (isNaN(recordId)) {
    return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 })
  }

  try {
    const data = await prisma.sensorData.findMany({
      where: { recordId },
      orderBy: { timestamp: 'asc' },
      select: {
        timestamp: true,
        voltage: true,
        current: true,
      },
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching sensor data for record:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}