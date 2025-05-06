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
import type { Team, Competition, EventType, Event } from "@/types/teams"
import { TeamSelector } from "@/app/teams/team-selector"

export default function CompetitionsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])

  // State for form
  const [competitionName, setCompetitionName] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([])
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([])

  // State for viewing competition details
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [activeTab, setActiveTab] = useState("view")
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)

  // Get initial data
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/teams")
        if (!response.ok) {
          console.log("Failed to fetch teams")
        }
        const data = await response.json()
        setTeams(data)
      } catch (error) {
        console.error("Error fetching events:", error)
      }
    }

    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events")
        if (!response.ok) {
          console.log("Failed to fetch events")
        }
        const data = await response.json()
        setEvents(data)
      } catch (error) {
        console.error("Error fetching events:", error)
      }
    }

    const fetchCompetitions = async () => {
      try {
        const response = await fetch("/api/competitions")
        if (!response.ok) {
          console.log("Failed to fetch competitions")
        }
        const data = await response.json()
        setCompetitions(data)
      } catch (error) {
        console.error("Error fetching competitions:", error)
      }
    }

    fetchTeams()
    fetchEvents()
    fetchCompetitions()
  }, [])

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
  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!competitionName.trim() || selectedEvents.length < 3 || selectedTeams.length === 0) {
      alert(
        "Please fill in all required fields. Competitions need a name, at least 3 events, and at least one team."
      )
      return
    }

    try {
      const response = await fetch("api/competitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          competitionName: competitionName,
          competitionDate: new Date().toISOString(),
          teamIds: selectedTeams.map((team) => team.id),
          eventIds: selectedEvents.map((event) => event.id),
        }),
      })
      if (response.ok) {
        const newCompetition = await response.json()
        setCompetitions([...competitions, newCompetition])
        setCompetitionName("")
        setSelectedEvents([])
        setSelectedTeams([])
        setActiveTab("view")
      } else {
        const errorText = await response.text()
        console.error("Failed to create team:", response.status, errorText)
      }
    } catch (error) {
      console.error("Error creating team:", error)
    }
  }

  // Handle toggling event selection
  const toggleEvent = (event: Event) => {
    if (selectedEvents.includes(event)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== event))
    } else {
      setSelectedEvents([...selectedEvents, event])
    }
  }

  // Handle toggling team selection
  const toggleTeam = (teamId: number) => {
    const teamSelected = selectedTeams.some((team) => team.id === teamId)

    if (teamSelected) {
      setSelectedTeams(selectedTeams.filter((team) => team.id !== teamId))
    } else {
      const teamToAdd = teams.find((team) => team.id === teamId)
      if (teamToAdd) {
        setSelectedTeams([...selectedTeams, teamToAdd])
      }
    }
  }

  // Handle adding a new team
  const handleAddTeam = async (teamData: Omit<Team, "id">) => {
    try {
      const response = await fetch("api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamName: teamData.teamName,
          vehicleClass: teamData.vehicleClass,
          vehicleType: teamData.vehicleType,
        }),
      })

      if (response.ok) {
        const newTeam = await response.json()
        setTeams([...teams, newTeam])
        setSelectedTeams([...selectedTeams, newTeam])
      } else {
        const errorText = await response.text()
        console.error("Failed to create team:", response.status, errorText)
      }
    } catch (error) {
      console.error("Error creating team:", error)
    }
  }

  // Handle marking an event as completed and connecting ECUs
  // TODO: Need to actually connect to ECUs
  const handleConnectECUs = (competitionId: number, eventId: number) => {
    // setCompetitions(
    //   competitions.map((competition) => {
    //     if (competition.id === competitionId) {
    //       // Update the event to be completed and have data
    //       const updatedEvents = competition.events.map((event) => {
    //         if (event.id === eventId) {
    //           return { ...event, completed: true, hasData: true }
    //         }
    //         return event
    //       })
    //       // Generate mock results if there aren't any for this event
    //       let updatedResults = [...competition.results]
    //       const hasResultsForEvent = updatedResults.some((result) => result.eventId === eventId)
    //       if (!hasResultsForEvent) {
    //         // Create random results for this event
    //         const teamResults = competition.teams.map((teamId) => {
    //           const randomTime = Math.floor(Math.random() * 30) + 10 + Math.random()
    //           return {
    //             teamId,
    //             eventId,
    //             time: Number.parseFloat(randomTime.toFixed(1)),
    //             position: 0, // Will be calculated below
    //           }
    //         })
    //         // Sort by time (lower is better) and assign positions
    //         teamResults.sort((a, b) => (a.time || 0) - (b.time || 0))
    //         teamResults.forEach((result, index) => {
    //           result.position = index + 1
    //         })
    //         updatedResults = [...updatedResults, ...teamResults]
    //       }
    //       return {
    //         ...competition,
    //         events: updatedEvents,
    //         results: updatedResults,
    //       }
    //     }
    //     return competition
    //   })
    // )
    // // Update the selected event ID to show results
    // setSelectedEventId(eventId)
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
          <h2 className="text-2xl font-bold">{selectedCompetition.competitionName}</h2>
          <Button
            variant="outline"
            className="hover:cursor-pointer"
            onClick={() => setSelectedCompetition(null)}
          >
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
                          <h3 className="font-medium">{event.eventName}</h3>
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
                            className="hover:cursor-pointer"
                            onClick={() => handleConnectECUs(selectedCompetition.id, event.id)}
                          >
                            Connect ECUs
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:cursor-pointer"
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
                  {selectedCompetition.teams.map((team) => {
                    if (!team) return null
                    return (
                      <div key={team.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{team.teamName}</h3>
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

        {/* Results Section
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
                    const team = teams.find((t) => t.id === result.teamId)
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
        )} */}
      </div>
    )
  }

  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
      <main className="row-start-2 flex w-full max-w-4xl flex-col gap-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:cursor-pointer">
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
              <TabsTrigger value="view" className="hover:cursor-pointer">
                View Competitions
              </TabsTrigger>
              <TabsTrigger value="create" className="hover:cursor-pointer">
                Create Competition
              </TabsTrigger>
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
                        <CardTitle>{competition.competitionName}</CardTitle>
                        <CardDescription>
                          {competition.events?.length} events • {competition.teams?.length} teams
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
                              {event.eventName}
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
                            {competition.teams.slice(0, 3).map((team) => (
                              <span key={team.id} className="inline-block">
                                {team.teamName}
                                {competition.teams.indexOf(team) < competition.teams.length - 1
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
                          className="w-full hover:cursor-pointer"
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
                        {events.map((event) => (
                          <div key={event.eventName} className="flex items-center space-x-2">
                            <Checkbox
                              id={`event-${event.id}`}
                              className="hover:cursor-pointer"
                              checked={selectedEvents.includes(event)}
                              onCheckedChange={() => toggleEvent(event)}
                            />
                            <Label htmlFor={`event-${event.id}`} className="cursor-pointer">
                              {event.eventName}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <TeamSelector
                      teams={teams}
                      selectedTeams={selectedTeams}
                      onTeamToggle={toggleTeam}
                      onAddTeam={handleAddTeam}
                    />

                    <Button
                      type="submit"
                      className="w-full hover:cursor-pointer"
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
