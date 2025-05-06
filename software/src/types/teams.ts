export type Team = {
  id: number
  teamName: string
  vehicleClass: "Open" | "Standard"
  vehicleType: "Bike" | "Kart"
}

export type EventType = {
  id: number
  name: string
}

export type Event = {
  id: number
  eventName: string
  eventType: string
  completed: boolean
  // hasData: boolean
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
  events: Event[]
  teams: Team[]
  results: Result[]
}
