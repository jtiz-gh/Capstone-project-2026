// app/api/records/batch-update/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { updates } = body

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "Updates array is required" }, { status: 400 })
    }

    // Update records in batch
    const updatePromises = updates.map((update) => {
      const { id, sortOrder, timeOffset, disabled } = update
      const updateData: any = {}

      if (sortOrder !== undefined) updateData.sortOrder = sortOrder
      if (timeOffset !== undefined) updateData.timeOffset = timeOffset
      if (disabled !== undefined) updateData.disabled = disabled

      return prisma.record.update({
        where: { id: parseInt(id) },
        data: updateData,
      })
    })

    await Promise.all(updatePromises)

    return NextResponse.json({ success: true, updatedCount: updates.length })
  } catch (error) {
    console.error("Error batch updating records:", error)
    return NextResponse.json({ error: "Failed to update records" }, { status: 500 })
  }
}
