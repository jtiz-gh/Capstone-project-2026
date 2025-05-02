// app/api/competitions/route.ts

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/competitions
export async function GET() {
  try {
    const competitions = await prisma.competition.findMany({
      include: { records: true }, // Include related records if needed
    })
    return NextResponse.json(competitions)
  } catch (error) {
    console.error('Error fetching competitions:', error)
    return NextResponse.json({ error: 'Error fetching competitions' }, { status: 500 })
  }
}

// POST /api/competitions
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { vehicleClass, competitionDate } = body

    if (!vehicleClass || !competitionDate) {
      return NextResponse.json({ error: 'Missing vehicleClass or competitionDate' }, { status: 400 })
    }

    const newCompetition = await prisma.competition.create({
      data: {
        vehicleClass,
        competitionDate: new Date(competitionDate),
      },
    })

    return NextResponse.json(newCompetition, { status: 201 })
  } catch (error) {
    console.error('Error creating competition:', error)
    return NextResponse.json({ error: 'Error creating competition' }, { status: 500 })
  }
}