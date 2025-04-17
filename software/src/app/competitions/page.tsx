"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, ArrowLeft, Trophy, Users, Activity, Clock } from "lucide-react"
import Link from "next/link"

// Define types
type Team = {
  id: string
  name: string
  vehicleClass: "Open" | "Standard"
  vehicleType: "Bike" | "Kart"
}

type EventType = "Gymkhana" | "Drag Race" | "Endurance & Efficiency"
type Event = {
  id: string
  type: EventType
  completed: boolean
  hasData: boolean
}

type Result = {
  teamId: string
  eventId: string
  position: number
  time?: number
  score?: number
}

type Competition = {
  id: string
  name: string
  events: Event[]
  teams: string[]
  results: Result[]
}

// Sample data
// TODO: Need to get team and event data from backend
const sampleTeams: Team[] = [
  { id: "1", name: "Speed Demons", vehicleClass: "Open", vehicleType: "Kart" },
  { id: "2", name: "Electric Riders", vehicleClass: "Standard", vehicleType: "Bike" },
  { id: "3", name: "Voltage Racers", vehicleClass: "Open", vehicleType: "Kart" },
  { id: "4", name: "Green Lightning", vehicleClass: "Standard", vehicleType: "Bike" },
  { id: "5", name: "Power Surge", vehicleClass: "Open", vehicleType: "Kart" },
]

const eventTypes: EventType[] = ["Gymkhana", "Drag Race", "Endurance & Efficiency"]

