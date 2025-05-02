// prisma/seed.ts

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // 1. Create some teams
  const team1 = await prisma.team.create({
    data: {
      teamName: 'Eco Racers',
      organisation: 'AUT Engineering',
    },
  })

  const team2 = await prisma.team.create({
    data: {
      teamName: 'Power Squad',
      organisation: 'Unitec',
    },
  })

  const team3 = await prisma.team.create({
    data: {
      teamName: 'Volt Velocity',
      organisation: 'Massey University',
    },
  })

  // 2. Add devices for teams
  const device1 = await prisma.device.create({
    data: {
      serialNo: 1001,
      vehicleType: 'EV Kart',
      vehicleClass: 'Light',
      teamId: team1.id,
    },
  })

  const device2 = await prisma.device.create({
    data: {
      serialNo: 1002,
      vehicleType: 'EV Kart',
      vehicleClass: 'Heavy',
      teamId: team2.id,
    },
  })

  const device3 = await prisma.device.create({
    data: {
      serialNo: 1003,
      vehicleType: 'EV Bike',
      vehicleClass: 'Light',
      teamId: team3.id,
    },
  })

  // 3. Add device configs
  await prisma.deviceConfig.createMany({
    data: [
      { deviceId: device1.id, settings: { maxSpeed: 40, throttleCap: 80 }, configName: 'Standard Config' },
      { deviceId: device2.id, settings: { maxSpeed: 35, throttleCap: 70 }, configName: 'Conservative Config' },
      { deviceId: device3.id, settings: { maxSpeed: 45, throttleCap: 90 }, configName: 'Aggressive Config' },
    ]
  })

  // 4. Add device statuses
  await prisma.deviceStatus.createMany({
    data: [
      { deviceId: device1.id, internalTemperature: 38.5, flashMemoryUsage: 67.5, voltage: 13.1, current: 2.0 },
      { deviceId: device2.id, internalTemperature: 41.2, flashMemoryUsage: 72.3, voltage: 12.9, current: 2.1 },
      { deviceId: device3.id, internalTemperature: 36.7, flashMemoryUsage: 55.1, voltage: 13.5, current: 1.7 },
    ]
  })

  // 5. Add a competition
  const comp = await prisma.competition.create({
    data: {
      vehicleClass: 'Light',
      competitionDate: new Date(),
    },
  })

  // 6. Add an event
  const event = await prisma.event.create({
    data: {
      eventType: 'Endurance',
      date: new Date(),
      eventName: 'National Finals',
      eventStartTime: new Date(),
      raceStartTime: new Date(),
    },
  })

  // 7. Create records and sensor data for each device
  for (const [device, sessionId] of [[device1, 1], [device2, 2], [device3, 3]] as const) {
    const record = await prisma.record.create({
      data: {
        deviceId: device.id,
        eventId: event.id,
        competitionId: comp.id,
        avgVoltage: 13 + Math.random(),
        avgCurrent: 1.8 + Math.random(),
        energy: 14 + Math.random(),
        stopTime: new Date(),
      },
    })

    await prisma.sensorData.createMany({
      data: [
        {
          timestamp: Date.now(),
          voltage: 13.1 + Math.random(),
          current: 1.9 + Math.random(),
          sessionId,
          recordId: record.id,
          deviceId: device.id,
        },
        {
          timestamp: Date.now() + 1000,
          voltage: 13.2 + Math.random(),
          current: 1.8 + Math.random(),
          sessionId,
          recordId: record.id,
          deviceId: device.id,
        },
        {
          timestamp: Date.now() + 2000,
          voltage: 13.0 + Math.random(),
          current: 2.0 + Math.random(),
          sessionId,
          recordId: record.id,
          deviceId: device.id,
        },
      ]
    })
  }

  // 8. Add rankings
  await prisma.ranking.createMany({
    data: [
      { eventId: event.id, teamId: team1.id, rank: 1 },
      { eventId: event.id, teamId: team2.id, rank: 2 },
      { eventId: event.id, teamId: team3.id, rank: 3 },
    ]
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
