import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET /api/events/:id/records
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const eventId = parseInt(params.id)

  if (isNaN(eventId)) {
    return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  }

  try {
    const records = await prisma.record.findMany({
      where: { eventId },
      include: {
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
    console.error('Error fetching records for event:', error)
    return NextResponse.json({ error: 'Failed to fetch event records' }, { status: 500 })
  }
}