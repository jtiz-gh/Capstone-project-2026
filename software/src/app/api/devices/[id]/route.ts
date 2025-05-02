// app/api/devices/[id]/route.ts

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PATCH /api/devices/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const deviceId = parseInt(params.id)

    if (isNaN(deviceId)) {
      return NextResponse.json({ error: 'Invalid device ID' }, { status: 400 })
    }

    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: body,
    })

    return NextResponse.json(updatedDevice)
  } catch (error) {
    console.error('Error updating device:', error)
    return NextResponse.json({ error: 'Error updating device' }, { status: 500 })
  }
}

// DELETE /api/devices/:id
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const deviceId = parseInt(params.id)

    if (isNaN(deviceId)) {
      return NextResponse.json({ error: 'Invalid device ID' }, { status: 400 })
    }

    await prisma.device.delete({
      where: { id: deviceId },
    })

    return NextResponse.json({ message: 'Device deleted successfully' })
  } catch (error) {
    console.error('Error deleting device:', error)
    return NextResponse.json({ error: 'Error deleting device' }, { status: 500 })
  }
}
