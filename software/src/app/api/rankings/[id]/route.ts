import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PATCH /api/rankings/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const rankingId = parseInt(params.id)

    if (isNaN(rankingId)) {
      return NextResponse.json({ error: 'Invalid ranking ID' }, { status: 400 })
    }

    const updatedRanking = await prisma.ranking.update({
      where: { id: rankingId },
      data: body,
    })

    return NextResponse.json(updatedRanking)
  } catch (error) {
    console.error('Error updating ranking:', error)
    return NextResponse.json({ error: 'Error updating ranking' }, { status: 500 })
  }
}

// DELETE /api/rankings/:id
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const rankingId = parseInt(params.id)

    if (isNaN(rankingId)) {
      return NextResponse.json({ error: 'Invalid ranking ID' }, { status: 400 })
    }

    await prisma.ranking.delete({
      where: { id: rankingId },
    })

    return NextResponse.json({ message: 'Ranking deleted successfully' })
  } catch (error) {
    console.error('Error deleting ranking:', error)
    return NextResponse.json({ error: 'Error deleting ranking' }, { status: 500 })
  }
}