export type Ranking = {
  id: number
  teamId: number
  raceId: number
  rank: number
  team?: Team
  event?: Event
  finishStatus?: "DNS" | "DNF" | "DQ" | ""
}

export type Team = {
  id: number
  teamName: string
  vehicleClass: "Open" | "Standard"
  vehicleType: "Bike" | "Kart"
  rankings?: Ranking[]
}

// export type EventType = {
//   id: number
//   name: string
// }

export type Event = {
  id: number
  eventName: string
  eventType: "Static" | "Dynamic"
  completed?: boolean
}

export type Race = {
  id: number
  eventId: number
  event: Event
  completed: boolean
  rankings: Ranking[]
}

export type Result = {
  teamId: string
  eventId: string
  position: number
  time?: number
  score?: number
}

export type Competition = {
  id: number
  competitionName: string
  date: Date
  races: Race[]
  teams: Team[]
  results: Result[]
}

export type RaceRecord = {
  id: number
  raceId: number
  deviceId: number
  competitionId: number
  device: Device
  avgCurrent: number
}

export type Device = {
  id: number
  serialNo: number
  teamId: number
}
