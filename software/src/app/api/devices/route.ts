// app/api/devices/route.ts

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/devices
export async function GET() {
  try {
    const devices = await prisma.device.findMany({
      include: {
        team: true,
        config: true,
        deviceStatus: true,
      },
    })
    return NextResponse.json(devices)
  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json({ error: 'Error fetching devices' }, { status: 500 })
  }
}

// POST /api/devices
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { serialNo, vehicleType, vehicleClass, teamId } = body

    if (!serialNo || !vehicleType || !vehicleClass || !teamId) {
      return NextResponse.json(
        { error: 'Missing required fields: serialNo, vehicleType, vehicleClass, teamId' },
        { status: 400 }
      )
    }

    // Ensure the team exists
    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const newDevice = await prisma.device.create({
      data: {
        serialNo,
        teamId,
      },
    })

    return NextResponse.json(newDevice, { status: 201 })
  } catch (error) {
    console.error('Error creating device:', error)
    return NextResponse.json({ error: 'Error creating device' }, { status: 500 })
  }
}
