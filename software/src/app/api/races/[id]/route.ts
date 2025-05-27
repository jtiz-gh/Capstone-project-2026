import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// PATCH /api/races/:id
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const body = await req.json()
    const raceId = parseInt(params.id)

    if (isNaN(raceId)) {
      return NextResponse.json({ error: "Invalid race ID" }, { status: 400 })
    }

    const updatedRace = await prisma.race.update({
      where: { id: raceId },
      data: {
        ...body,
        date: body.date ? new Date(body.date) : undefined,
        eventStartTime: body.eventStartTime ? new Date(body.eventStartTime) : undefined,
        raceStartTime: body.raceStartTime ? new Date(body.raceStartTime) : undefined,
      },
    })

    return NextResponse.json(updatedRace)
  } catch (error) {
    console.error("Error updating race:", error)
    return NextResponse.json({ error: "Error updating race" }, { status: 500 })
  }
}

// DELETE /api/races/:id
export async function DELETE(_: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const raceId = parseInt(params.id)

    if (isNaN(raceId)) {
      return NextResponse.json({ error: "Invalid race ID" }, { status: 400 })
    }

    await prisma.race.delete({
      where: { id: raceId },
    })

    return NextResponse.json({ message: "race deleted successfully" })
  } catch (error) {
    console.error("Error deleting race:", error)
    return NextResponse.json({ error: "Error deleting race" }, { status: 500 })
  }
}
