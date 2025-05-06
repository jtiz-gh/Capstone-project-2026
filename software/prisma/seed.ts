// prisma/seed.ts

import { Prisma, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // 1. Create some teams
  const team1 = await prisma.team.create({
    data: {
      teamName: 'Eco Racers',
      vehicleType: 'Kart',
      vehicleClass: 'Open'
    },
  })

  const team2 = await prisma.team.create({
    data: {
      teamName: 'Power Squad',
      vehicleType: 'Kart',
      vehicleClass: 'Standard'
    },
  })

  const team3 = await prisma.team.create({
    data: {
      teamName: 'Volt Velocity',
      vehicleType: 'Bike',
      vehicleClass: 'Open'
    },
  })

  // 2. Add devices for teams
  const device1 = await prisma.device.create({
    data: {
      serialNo: 1001,
      teamId: team1.id,
    },
  })

  const device2 = await prisma.device.create({
    data: {
      serialNo: 1002,
      teamId: team2.id,
    },
  })

  const device3 = await prisma.device.create({
    data: {
      serialNo: 1003,
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

  // 4. Add events
  const event1 = await prisma.event.create({
    data: {
      eventType: 'Dynamic',
      date: new Date(),
      eventName: 'Endurance',
      eventStartTime: new Date(),
      raceStartTime: new Date(),
    },
  })

  const event2 = await prisma.event.create({
    data: {
      eventType: 'Dynamic',
      date: new Date(),
      eventName: 'Drag Race',
      eventStartTime: new Date(),
      raceStartTime: new Date(),
    },
  })

  const event3 = await prisma.event.create({
    data: {
      eventType: 'Dynamic',
      date: new Date(),
      eventName: 'other event i forgot the name of',
      eventStartTime: new Date(),
      raceStartTime: new Date(),
    },
  })

    
  // 5. Add a competition
  const comp = await prisma.competition.create({
    data: {
      competitionDate: new Date(),
      competitionName: "Competition 1",
      teams: {
        connect: [
          { id: team1.id },
          { id: team2.id },
          { id: team3.id }
        ]
      },
      events: {
        connect: [
          { id: event1.id },
          { id: event2.id },
          { id: event3.id }
        ]
      }
    },
  })

// 6. Create records and sensor data for each device
for (const [device, sessionId] of [[device1, 1], [device2, 2], [device3, 3]] as const) {
  const record = await prisma.record.create({
    data: {
      deviceId: device.id,
      eventId: event1.id,
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
        timestamp: new Prisma.Decimal(Date.now()), // Decimal timestamp
        sessionId,
        recordId: record.id,
        deviceId: device.id,
        measurementId: Math.random(),
        avgPower: Math.random() * 10,
        avgVoltage: 13 + Math.random(),
        avgCurrent: 1 + Math.random(),
        peakPower: 20 + Math.random(),
        peakVoltage: 14 + Math.random(),
        peakCurrent: 2.5 + Math.random(),
        energy: 50 + Math.random(),
        temperature: 22 + Math.random(),
      },
      {
        timestamp: new Prisma.Decimal(Date.now() + 1000),
        sessionId,
        recordId: record.id,
        deviceId: device.id,
        measurementId: Math.random(),
        avgPower: Math.random() * 10,
        avgVoltage: 13 + Math.random(),
        avgCurrent: 1 + Math.random(),
        peakPower: 20 + Math.random(),
        peakVoltage: 14 + Math.random(),
        peakCurrent: 2.5 + Math.random(),
        energy: 50 + Math.random(),
        temperature: 22 + Math.random(),
      },
      {
        timestamp: new Prisma.Decimal(Date.now() + 2000),
        sessionId,
        recordId: record.id,
        deviceId: device.id,
        measurementId: Math.random(),
        avgPower: Math.random() * 10,
        avgVoltage: 13 + Math.random(),
        avgCurrent: 1 + Math.random(),
        peakPower: 20 + Math.random(),
        peakVoltage: 14 + Math.random(),
        peakCurrent: 2.5 + Math.random(),
        energy: 50 + Math.random(),
        temperature: 22 + Math.random(),
      },
    ],
  })
}

  // 7. Add rankings
  await prisma.ranking.createMany({
    data: [
      { eventId: event1.id, teamId: team1.id, rank: 1 },
      { eventId: event1.id, teamId: team2.id, rank: 2 },
      { eventId: event1.id, teamId: team3.id, rank: 3 },
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
