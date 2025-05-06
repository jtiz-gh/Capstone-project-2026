export type Team = {
  id: number
  teamName: string
  vehicleClass: "Open" | "Standard"
  vehicleType: "Bike" | "Kart"
}

export type EventType = {
  id: string
  name: string
}

export type Event = {
  id: string
  type: EventType
  completed: boolean
  hasData: boolean
}

export type Result = {
  teamId: string
  eventId: string
  position: number
  time?: number
  score?: number
}

export type Competition = {
  id: string
  name: string
  events: Event[]
  teams: string[]
  results: Result[]
}
