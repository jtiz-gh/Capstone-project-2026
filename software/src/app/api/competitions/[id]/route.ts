import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/competitions/:id
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const competitionId = parseInt(id)

    if (isNaN(competitionId)) {
      return NextResponse.json({ error: "Invalid competition ID" }, { status: 400 })
    }

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        teams: true,
        races: {
          include: {
            event: true,
            records: {
              include: {
                device: true,
              },
            },
            rankings: true,
          },
        },
      },
    })

    if (!competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 })
    }

    return NextResponse.json(competition)
  } catch (error) {
    console.error("Error fetching competition:", error)
    return NextResponse.json({ error: "Error fetching competition" }, { status: 500 })
  }
}

// PATCH /api/competitions/:id
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const competitionId = parseInt(params.id)
    const body = await request.json()

    if (isNaN(competitionId)) {
      return NextResponse.json({ error: "Invalid competition ID" }, { status: 400 })
    }

    const updatedCompetition = await prisma.competition.update({
      where: { id: competitionId },
      data: {
        ...body,
        competitionDate: body.competitionDate ? new Date(body.competitionDate) : undefined,
      },
    })

    return NextResponse.json(updatedCompetition)
  } catch (error) {
    console.error("Error updating competition:", error)
    return NextResponse.json({ error: "Error updating competition" }, { status: 500 })
  }
}

// DELETE /api/competitions/:id
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const competitionId = parseInt(params.id)

    if (isNaN(competitionId)) {
      return NextResponse.json({ error: "Invalid competition ID" }, { status: 400 })
    }

    await prisma.competition.delete({
      where: { id: competitionId },
    })

    return NextResponse.json({ message: "Competition deleted successfully" })
  } catch (error) {
    console.error("Error deleting competition:", error)
    return NextResponse.json({ error: "Error deleting competition" }, { status: 500 })
  }
}
