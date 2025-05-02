import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/events/:id/rankings
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const eventId = parseInt(params.id)

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const rankings = await prisma.ranking.findMany({
      where: { eventId },
      include: {
        team: true,
      },
      orderBy: {
        rank: 'asc',
      },
    })

    return NextResponse.json(rankings)
  } catch (error) {
    console.error('Error fetching event rankings:', error)
    return NextResponse.json({ error: 'Error fetching event rankings' }, { status: 500 })
  }
}