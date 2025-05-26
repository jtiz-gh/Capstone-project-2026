import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(_: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const teamId = parseInt(params.id)

  if (isNaN(teamId)) {
    return NextResponse.json({ error: "Invalid team ID" }, { status: 400 })
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
  })

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 })
  }

  return NextResponse.json(team)
}

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
    const { rankings, devices, id, ...teamData } = body

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: teamData,
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
