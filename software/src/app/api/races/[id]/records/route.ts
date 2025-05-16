import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

// GET /api/races/:id/records
export async function GET(_: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const raceId = parseInt(params.id)

  if (isNaN(raceId)) {
    return NextResponse.json({ error: "Invalid race ID" }, { status: 400 })
  }

  try {
    const records = await prisma.record.findMany({
      where: { raceId },
      include: {
        competition: true,
        device: {
          include: {
            team: true,
          },
        },
      },
      orderBy: {
        stopTime: "desc",
      },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error("Error fetching records for race:", error)
    return NextResponse.json({ error: "Failed to fetch race records" }, { status: 500 })
  }
}
