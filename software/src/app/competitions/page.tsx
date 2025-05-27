"use client"

import { useMediaQuery } from "@/hooks/use-media-query"
import Navbar from "@/components/Navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft, Trophy, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { TeamSelector } from "@/app/teams/team-selector"
import { AlertCircle, Loader2 } from "lucide-react"
import type { Competition, Event, Team } from "@/types/teams"

export default function CompetitionsListPage() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [teams, setTeams] = useState<Team[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [competitionName, setCompetitionName] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([])
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("view")

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsRes, eventsRes, competitionsRes] = await Promise.all([
          fetch("/api/teams"),
          fetch("/api/events"),
          fetch("/api/competitions"),
        ])

        if (teamsRes.ok) setTeams(await teamsRes.json())
        if (eventsRes.ok) setEvents(await eventsRes.json())
        if (competitionsRes.ok) setCompetitions(await competitionsRes.json())
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

  const loadPastCompetitions = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/competitions")
      if (response.ok) {
        setCompetitions(await response.json())
      }
    } catch (error) {
      console.error("Error fetching competitions:", error)
    }
    setLoading(false)
  }

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!competitionName.trim() || selectedEvents.length < 3 || selectedTeams.length === 0) {
      alert("Please fill in all required fields")
      setLoading(false)
      return
    }

    try {
      // Create competition logic
      const raceResponses = await Promise.all(
        selectedEvents.map((event) =>
          fetch("/api/races", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId: event.id }),
          })
        )
      )

      const raceIds = await Promise.all(raceResponses.map((res) => res.json()))

      const response = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionName,
          competitionDate: new Date().toISOString(),
          teamIds: selectedTeams.map((team) => team.id),
          raceIds: raceIds.map((race) => race.id),
        }),
      })

      if (response.ok) {
        const newCompetition = await response.json()
        setCompetitions([...competitions, newCompetition])
        setCompetitionName("")
        setSelectedEvents([])
        setSelectedTeams([])
        setActiveTab("view")
      }
    } catch (error) {
      console.error("Error creating competition:", error)
    }
    setLoading(false)
  }

  const toggleEvent = (event: Event) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  const toggleTeam = (teamId: number) => {
    setSelectedTeams((prev) =>
      prev.some((team) => team.id === teamId)
        ? prev.filter((team) => team.id !== teamId)
        : [...prev, teams.find((team) => team.id === teamId)!]
    )
  }

  const handleAddTeam = async (teamData: Omit<Team, "id">) => {
    setLoading(true)
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
    setLoading(false)
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-4 md:p-8">
        <main className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size={isMobile ? "sm" : "default"} data-testid="back-button">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold md:text-2xl">Competitions</h1>
            </div>

            <Button
              onClick={loadPastCompetitions}
              disabled={loading}
              size={isMobile ? "sm" : "default"}
            >
              {isMobile ? "Refresh" : "Load Past Competitions"}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="view">{isMobile ? "View" : "View Competitions"}</TabsTrigger>
              <TabsTrigger value="create">{isMobile ? "Create" : "Create Competition"}</TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="mt-4">
              {competitions.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
                  <Trophy className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground md:text-base">
                    No competitions created yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {competitions.map((competition) => (
                    <Card key={competition.id} className="overflow-hidden">
                      <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-base md:text-lg">
                          {competition.competitionName}
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">
                          {competition.races?.length} events • {competition.teams?.length} teams
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 md:p-6">
                        <div className="mb-3 flex flex-wrap gap-1">
                          {competition.races.slice(0, isMobile ? 2 : undefined).map((race) => (
                            <Badge
                              key={race.id}
                              variant="outline"
                              className={`text-xs ${race.completed ? "bg-green-50 text-green-700" : ""}`}
                            >
                              {events.find((e) => e.id === race.eventId)?.eventName?.split(" ")[0]}
                              {race.completed && " ✓"}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground md:text-sm">
                          <div className="mb-1 flex items-center gap-1">
                            <Users className="h-3 w-3 md:h-4 md:w-4" />
                            <span>Teams:</span>
                          </div>
                          <div className="line-clamp-2">
                            {competition.teams.slice(0, 3).map((team) => (
                              <span key={team.id} className="inline-block">
                                {isMobile ? team.teamName.split(" ")[0] : team.teamName}
                                {competition.teams.indexOf(team) < competition.teams.length - 1
                                  ? ", "
                                  : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 md:p-6">
                        <Link href={`/competitions/${competition.id}`} className="w-full">
                          <Button size={isMobile ? "sm" : "default"} className="w-full">
                            View Details
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="create" className="mt-4">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardDescription className="text-sm md:text-base">
                    Add a name, select at least 3 events, and choose teams.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <form onSubmit={handleCreateCompetition} className="space-y-4 md:space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="competition-name" className="text-sm md:text-base">
                        Competition Name
                      </Label>
                      <Input
                        id="competition-name"
                        value={competitionName}
                        onChange={(e) => setCompetitionName(e.target.value)}
                        placeholder="Name"
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm md:text-base">
                        Select Events (min 3)
                        {selectedEvents.length < 3 && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-500 md:text-sm">
                            <AlertCircle className="h-3 w-3" />
                            {isMobile ? "Need 3+" : "At least 3 events required"}
                          </span>
                        )}
                      </Label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {events.map((event) => (
                          <div key={event.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`event-${event.id}`}
                              checked={selectedEvents.includes(event)}
                              onCheckedChange={() => toggleEvent(event)}
                              disabled={loading}
                            />
                            <Label htmlFor={`event-${event.id}`} className="text-xs md:text-sm">
                              {isMobile ? event.eventName.split(" ")[0] : event.eventName}
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
                      loading={loading}
                    />

                    <Button
                      type="submit"
                      disabled={
                        !competitionName.trim() ||
                        selectedEvents.length < 3 ||
                        selectedTeams.length === 0 ||
                        loading
                      }
                      className="w-full"
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        "Create Competition"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  )
}
