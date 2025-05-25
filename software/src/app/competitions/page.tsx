"use client"

import type React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { TeamSelector } from "@/app/teams/team-selector"
import Navbar from "@/components/Navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { calculateScore } from "@/lib/utils"
import type { Competition, Event, RaceRecord, Team } from "@/types/teams"
import { Activity, AlertCircle, ArrowLeft, Loader2, Trophy, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

export default function CompetitionsPage() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [teams, setTeams] = useState<Team[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [competitionName, setCompetitionName] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([])
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [activeTab, setActiveTab] = useState("view")
  const [loadingRaceId, setLoadingRaceId] = useState<number | null>(null)
  const [rankingsByCategory, setRankingsByCategory] = useState<Record<number, Record<string, any[]>>>({})
  const [missingTeamIdsByRace, setMissingTeamIdsByRace] = useState<Record<number, number[]>>({})
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
        // setFinishStatusUpdates({})
      }
    }
  }, [competitions, selectedCompetition])

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((word) => word[0]?.toUpperCase() || "")
      .join(".")
  }

  const handleViewDetails = (competition: Competition) => {
    setSelectedCompetition(competition)
    const missing: Record<number, number[]> = {}
    competition.races.forEach((race) => {
      const teamIdsWithRecord = new Set(
        (race.records ?? [])
          .map((record: RaceRecord) => record.device.teamId)
          .filter((id): id is number => typeof id === "number" && !isNaN(id))
      )
      missing[race.id] = (competition.teams ?? [])
        .map((team) => team.id)
        .filter(
          (teamId): teamId is number =>
            typeof teamId === "number" && !isNaN(teamId) && !teamIdsWithRecord.has(teamId)
        )
    })
    setMissingTeamIdsByRace(missing)

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

      const teamIdsWithRecord = new Set(
        data
          .filter((record: RaceRecord) => record.raceId === raceId)
          .map((record: RaceRecord) => record.device.teamId)
      )
      const missingTeamIds = (selectedCompetition?.teams ?? [])
        .map((team) => team.id)
        .filter((teamId) => !teamIdsWithRecord.has(teamId))
      setMissingTeamIdsByRace((prev) => ({
        ...prev,
        [raceId]: missingTeamIds,
      }))

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

  const renderCompetitionDetails = () => {
    if (!selectedCompetition) return null

    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "default"}
              className="hover:cursor-pointer"
              onClick={() => setSelectedCompetition(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold md:text-2xl">{selectedCompetition.competitionName}</h2>
          </div>
          
          {!isMobile && (
            <Button
              variant="outline"
              onClick={loadPastCompetitions}
              disabled={loading}
            >
              Refresh Data
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {/* Events Card */}
          <Card>
            <CardHeader className={isMobile ? "p-4" : undefined}>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Activity className="h-4 w-4" />
                Events
              </CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? "p-4" : undefined}>
              <ScrollArea className="h-[200px] md:h-[300px]">
                <div className="space-y-3">
                  {selectedCompetition.races.map((race) => (
                    <div key={race.id} className="space-y-2">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium md:text-base">
                            {events.find((event) => event.id === race.eventId)?.eventName}
                          </h3>
                          {race.completed && (
                            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 text-xs">
                              Completed
                            </Badge>
                          )}
                        </div>

                        <Button
                          onClick={() => loadRankings(race.id)}
                          size={isMobile ? "sm" : "default"}
                          className="w-full md:w-auto"
                        >
                          {loadingRaceId === race.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : race.completed ? (
                            "Recalculate"
                          ) : (
                            "Score Race"
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
            <CardHeader className={isMobile ? "p-4" : undefined}>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Users className="h-4 w-4" />
                Teams
              </CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? "p-4" : undefined}>
              <ScrollArea className="h-[200px] md:h-[300px]">
                <div className="space-y-3">
                  {selectedCompetition.teams.map((team) => (
                    <div key={team.id} className="space-y-2">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-sm font-medium md:text-base">{team.teamName}</h3>
                          <p className="text-xs text-muted-foreground md:text-sm">
                            {team.vehicleClass} • {team.vehicleType}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {selectedCompetition.races.slice(0, isMobile ? 2 : undefined).map((race) => {
                              if (!race.completed) return null
                              const isMissing = missingTeamIdsByRace[race.id]?.includes(team.id)
                              return (
                                <Badge
                                  key={race.id}
                                  className={`text-xs ${isMissing ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
                                >
                                  {getInitials(events.find((e) => e.id === race.eventId)?.eventName || "")}
                                  {isMobile && isMissing ? "!" : ""}
                                </Badge>
                              )
                            })}
                            {isMobile && selectedCompetition.races.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{selectedCompetition.races.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Link href={`/teams/${team.id}/energy-monitors`} className="w-full md:w-auto">
                          <Button size={isMobile ? "sm" : "default"} className="w-full mt-2 md:mt-0 md:w-auto">
                            {isMobile ? "Graphs" : "View Graphs"}
                          </Button>
                        </Link>
                      </div>
                      <Separator />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Selector */}
        <div className="w-full">
          <select
            value={selectedLeaderboard}
            onChange={(e) => setSelectedLeaderboard(e.target.value)}
            className="w-full rounded-md border p-2 text-sm md:text-base"
          >
            <option value="overall">Overall Leaderboard</option>
            {selectedCompetition.races.map((race) => (
              <option key={race.id} value={`race-${race.id}`}>
                {events.find((event) => event.id === race.eventId)?.eventName}
              </option>
            ))}
          </select>
        </div>

        {/* Leaderboard Content */}
        {selectedLeaderboard === "overall" ? (
          <Card>
            <CardHeader className={isMobile ? "p-4" : undefined}>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Trophy className="h-4 w-4" />
                Overall Results
              </CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? "p-0" : undefined}>
              {Object.keys(overallRankings).length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No rankings available yet.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(overallRankings).map(([vehicleCategory, rankings]) => (
                    <div key={vehicleCategory} className="mb-4">
                      <h3 className="px-4 text-sm font-bold md:text-base md:px-6">{vehicleCategory}</h3>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10">#</TableHead>
                              <TableHead>Team</TableHead>
                              {!isMobile && <TableHead>Class</TableHead>}
                              <TableHead className="text-right">Score</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rankings.map((ranking, index) => {
                              const team = teams.find((t) => t.id === ranking.teamId)
                              return (
                                <TableRow key={ranking.teamId}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell className="font-medium">
                                    {isMobile ? team?.teamName?.split(' ')[0] : team?.teamName}
                                  </TableCell>
                                  {!isMobile && <TableCell>{team?.vehicleClass}</TableCell>}
                                  <TableCell className="text-right">{ranking.totalScore}</TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          selectedCompetition.races.map((race) =>
            `race-${race.id}` === selectedLeaderboard ? (
              <Card key={race.id}>
                <CardHeader className={isMobile ? "p-4" : undefined}>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Trophy className="h-4 w-4" />
                    {events.find((event) => event.id === race.eventId)?.eventName}
                  </CardTitle>
                </CardHeader>
                <CardContent className={isMobile ? "p-0" : undefined}>
                  {rankingsByCategory[race.id] ? (
                    <div className="space-y-6">
                      {Object.entries(rankingsByCategory[race.id]).map(([vehicleCategory, rankings]) => (
                        <div key={vehicleCategory} className="mb-4">
                          <h3 className="px-4 text-sm font-bold md:text-base md:px-6">{vehicleCategory}</h3>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {!isMobile && <TableHead>Status</TableHead>}
                                  <TableHead>#</TableHead>
                                  <TableHead>Team</TableHead>
                                  {!isMobile && <TableHead>Score</TableHead>}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {rankings.map((ranking, index) => (
                                  <TableRow key={ranking.id}>
                                    {!isMobile && (
                                      <TableCell>
                                        <Checkbox
                                          checked={finishStatusUpdates[ranking.id] || false}
                                          onCheckedChange={(checked) => {
                                            handleFinishStatusChange(ranking.id, Boolean(checked))
                                          }}
                                        />
                                      </TableCell>
                                    )}
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                      {teams.find((t) => t.id === ranking.teamId)?.teamName}
                                    </TableCell>
                                    {!isMobile && <TableCell>{ranking.score}</TableCell>}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="p-4 text-sm text-muted-foreground">No rankings available yet.</p>
                  )}
                  {race.completed && (
                    <div className="p-4">
                      <Button
                        onClick={applyFinishStatus}
                        disabled={loading}
                        size={isMobile ? "sm" : "default"}
                        className="w-full md:w-auto"
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          "Apply Status Changes"
                        )}
                      </Button>
                    </div>
                  )}
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
      <div className="min-h-screen p-4 md:p-8">
        <main className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size={isMobile ? "sm" : "default"} className="hover:cursor-pointer">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold md:text-2xl">Competitions</h1>
            </div>

            {!selectedCompetition && (
              <Button
                onClick={loadPastCompetitions}
                disabled={loading}
                size={isMobile ? "sm" : "default"}
                className="font-semibold"
              >
                {isMobile ? "Refresh" : "Load Past Competitions"}
              </Button>
            )}
          </div>

          {selectedCompetition ? (
            renderCompetitionDetails()
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="view" className="font-semibold hover:cursor-pointer">
                  {isMobile ? "View" : "View Competitions"}
                </TabsTrigger>
                <TabsTrigger value="create" className="font-semibold hover:cursor-pointer">
                  {isMobile ? "Create" : "Create Competition"}
                </TabsTrigger>
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
                                className={`text-xs ${race.completed ? 'bg-green-50 text-green-700' : ''}`}
                              >
                                {events.find((e) => e.id === race.eventId)?.eventName?.split(' ')[0]}
                                {race.completed && " ✓"}
                              </Badge>
                            ))}
                            {isMobile && competition.races.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{competition.races.length - 2}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground md:text-sm">
                            <div className="mb-1 flex items-center gap-1">
                              <Users className="h-3 w-3 md:h-4 md:w-4" />
                              <span>Teams:</span>
                            </div>
                            <div className="line-clamp-2">
                              {competition.teams.slice(0, 3).map((team) => (
                                <span key={team.id} className="inline-block">
                                  {isMobile ? team.teamName.split(' ')[0] : team.teamName}
                                  {competition.teams.indexOf(team) < competition.teams.length - 1 ? ", " : ""}
                                </span>
                              ))}
                              {competition.teams.length > 3 && (
                                <span> +{competition.teams.length - 3}</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 md:p-6">
                          <Button
                            onClick={() => handleViewDetails(competition)}
                            size={isMobile ? "sm" : "default"}
                            className="w-full"
                          >
                            View Details
                          </Button>
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
                          className="text-sm md:text-base"
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
                          {(events || []).map((event) => (
                            <div key={event.eventName} className="flex items-center space-x-2">
                              <Checkbox
                                id={`event-${event.id}`}
                                checked={selectedEvents.includes(event)}
                                onCheckedChange={() => toggleEvent(event)}
                                disabled={loading}
                              />
                              <Label htmlFor={`event-${event.id}`} className="text-xs md:text-sm">
                                {isMobile ? event.eventName.split(' ')[0] : event.eventName}
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
                        size={isMobile ? "sm" : "default"}
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
          )}
        </main>
      </div>
    </>
  )
}