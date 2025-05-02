import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/rankings
export async function GET() {
  try {
    const rankings = await prisma.ranking.findMany({
      include: {
        team: true,
        event: true,
      },
      orderBy: {
        eventId: 'asc',
      },
    })
    return NextResponse.json(rankings)
  } catch (error) {
    console.error('Error fetching rankings:', error)
    return NextResponse.json({ error: 'Error fetching rankings' }, { status: 500 })
  }
}

// POST /api/rankings
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { teamId, eventId, rank } = body

    if (!teamId || !eventId || rank == null) {
      return NextResponse.json({ error: 'Missing teamId, eventId, or rank' }, { status: 400 })
    }

    const newRanking = await prisma.ranking.create({
      data: {
        teamId,
        eventId,
        rank,
      },
    })

    return NextResponse.json(newRanking, { status: 201 })
  } catch (error) {
    console.error('Error creating ranking:', error)
    return NextResponse.json({ error: 'Error creating ranking' }, { status: 500 })
  }
}