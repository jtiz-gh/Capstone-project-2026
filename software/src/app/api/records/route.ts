// app/api/records/route.ts

import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET /api/records
export async function GET() {
  try {
    const records = await prisma.record.findMany({
      include: {
        race: true,
        competition: true,
        device: {
          include: {
            team: true,
          },
        },
      },
      orderBy: {
        stopTime: 'desc',
      },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('Error fetching records:', error)
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
  }
}

// POST /api/records (optional — only if needed manually)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { raceId, competitionId, deviceId, avgVoltage, avgCurrent, energy } = body

    if (!raceId || !competitionId || !deviceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const record = await prisma.record.create({
      data: {
        raceId,
        competitionId,
        deviceId,
        avgVoltage,
        avgCurrent,
        energy,
        stopTime: new Date(),
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating record:', error)
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
}