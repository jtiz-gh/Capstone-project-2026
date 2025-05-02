import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PATCH /api/teams/[id]
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const teamId = parseInt(params.id)

  if (isNaN(teamId)) {
    return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 })
  }

  const updatedTeam = await prisma.team.update({
    where: { id: teamId },
    data: body,
  })

  return NextResponse.json(updatedTeam)
}

// DELETE /api/teams/[id]
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const teamId = parseInt(params.id)

  if (isNaN(teamId)) {
    return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 })
  }

  await prisma.team.delete({
    where: { id: teamId },
  })

  return NextResponse.json({ message: 'Team deleted successfully' })
}