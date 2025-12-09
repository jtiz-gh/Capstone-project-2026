// prisma/seed.ts
import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

// Map driver codes to device/session assignments
const driverDeviceSession = [
  { driver: "SAI", deviceSerial: "1001", sessionId: 1 },
  { driver: "VER", deviceSerial: "1002", sessionId: 2 },
  { driver: "HAM", deviceSerial: "1003", sessionId: 3 },
  { driver: "TSU", deviceSerial: "1004", sessionId: 4 },
  { driver: "LEC", deviceSerial: "1005", sessionId: 5 },
  { driver: "VER", deviceSerial: "1006", sessionId: 6 },
  { driver: "SAI", deviceSerial: "1007", sessionId: 7 },
  { driver: "TSU", deviceSerial: "1008", sessionId: 8 },
  { driver: "VER", deviceSerial: "1009", sessionId: 9 },
  { driver: "LEC", deviceSerial: "1010", sessionId: 10 },
]

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

  const team7 = await prisma.team.create({
    data: {
      teamName: "D",
      vehicleType: "Kart",
      vehicleClass: "Standard",
    },
  })

  const team8 = await prisma.team.create({
    data: {
      teamName: "E",
      vehicleType: "Kart",
      vehicleClass: "Standard",
    },
  })

  const team9 = await prisma.team.create({
    data: {
      teamName: "F",
      vehicleType: "Kart",
      vehicleClass: "Standard",
    },
  })

  const team10 = await prisma.team.create({
    data: {
      teamName: "G",
      vehicleType: "Kart",
      vehicleClass: "Standard",
    },
  })

  // 2. Add devices for teams
  const device1 = await prisma.device.create({
    data: {
      serialNo: "1001",
      teamId: team1.id,
    },
  })

  const device2 = await prisma.device.create({
    data: {
      serialNo: "1002",
      teamId: team2.id,
    },
  })

  const device3 = await prisma.device.create({
    data: {
      serialNo: "1003",
      teamId: team3.id,
    },
  })

  const device4 = await prisma.device.create({
    data: {
      serialNo: "1004",
      teamId: team4.id,
    },
  })

  const device5 = await prisma.device.create({
    data: {
      serialNo: "1005",
      teamId: team5.id,
    },
  })

  const device6 = await prisma.device.create({
    data: {
      serialNo: "1006",
      teamId: team6.id,
    },
  })

  const device7 = await prisma.device.create({
    data: {
      serialNo: "1007",
      teamId: team7.id,
    },
  })

  const device8 = await prisma.device.create({
    data: {
      serialNo: "1008",
      teamId: team8.id,
    },
  })

  const device9 = await prisma.device.create({
    data: {
      serialNo: "1009",
      teamId: team9.id,
    },
  })

  const device10 = await prisma.device.create({
    data: {
      serialNo: "1010",
      teamId: team10.id,
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
      {
        deviceId: device7.id,
        settings: { maxSpeed: 35, throttleCap: 70 },
        configName: "Conservative Config",
      },
      {
        deviceId: device8.id,
        settings: { maxSpeed: 35, throttleCap: 70 },
        configName: "Conservative Config",
      },
      {
        deviceId: device9.id,
        settings: { maxSpeed: 35, throttleCap: 70 },
        configName: "Conservative Config",
      },
      {
        deviceId: device10.id,
        settings: { maxSpeed: 35, throttleCap: 70 },
        configName: "Conservative Config",
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
          { id: team7.id },
          { id: team8.id },
          { id: team9.id },
          { id: team10.id },
        ],
      },
      races: {
        connect: [{ id: race1.id }, { id: race2.id }, { id: race3.id }],
      },
    },
  })

  // 6. Use JSON files for race data records and sensorData
  const devices = [device1, device2, device3, device4, device5, device6, device7, device8, device9, device10]
  const races = [race1, race2, race3]
  for (let i = 0; i < driverDeviceSession.length; i++) {
    const { driver, deviceSerial, sessionId } = driverDeviceSession[i]
    const device = devices.find(d => d.serialNo === deviceSerial)
    if (!device) {
      console.warn(`Device with serial ${deviceSerial} not found, skipping ${driver}`)
      continue
    }
    // Loop through all races
    for (let r = 0; r < races.length; r++) {
      const race = races[r]
      // Create a record for this device/race/competition
      const record = await prisma.record.create({
        data: {
          deviceId: device.id,
          raceId: race.id,
          competitionId: comp.id,
          avgVoltage: 13 + Math.random(),
          avgCurrent: 1.8 + Math.random(),
          energy: 14 + Math.random(),
          stopTime: new Date(),
        },
      })
      // Read JSON data
      const jsonPath = path.join(__dirname, "seed-data", `simdata_${driver}.json`)
      if (!fs.existsSync(jsonPath)) {
        console.warn(`No JSON for driver ${driver} at ${jsonPath}`)
        continue
      }
      const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))
      // Patch deviceId and recordId
      for (const entry of jsonData) {
        entry.deviceId = device.id
        entry.recordId = record.id
        entry.sessionId = sessionId
      }
      // Insert sensor data
      await prisma.sensorData.createMany({ data: jsonData })
      console.log(`Seeded ${jsonData.length} sensorData for ${driver} in race ${race.id}`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
