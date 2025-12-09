// app/api/records/unassign/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/records/unassign
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { recordIds } = body

    if (!recordIds || !Array.isArray(recordIds)) {
      return NextResponse.json({ error: "recordIds array is required" }, { status: 400 })
    }

    // Update the records to unassign them from competitions
    const updatedRecords = await prisma.record.updateMany({
      where: {
        id: { in: recordIds.map((id) => parseInt(id)) },
      },
      data: {
        competitionId: null,
      },
    })

    return NextResponse.json({
      message: `Successfully unassigned ${updatedRecords.count} records`,
      count: updatedRecords.count,
    })
  } catch (error) {
    console.error("Error unassigning records:", error)
    return NextResponse.json({ error: "Failed to unassign records" }, { status: 500 })
  }
}
