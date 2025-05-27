// app/api/devices/[id]/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// PATCH /api/devices/:id
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const body = await req.json()
    const deviceId = parseInt(params.id)

    if (isNaN(deviceId)) {
      return NextResponse.json({ error: "Invalid device ID" }, { status: 400 })
    }

    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: body,
    })

    return NextResponse.json(updatedDevice)
  } catch (error) {
    console.error("Error updating device:", error)
    return NextResponse.json({ error: "Error updating device" }, { status: 500 })
  }
}

// DELETE /api/devices/:id
export async function DELETE(_: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const deviceId = parseInt(params.id)

    if (isNaN(deviceId)) {
      return NextResponse.json({ error: "Invalid device ID" }, { status: 400 })
    }

    await prisma.device.delete({
      where: { id: deviceId },
    })

    return NextResponse.json({ message: "Device deleted successfully" })
  } catch (error) {
    console.error("Error deleting device:", error)
    return NextResponse.json({ error: "Error deleting device" }, { status: 500 })
  }
}
