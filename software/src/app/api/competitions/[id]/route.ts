import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PATCH /api/competitions/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const competitionId = parseInt(params.id)

    if (isNaN(competitionId)) {
      return NextResponse.json({ error: 'Invalid competition ID' }, { status: 400 })
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
    console.error('Error updating competition:', error)
    return NextResponse.json({ error: 'Error updating competition' }, { status: 500 })
  }
}

// DELETE /api/competitions/:id
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const competitionId = parseInt(params.id)

    if (isNaN(competitionId)) {
      return NextResponse.json({ error: 'Invalid competition ID' }, { status: 400 })
    }

    await prisma.competition.delete({
      where: { id: competitionId },
    })

    return NextResponse.json({ message: 'Competition deleted successfully' })
  } catch (error) {
    console.error('Error deleting competition:', error)
    return NextResponse.json({ error: 'Error deleting competition' }, { status: 500 })
  }
}