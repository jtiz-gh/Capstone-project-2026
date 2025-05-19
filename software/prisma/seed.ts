// prisma/seed.ts

import { Prisma, PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  // 1. Create some teams
  const team1 = await prisma.team.create({
    data: {
      teamName: "Eco Racers",
      vehicleType: "Kart",
      vehicleClass: "Open",
    },
  })

  const team2 = await prisma.team.create({
    data: {
      teamName: "Power Squad",
      vehicleType: "Kart",
      vehicleClass: "Standard",
    },
  })

  const team3 = await prisma.team.create({
    data: {
      teamName: "Volt Velocity",
      vehicleType: "Bike",
      vehicleClass: "Open",
    },
  })

  const team4 = await prisma.team.create({
    data: {
      teamName: "A",
      vehicleType: "Kart",
      vehicleClass: "Open",
    },
  })

  const team5 = await prisma.team.create({
    data: {
      teamName: "B",
      vehicleType: "Kart",
      vehicleClass: "Standard",
    },
  })

  const team6 = await prisma.team.create({
    data: {
      teamName: "C",
      vehicleType: "Bike",
      vehicleClass: "Open",
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

  const device4 = await prisma.device.create({
    data: {
      serialNo: 1004,
      teamId: team4.id,
    },
  })

  const device5 = await prisma.device.create({
    data: {
      serialNo: 1005,
      teamId: team5.id,
    },
  })

  const device6 = await prisma.device.create({
    data: {
      serialNo: 1006,
      teamId: team6.id,
    },
  })

  // 3. Add device configs
  await prisma.deviceConfig.createMany({
    data: [
      {
        deviceId: device1.id,
        settings: { maxSpeed: 40, throttleCap: 80 },
        configName: "Standard Config",
      },
      {
        deviceId: device2.id,
        settings: { maxSpeed: 35, throttleCap: 70 },
        configName: "Conservative Config",
      },
      {
        deviceId: device3.id,
        settings: { maxSpeed: 45, throttleCap: 90 },
        configName: "Aggressive Config",
      },
      {
        deviceId: device4.id,
        settings: { maxSpeed: 40, throttleCap: 80 },
        configName: "Standard Config",
      },
      {
        deviceId: device5.id,
        settings: { maxSpeed: 35, throttleCap: 70 },
        configName: "Conservative Config",
      },
      {
        deviceId: device6.id,
        settings: { maxSpeed: 45, throttleCap: 90 },
        configName: "Aggressive Config",
      },
    ],
  })

  // 4. Add events
  const event1 = await prisma.event.create({
    data: {
      eventType: "Dynamic",
      eventName: "Endurance",
    },
  })

  const event2 = await prisma.event.create({
    data: {
      eventType: "Dynamic",
      eventName: "Drag Race",
    },
  })

  const event3 = await prisma.event.create({
    data: {
      eventType: "Dynamic",
      eventName: "Gymkhana",
    },
  })

  // const now = new Date()
  const race1 = await prisma.race.create({
    data: {
      eventId: event1.id,
      // date: now,
      // eventStartTime: now,
      // raceStartTime: new Date(now.getTime() + 10 * 60 * 1000),
    },
  })

  const race2 = await prisma.race.create({
    data: {
      eventId: event2.id,
      // date: now,
      // eventStartTime: now,
      // raceStartTime: new Date(now.getTime() + 20 * 60 * 1000),
    },
  })

  const race3 = await prisma.race.create({
    data: {
      eventId: event3.id,
      // date: now,
      // eventStartTime: now,
      // raceStartTime: new Date(now.getTime() + 30 * 60 * 1000),
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
          { id: team3.id },
          { id: team4.id },
          { id: team5.id },
          { id: team6.id },
        ],
      },
      races: {
        connect: [{ id: race1.id }, { id: race2.id }, { id: race3.id }],
      },
    },
  })

  // 6. Create records and sensor data for each device
  const timestamp = 1746575178121
  let offset = 1000
  for (const [device, sessionId] of [
    [device1, 1],
    [device2, 2],
    [device3, 3],
    [device4, 4],
    [device5, 5],
    [device6, 6],
  ] as const) {
    const record = await prisma.record.create({
      data: {
        deviceId: device.id,
        raceId: race1.id,
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
          timestamp: timestamp + offset,
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
          timestamp: timestamp + offset * 2,
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
          timestamp: timestamp + offset * 3,
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
    offset *= 3
  }

  for (const [device, sessionId] of [
    [device1, 1],
    [device2, 2],
    [device3, 3],
    [device4, 4],
    [device5, 5],
    [device6, 6],
  ] as const) {
    const record = await prisma.record.create({
      data: {
        deviceId: device.id,
        raceId: race2.id,
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
          timestamp: timestamp + offset,
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
          timestamp: timestamp + offset * 2,
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
          timestamp: timestamp + offset * 3,
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
    offset *= 3
  }

  for (const [device, sessionId] of [
    [device1, 1],
    [device2, 2],
    [device3, 3],
    [device4, 4],
    [device5, 5],
    [device6, 6],
  ] as const) {
    const record = await prisma.record.create({
      data: {
        deviceId: device.id,
        raceId: race3.id,
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
          timestamp: timestamp + offset,
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
          timestamp: timestamp + offset * 2,
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
          timestamp: timestamp + offset * 3,
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
    offset *= 3
  }

  // 7. Add rankings
  // await prisma.ranking.createMany({
  //   data: [
  //     { eventId: event1.id, teamId: team1.id, rank: 1 },
  //     { eventId: event1.id, teamId: team2.id, rank: 2 },
  //     { eventId: event1.id, teamId: team3.id, rank: 3 },
  //   ]
  // })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
