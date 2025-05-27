import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/rankings
export async function GET() {
  try {
    const rankings = await prisma.ranking.findMany({
      include: {
        team: true,
        race: true,
      },
      orderBy: {
        raceId: "asc",
      },
    })
    return NextResponse.json(rankings)
  } catch (error) {
    console.error("Error fetching rankings:", error)
    return NextResponse.json({ error: "Error fetching rankings" }, { status: 500 })
  }
}

// POST /api/rankings
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { teamId, raceId, rank, score } = body

    if (!teamId || !raceId || rank == null) {
      return NextResponse.json({ error: "Missing teamId, raceId, or rank" }, { status: 400 })
    }

    const newRanking = await prisma.ranking.create({
      data: {
        teamId,
        raceId,
        rank,
        score,
      },
    })

    return NextResponse.json(newRanking, { status: 201 })
  } catch (error) {
    console.error("Error creating ranking:", error)
    return NextResponse.json({ error: "Error creating ranking" }, { status: 500 })
  }
}
