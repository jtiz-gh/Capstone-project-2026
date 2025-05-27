// app/api/records/[id]/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const recordId = parseInt(params.id)

    const record = await prisma.record.findUnique({
      where: { id: recordId },
      include: {
        device: {
          include: {
            team: true,
          },
        },
        race: true,
        competition: true,
        _count: {
          select: {
            sensorData: true,
          },
        },
      },
    })

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error("Error fetching record:", error)
    return NextResponse.json({ error: "Failed to fetch record" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const recordId = parseInt(params.id)
    const body = await request.json()

    const { disabled, timeOffset, sortOrder, competitionId } = body

    const updateData: any = {}
    if (disabled !== undefined) updateData.disabled = disabled
    if (timeOffset !== undefined) updateData.timeOffset = timeOffset
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder
    if (competitionId !== undefined) updateData.competitionId = competitionId

    const updatedRecord = await prisma.record.update({
      where: { id: recordId },
      data: updateData,
      include: {
        device: {
          include: {
            team: true,
          },
        },
        race: true,
        competition: true,
        _count: {
          select: {
            sensorData: true,
          },
        },
      },
    })

    return NextResponse.json(updatedRecord)
  } catch (error) {
    console.error("Error updating record:", error)
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const recordId = parseInt(params.id)

    // Soft delete by marking as disabled instead of actually deleting
    const updatedRecord = await prisma.record.update({
      where: { id: recordId },
      data: { disabled: true },
    })

    return NextResponse.json({ success: true, record: updatedRecord })
  } catch (error) {
    console.error("Error deleting record:", error)
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 })
  }
}
