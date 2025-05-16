import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// PATCH /api/teams/[id]
export async function PATCH(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const idParam = url.pathname.split("/").pop()
    const teamId = parseInt(idParam || "", 10)

    if (isNaN(teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 })
    }

    const body = await req.json()

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: body,
    })

    return NextResponse.json(updatedTeam)
  } catch (error) {
    console.error("Error updating team:", error)
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 })
  }
}

// DELETE /api/teams/[id]
export async function DELETE(_: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const teamId = parseInt(params.id)

  if (isNaN(teamId)) {
    return NextResponse.json({ error: "Invalid team ID" }, { status: 400 })
  }

  await prisma.team.delete({
    where: { id: teamId },
  })

  return NextResponse.json({ message: "Team deleted successfully" })
}
