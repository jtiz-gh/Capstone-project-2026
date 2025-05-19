import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET /api/races/:id/rankings
export async function GET(_: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const raceId = parseInt(params.id)

    if (isNaN(raceId)) {
      return NextResponse.json({ error: "Invalid race ID" }, { status: 400 })
    }

    const rankings = await prisma.ranking.findMany({
      where: { raceId },
      include: {
        team: true,
      },
      orderBy: {
        rank: "asc",
      },
    })

    return NextResponse.json(rankings)
  } catch (error) {
    console.error("Error fetching race rankings:", error)
    return NextResponse.json({ error: "Error fetching race rankings" }, { status: 500 })
  }
}
