export type Team = {
  id: string
  name: string
  vehicleClass: "Open" | "Standard"
  vehicleType: "Bike" | "Kart"
}

export type EventType = "Gymkhana" | "Drag Race" | "Endurance & Efficiency"

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
