import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const recordId = parseInt(params.id)
    const { disabled } = await request.json()

    if (isNaN(recordId)) {
      return NextResponse.json({ error: "Invalid record ID" }, { status: 400 })
    }

    if (typeof disabled !== "boolean") {
      return NextResponse.json({ error: "disabled must be a boolean" }, { status: 400 })
    }

    // Update the record's disabled status
    const updatedRecord = await prisma.record.update({
      where: { id: recordId },
      data: { disabled },
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
    console.error("Error toggling record disabled status:", error)
    return NextResponse.json({ error: "Failed to toggle record status" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