export default function CompetitionsPage() {
  // State for competitions
  const [competitions, setCompetitions] = useState<Competition[]>([
    {
      id: "1",
      name: "Regional Finals 2023",
      events: [
        { id: "e1", type: "Gymkhana", completed: true, hasData: true },
        { id: "e2", type: "Drag Race", completed: true, hasData: true },
        { id: "e3", type: "Endurance & Efficiency", completed: false, hasData: false },
      ],
      teams: ["1", "2", "3", "4"],
      results: [
        { teamId: "1", eventId: "e1", position: 1, time: 45.2 },
        { teamId: "2", eventId: "e1", position: 2, time: 47.8 },
        { teamId: "3", eventId: "e1", position: 3, time: 48.5 },
        { teamId: "4", eventId: "e1", position: 4, time: 52.1 },
        { teamId: "2", eventId: "e2", position: 1, time: 12.3 },
        { teamId: "1", eventId: "e2", position: 2, time: 13.1 },
        { teamId: "4", eventId: "e2", position: 3, time: 14.7 },
        { teamId: "3", eventId: "e2", position: 4, time: 15.2 },
      ],
    },
  ])

  // State for form
  const [competitionName, setCompetitionName] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<EventType[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])

  // State for viewing competition details
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [activeTab, setActiveTab] = useState("view")
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  // Load selected competition details
  useEffect(() => {
    if (selectedCompetition) {
      const competition = competitions.find((c) => c.id === selectedCompetition.id)
      if (competition) {
        setSelectedCompetition(competition)
      }
    }
  }, [competitions, selectedCompetition])

  // Handle creating a new competition
  const handleCreateCompetition = (e: React.FormEvent) => {
    e.preventDefault()

    if (!competitionName.trim() || selectedEvents.length < 3 || selectedTeams.length === 0) {
      alert(
        "Please fill in all required fields. Competitions need a name, at least 3 events, and at least one team."
      )
      return
    }

    const newCompetition: Competition = {
      id: Date.now().toString(),
      name: competitionName,
      events: selectedEvents.map((type, index) => ({
        id: `e${Date.now()}-${index}`,
        type,
        completed: false,
        hasData: false,
      })),
      teams: selectedTeams,
      results: [],
    }

    setCompetitions([...competitions, newCompetition])
    setCompetitionName("")
    setSelectedEvents([])
    setSelectedTeams([])
    setActiveTab("view")
  }

  // Handle toggling event selection
  const toggleEvent = (event: EventType) => {
    if (selectedEvents.includes(event)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== event))
    } else {
      setSelectedEvents([...selectedEvents, event])
    }
  }

  // Handle toggling team selection
  const toggleTeam = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(selectedTeams.filter((id) => id !== teamId))
    } else {
      setSelectedTeams([...selectedTeams, teamId])
    }
  }

  // Handle marking an event as completed and connecting ECUs
  // TODO: Need to actually connect to ECUs
  const handleConnectECUs = (competitionId: string, eventId: string) => {
    setCompetitions(
      competitions.map((competition) => {
        if (competition.id === competitionId) {
          // Update the event to be completed and have data
          const updatedEvents = competition.events.map((event) => {
            if (event.id === eventId) {
              return { ...event, completed: true, hasData: true }
            }
            return event
          })

          // Generate mock results if there aren't any for this event
          let updatedResults = [...competition.results]
          const hasResultsForEvent = updatedResults.some((result) => result.eventId === eventId)

          if (!hasResultsForEvent) {
            // Create random results for this event
            const teamResults = competition.teams.map((teamId) => {
              const randomTime = Math.floor(Math.random() * 30) + 10 + Math.random()
              return {
                teamId,
                eventId,
                time: Number.parseFloat(randomTime.toFixed(1)),
                position: 0, // Will be calculated below
              }
            })

            // Sort by time (lower is better) and assign positions
            teamResults.sort((a, b) => (a.time || 0) - (b.time || 0))
            teamResults.forEach((result, index) => {
              result.position = index + 1
            })

            updatedResults = [...updatedResults, ...teamResults]
          }

          return {
            ...competition,
            events: updatedEvents,
            results: updatedResults,
          }
        }
        return competition
      })
    )

    // Update the selected event ID to show results
    setSelectedEventId(eventId)
  }

  // Get team name by ID
  const getTeamName = (teamId: string) => {
    const team = sampleTeams.find((team) => team.id === teamId)
    return team ? team.name : "Unknown Team"
  }

  // Get event name by ID
  const getEventName = (eventId: string, competition: Competition) => {
    const event = competition.events.find((event) => event.id === eventId)
    return event ? event.type : "Unknown Event"
  }

  // Get results for a specific event
  const getEventResults = (competition: Competition, eventId: string) => {
    return competition.results
      .filter((result) => result.eventId === eventId)
      .sort((a, b) => a.position - b.position)
  }

  // View for competition details
  const renderCompetitionDetails = () => {
    if (!selectedCompetition) return null

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{selectedCompetition.name}</h2>
          <Button variant="outline" onClick={() => setSelectedCompetition(null)}>
            Back to List
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Events Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {selectedCompetition.events.map((event) => (
                    <div key={event.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{event.type}</h3>
                          {event.completed && (
                            <Badge
                              variant="outline"
                              className="border-green-200 bg-green-50 text-green-700"
                            >
                              Completed
                            </Badge>
                          )}
                        </div>
                        {!event.completed ? (
                          <Button
                            size="sm"
                            onClick={() => handleConnectECUs(selectedCompetition.id, event.id)}
                          >
                            Connect ECUs
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedEventId(event.id)}
                          >
                            View Results
                          </Button>
                        )}
                      </div>
                      <Separator />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Teams Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participating Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {selectedCompetition.teams.map((teamId) => {
                    const team = sampleTeams.find((t) => t.id === teamId)
                    if (!team) return null

                    return (
                      <div key={teamId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{team.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {team.vehicleClass} Class • {team.vehicleType}
                            </p>
                          </div>
                        </div>
                        <Separator />
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {selectedEventId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Results: {getEventName(selectedEventId, selectedCompetition)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Class</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getEventResults(selectedCompetition, selectedEventId).map((result) => {
                    const team = sampleTeams.find((t) => t.id === result.teamId)
                    if (!team) return null

                    return (
                      <TableRow key={`${result.teamId}-${result.eventId}`}>
                        <TableCell className="font-medium">
                          {result.position === 1 ? (
                            <span className="flex items-center gap-1">
                              1 <Trophy className="h-4 w-4 text-yellow-500" />
                            </span>
                          ) : (
                            result.position
                          )}
                        </TableCell>
                        <TableCell>{team.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {result.time?.toFixed(1)}s
                          </div>
                        </TableCell>
                        <TableCell>{team.vehicleClass}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
      <main className="row-start-2 flex w-full max-w-4xl flex-col gap-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-[30px] font-bold">Competitions</h1>
        </div>

        {selectedCompetition ? (
          renderCompetitionDetails()
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="view">View Competitions</TabsTrigger>
              <TabsTrigger value="create">Create Competition</TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="mt-6">
              {competitions.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
                  <Trophy className="h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No competitions created yet. Create your first competition!
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {competitions.map((competition) => (
                    <Card key={competition.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <CardTitle>{competition.name}</CardTitle>
                        <CardDescription>
                          {competition.events.length} events • {competition.teams.length} teams
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="mb-4 flex flex-wrap gap-2">
                          {competition.events.map((event) => (
                            <Badge
                              key={event.id}
                              variant="outline"
                              className={
                                event.completed ? "border-green-200 bg-green-50 text-green-700" : ""
                              }
                            >
                              {event.type}
                              {event.completed && " ✓"}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div className="mb-1 flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>Teams:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {competition.teams.slice(0, 3).map((teamId) => (
                              <span key={teamId} className="inline-block">
                                {getTeamName(teamId)}
                                {competition.teams.indexOf(teamId) < competition.teams.length - 1
                                  ? ", "
                                  : ""}
                              </span>
                            ))}
                            {competition.teams.length > 3 && (
                              <span>+{competition.teams.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full"
                          onClick={() => setSelectedCompetition(competition)}
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="create" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Competition</CardTitle>
                  <CardDescription>
                    Add a name, select at least 3 events, and choose teams to participate.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCompetition} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="competition-name">Competition Name</Label>
                      <Input
                        id="competition-name"
                        value={competitionName}
                        onChange={(e) => setCompetitionName(e.target.value)}
                        placeholder="Enter competition name"
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="mb-2 block">
                        Select Events (minimum 3)
                        {selectedEvents.length < 3 && (
                          <span className="ml-2 flex items-center gap-1 text-sm text-red-500">
                            <AlertCircle className="h-3 w-3" />
                            At least 3 events required
                          </span>
                        )}
                      </Label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {eventTypes.map((event) => (
                          <div key={event} className="flex items-center space-x-2">
                            <Checkbox
                              id={`event-${event}`}
                              checked={selectedEvents.includes(event)}
                              onCheckedChange={() => toggleEvent(event)}
                            />
                            <Label htmlFor={`event-${event}`} className="cursor-pointer">
                              {event}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="mb-2 block">
                        Select Teams
                        {selectedTeams.length === 0 && (
                          <span className="ml-2 flex items-center gap-1 text-sm text-red-500">
                            <AlertCircle className="h-3 w-3" />
                            At least 1 team required
                          </span>
                        )}
                      </Label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {sampleTeams.map((team) => (
                          <div key={team.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`team-${team.id}`}
                              checked={selectedTeams.includes(team.id)}
                              onCheckedChange={() => toggleTeam(team.id)}
                            />
                            <Label htmlFor={`team-${team.id}`} className="cursor-pointer">
                              {team.name} ({team.vehicleClass} - {team.vehicleType})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        !competitionName.trim() ||
                        selectedEvents.length < 3 ||
                        selectedTeams.length === 0
                      }
                    >
                      Create Competition
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
