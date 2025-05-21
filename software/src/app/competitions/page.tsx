"use client"

import type React from "react"

import { TeamSelector } from "@/app/teams/team-selector"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { calculateScore } from "@/lib/utils"
import type { Competition, Event, RaceRecord, Team } from "@/types/teams"
import { Activity, AlertCircle, ArrowLeft, Loader2, Trophy, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

export default function CompetitionsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])

  // State for form
  const [competitionName, setCompetitionName] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([])
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)

  // State for viewing competition details
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [activeTab, setActiveTab] = useState("view")

  const [loadingRaceId, setLoadingRaceId] = useState<number | null>(null)

  const [rankingsByCategory, setRankingsByCategory] = useState<
    Record<number, Record<string, any[]>>
  >({})

  const [finishStatusUpdates, setFinishStatusUpdates] = useState<Record<number, boolean>>({})

  const [selectedLeaderboard, setSelectedLeaderboard] = useState<string>("overall")

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

    fetchTeams()
    fetchEvents()
  }, [])

  // Load selected competition details
  useEffect(() => {
    if (selectedCompetition) {
      const competition = competitions.find((c) => c.id === selectedCompetition.id)
      if (competition) {
        setSelectedCompetition(competition)
        // setFinishStatusUpdates({})
      }
    }
  }, [competitions, selectedCompetition])

  const handleViewDetails = (competition: Competition) => {
    setSelectedCompetition(competition)

    // Check if rankings exist for each race in the competition
    const updatedRankings: Record<number, Record<string, any[]>> = {}

    competition.races.forEach((race) => {
      if (race.rankings && race.rankings.length > 0) {
        race.rankings.forEach((ranking) => {
          const team = teams.find((t) => t.id === ranking.teamId)

          if (team) {
            const vehicleCategory = `${team.vehicleClass} ${team.vehicleType}`

            if (!updatedRankings[race.id]) {
              updatedRankings[race.id] = {}
            }

            if (!updatedRankings[race.id][vehicleCategory]) {
              updatedRankings[race.id][vehicleCategory] = []
            }

            updatedRankings[race.id][vehicleCategory].push(ranking)
          }
        })
      }
    })

    // Sort the rankings by highest score first
    for (const raceId in updatedRankings) {
      for (const vehicleCategory in updatedRankings[raceId]) {
        updatedRankings[raceId][vehicleCategory].sort((a, b) => b.score - a.score)
      }
    }
    // Set the rankings in the state
    setRankingsByCategory(updatedRankings)
  }

  const handleFinishStatusChange = (rankId: number, checked: boolean) => {
    setFinishStatusUpdates((prev) => ({
      ...prev,
      [rankId]: checked,
    }))
  }

  const applyFinishStatus = async () => {
    setLoading(true)
    try {
      const updates = Object.entries(finishStatusUpdates)
        .filter(([_, checked]) => checked)
        .map(([rankId]) => parseInt(rankId, 10))

      await Promise.all(
        updates.map(async (rankId) => {
          const response = await fetch(`/api/rankings/${rankId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              finishStatus: "DNF", // You can change this to "DQ" or "DNS"
              score: 0,
            }),
          })

          if (!response.ok) {
            console.error(`Failed to update finish status for rank ${rankId}`)
          }
        })
      )

      setRankingsByCategory((prev) => {
        const updatedRankings: Record<number, Record<string, any[]>> = { ...prev }

        for (const [raceId, raceRankings] of Object.entries(updatedRankings)) {
          updatedRankings[Number(raceId)] = Object.fromEntries(
            Object.entries(raceRankings).map(([vehicleCategory, rankings]) => [
              vehicleCategory,
              rankings.map((ranking) =>
                finishStatusUpdates[ranking.rankingId]
                  ? { ...ranking, finishStatus: "DNF", score: 0 }
                  : ranking
              ),
            ])
          )
        }
        return updatedRankings
      })

      setFinishStatusUpdates({})
    } catch (error) {
      console.error("Error applying finish status:", error)
    }
    setLoading(false)
  }

  const fetchRaceTimesForEvent = async (eventData: RaceRecord[]) => {
    const teamToTime = await Promise.all(
      eventData.map(async (record) => {
        try {
          const sensorDataResponse = await fetch(`api/records/${record.id}/sensor-data`)
          const sensorData = await sensorDataResponse.json()

          if (sensorDataResponse.ok) {
            let startTime = 0
            let endTime = 0
            for (let i = 0; i < sensorData.length; i++) {
              if (startTime === 0 && sensorData[i].avgCurrent > 0.5) {
                startTime = sensorData[i].timestamp
              }
              if (endTime === 0 && sensorData[sensorData.length - 1 - i].avgCurrent > 0.5) {
                endTime = sensorData[sensorData.length - 1 - i].timestamp
              }
            }
            const raceTime = endTime - startTime
            return { teamId: record.device.teamId, time: raceTime }
          }
        } catch {
          console.log("Error fetching sensor data for record")
        }
        return null
      })
    )
    return teamToTime.filter((item): item is { teamId: number; time: number } => item !== null)
  }

  const loadRankings = async (raceId: number) => {
    setLoadingRaceId(raceId)
    try {
      const response = await fetch("/api/records")
      if (!response.ok) {
        console.log("Failed to fetch records")
      }
      const data = await response.json()

      if (data.length === 0) {
        setLoadingRaceId(null)
        toast.error("Load rankings failed")
        return
      }

      const eventData = data.filter(
        (record: RaceRecord) =>
          record.competitionId === selectedCompetition?.id && record.raceId === raceId
      )

      const raceTimes = await fetchRaceTimesForEvent(eventData)
      raceTimes.sort((a, b) => a.time - b.time)

      // Group raceTimes by vehicle category
      const groupedRaceTimes = raceTimes.reduce(
        (acc: Record<string, { teamId: number; time: number }[]>, raceTime) => {
          const team = selectedCompetition?.teams.find((t) => t.id === raceTime.teamId)
          if (team) {
            const vehicleCategory = `${team.vehicleClass} ${team.vehicleType}`
            if (!acc[vehicleCategory]) {
              acc[vehicleCategory] = []
            }
            acc[vehicleCategory].push(raceTime)
          }
          return acc
        },
        {}
      )

      // Calculate scores for each vehicle category
      const rankings: any[] = []
      for (const [vehicleCategory, times] of Object.entries(groupedRaceTimes)) {
        times.sort((a, b) => a.time - b.time) // Sort times within the category

        // Skip teams that already have rankings for this race and vehicle category
        const existingRankings = rankingsByCategory[raceId]?.[vehicleCategory] || []
        const existingTeamIds = new Set(existingRankings.map((ranking) => ranking.teamId))

        const categoryRankings = await Promise.all(
          times
            .filter((teamToRace) => !existingTeamIds.has(teamToRace.teamId)) // Skip teams with existing rankings
            .map(async (teamToRace, index) => {
              const score = calculateScore(index + 1, times.length)
              try {
                const response = await fetch("/api/rankings", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    teamId: teamToRace.teamId,
                    raceId: raceId,
                    rank: index + 1,
                    score: score,
                  }),
                })
                if (response.ok) {
                  const newRanking = await response.json()
                  return {
                    ...newRanking,
                    rankingId: newRanking.id,
                    teamId: teamToRace.teamId,
                    rank: index + 1,
                    score: score,
                    vehicleCategory,
                  }
                } else {
                  const errorText = await response.text()
                  console.error("Failed to create ranking:", response.status, errorText)
                }
              } catch (error) {
                console.error("Error creating ranking:", error)
              }
              return null
            })
        )
        rankings.push(...categoryRankings.filter((r) => r !== null))
      }

      // Group rankings by race and vehicle category
      setRankingsByCategory((prev) => {
        const updatedRankings = { ...prev }
        if (!updatedRankings[raceId]) {
          updatedRankings[raceId] = {}
        }
        for (const ranking of rankings) {
          const vehicleCategory = ranking.vehicleCategory
          if (!updatedRankings[raceId][vehicleCategory]) {
            updatedRankings[raceId][vehicleCategory] = []
          }
          updatedRankings[raceId][vehicleCategory].push(ranking)
        }
        for (const raceId in updatedRankings) {
          for (const vehicleCategory in updatedRankings[raceId]) {
            updatedRankings[raceId][vehicleCategory].sort((a, b) => b.score - a.score)
          }
        }
        return updatedRankings
      })
    } catch (error) {
      console.error("Error fetching events:", error)
    }

    const response = await fetch(`/api/races/${raceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        completed: true,
      }),
    })
    if (response.ok) {
      setCompetitions((prev) =>
        prev.map((competition) => {
          if (competition.id === selectedCompetition?.id) {
            const updatedRaces = competition.races.map((race) =>
              race.id === raceId ? { ...race, completed: true } : race
            )
            setSelectedCompetition({
              ...competition,
              races: updatedRaces,
            })
            return {
              ...competition,
              races: updatedRaces,
            }
          }
          return competition
        })
      )
    }

    setLoadingRaceId(null)
  }

  const loadPastCompetitions = async () => {
    setLoading(true)
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
    setLoading(false)
  }

  // Handle creating a new competition
  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!competitionName.trim() || selectedEvents.length < 3 || selectedTeams.length === 0) {
      alert(
        "Please fill in all required fields. Competitions need a name, at least 3 events, and at least one team."
      )
      setLoading(false)
      return
    }

    try {
      // Create races for the selected events
      const raceResponses = await Promise.all(
        selectedEvents.map(async (event) => {
          const response = await fetch("/api/races", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              eventId: event.id,
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error("Failed to create race:", response.status, errorText)
            throw new Error("Failed to create race")
          }

          return response.json()
        })
      )

      // Use the created races to create the competition
      const raceIds = raceResponses.map((race) => race.id)
      const response = await fetch("/api/competitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          competitionName: competitionName,
          competitionDate: new Date().toISOString(),
          teamIds: selectedTeams.map((team) => team.id),
          raceIds: raceIds,
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
        console.error("Failed to create competition:", response.status, errorText)
      }
    } catch (error) {
      console.error("Error creating competition:", error)
    }

    setLoading(false)
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

  // Calculate overall rankings
  const overallRankings = useMemo(() => {
    if (!selectedCompetition) return {}

    const overallScores: Record<
      string,
      { teamId: number; teamName: string; totalScore: number }[]
    > = {}

    Object.values(rankingsByCategory).forEach((raceRankings) => {
      Object.entries(raceRankings).forEach(([vehicleCategory, categoryRankings]) => {
        if (!overallScores[vehicleCategory]) {
          overallScores[vehicleCategory] = []
        }

        categoryRankings.forEach((ranking) => {
          const existingTeam = overallScores[vehicleCategory].find(
            (team) => team.teamId === ranking.teamId
          )

          if (existingTeam) {
            existingTeam.totalScore += ranking.score
          } else {
            overallScores[vehicleCategory].push({
              teamId: ranking.teamId,
              teamName: ranking.teamName,
              totalScore: ranking.score,
            })
          }
        })
      })
    })

    // Sort rankings within each vehicle classification by total score
    Object.keys(overallScores).forEach((vehicleCategory) => {
      overallScores[vehicleCategory].sort((a, b) => b.totalScore - a.totalScore)
    })

    return overallScores
  }, [selectedCompetition, rankingsByCategory])

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
                  {selectedCompetition.races.map((race) => (
                    <div key={race.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {events.find((event) => event.id === race.eventId)?.eventName}
                          </h3>
                          {race.completed && (
                            <Badge
                              variant="outline"
                              className="border-green-200 bg-green-50 text-green-700"
                            >
                              Completed
                            </Badge>
                          )}
                        </div>

                        <Button
                          onClick={() => loadRankings(race.id)}
                          className="hover:cursor-pointer"
                        >
                          {loadingRaceId === race.id ? (
                            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                          ) : race.completed ? (
                            "Retry?"
                          ) : (
                            "Finish and Score"
                          )}
                        </Button>
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

        <select
          value={selectedLeaderboard}
          onChange={(e) => setSelectedLeaderboard(e.target.value)}
          className="rounded border px-4 py-2"
        >
          <option value="overall">Overall Leaderboard</option>
          {selectedCompetition.races.map((race) => (
            <option key={race.id} value={`race-${race.id}`}>
              {events.find((event) => event.id === race.eventId)?.eventName} Leaderboard
            </option>
          ))}
        </select>

        {selectedLeaderboard === "overall" ? (
          // Render Overall Leaderboard
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Overall Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(overallRankings).length === 0 ? (
                <p>No rankings available yet. Complete a race to see results.</p>
              ) : (
                Object.entries(overallRankings).map(([vehicleCategory, rankings]) => (
                  <div key={vehicleCategory} className="mb-6">
                    <h3 className="text-lg font-bold">{vehicleCategory}</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Position</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead>Total Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rankings.map((ranking, index) => (
                          <TableRow key={ranking.teamId}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              {teams.find((team) => team.id === ranking.teamId)?.teamName}
                            </TableCell>
                            <TableCell>{ranking.totalScore}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : (
          // Render Race Leaderboard
          selectedCompetition.races.map((race) =>
            `race-${race.id}` === selectedLeaderboard ? (
              <Card key={race.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    {events.find((event) => event.id === race.eventId)?.eventName} Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rankingsByCategory[race.id] ? (
                    Object.entries(rankingsByCategory[race.id]).map(
                      ([vehicleCategory, rankings]) => (
                        <div key={vehicleCategory} className="mb-6">
                          <h3 className="text-lg font-bold">{vehicleCategory}</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>DNF/DQ/DNS</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Team</TableHead>
                                <TableHead>Score</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rankings.map((ranking, index) => (
                                <TableRow key={ranking.id}>
                                  <TableCell>
                                    <Checkbox
                                      id={`ranking-${ranking.id}`}
                                      className="hover:cursor-pointer"
                                      onCheckedChange={(checked) => {
                                        handleFinishStatusChange(ranking.id, Boolean(checked))
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>
                                    {teams.find((team) => team.id === ranking.teamId)?.teamName}
                                  </TableCell>
                                  <TableCell>{ranking.score}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )
                    )
                  ) : (
                    <p>No rankings available yet. Complete this race to see results.</p>
                  )}
                  {race.completed ? (
                    <Button
                      onClick={applyFinishStatus}
                      disabled={loading}
                      className="hover:cursor-pointer"
                    >
                      Apply Finish Status Changes
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ) : null
          )
        )}
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
        <main className="row-start-2 flex w-full max-w-4xl flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="hover:cursor-pointer">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-[30px] font-bold">Competitions</h1>
            </div>

            <Button
              onClick={loadPastCompetitions}
              disabled={loading}
              className="hover:cursor-pointer"
            >
              Load past competitions (Online Only)
            </Button>
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
                            {competition.races?.length} events • {competition.teams?.length} teams
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <div className="mb-4 flex flex-wrap gap-2">
                            {competition.races.map((race) => (
                              <Badge
                                key={race.id}
                                variant="outline"
                                className={
                                  race.completed
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : ""
                                }
                              >
                                {events.find((event) => event.id === race.eventId)?.eventName}
                                {race.completed && " ✓"}
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
                            onClick={() => handleViewDetails(competition)}
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
                          disabled={loading}
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
                                disabled={loading}
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
                        loading={loading}
                      />

                      <Button
                        type="submit"
                        className="w-full hover:cursor-pointer"
                        disabled={
                          !competitionName.trim() ||
                          selectedEvents.length < 3 ||
                          selectedTeams.length === 0 ||
                          loading
                        }
                      >
                        {loading ? (
                          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                        ) : (
                          "Create Competition"
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </>
  )
}
