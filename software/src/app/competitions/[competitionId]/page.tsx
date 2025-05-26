"use client"

import { useMediaQuery } from "@/hooks/use-media-query"
import Navbar from "@/components/Navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Activity, AlertCircle, ArrowLeft, Loader2, Trophy, Users } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { calculateScore } from "@/lib/utils"
import type { Competition, Event, RaceRecord, Team } from "@/types/teams"

export default function CompetitionDetailPage() {
  const { competitionId } = useParams()
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loadingRaceId, setLoadingRaceId] = useState<number | null>(null)
  const [rankingsByCategory, setRankingsByCategory] = useState<Record<number, Record<string, any[]>>>({})
  const [missingTeamIdsByRace, setMissingTeamIdsByRace] = useState<Record<number, number[]>>({})
  const [finishStatusUpdates, setFinishStatusUpdates] = useState<Record<number, boolean>>({})
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<string>("overall")
  const [loading, setLoading] = useState(false)

  const id = competitionId

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [competitionRes, teamsRes, eventsRes] = await Promise.all([
          fetch(`/api/competitions/${id}`),
          fetch("/api/teams"),
          fetch("/api/events")
        ])
        
        if (competitionRes.ok) setCompetition(await competitionRes.json())
        if (teamsRes.ok) setTeams(await teamsRes.json())
        if (eventsRes.ok) setEvents(await eventsRes.json())
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [id])

  function getInitials(name: string) {
    return name.split(" ").map(word => word[0]?.toUpperCase() || "").join(".")
  }

  const handleFinishStatusChange = (rankId: number, checked: boolean) => {
    setFinishStatusUpdates(prev => ({ ...prev, [rankId]: checked }))
  }

  const applyFinishStatus = async () => {
    setLoading(true)
    try {
      const updates = Object.entries(finishStatusUpdates)
        .filter(([_, checked]) => checked)
        .map(([rankId]) => parseInt(rankId, 10))

      await Promise.all(
        updates.map(rankId => 
          fetch(`/api/rankings/${rankId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ finishStatus: "DNF", score: 0 })
          })
        )
      )

      setRankingsByCategory(prev => {
        const updated = { ...prev }
        for (const raceId in updated) {
          for (const category in updated[raceId]) {
            updated[raceId][category] = updated[raceId][category].map(ranking => 
              finishStatusUpdates[ranking.id] 
                ? { ...ranking, finishStatus: "DNF", score: 0 } 
                : ranking
            )
          }
        }
        return updated
      })

      setFinishStatusUpdates({})
    } catch (error) {
      console.error("Error applying finish status:", error)
    }
    setLoading(false)
  }

  const fetchRaceTimesForEvent = async (eventData: RaceRecord[]) => {
    const results = await Promise.all(
      eventData.map(async (record) => {
        try {
          const res = await fetch(`/api/records/${record.id}/sensor-data`)
          if (!res.ok) return null
          
          const sensorData = await res.json()
          let startTime = 0
          let endTime = 0
          
          for (let i = 0; i < sensorData.length; i++) {
            if (startTime === 0 && sensorData[i].avgCurrent > 0.5) startTime = sensorData[i].timestamp
            if (endTime === 0 && sensorData[sensorData.length - 1 - i].avgCurrent > 0.5) {
              endTime = sensorData[sensorData.length - 1 - i].timestamp
            }
          }
          
          return { teamId: record.device.teamId, time: endTime - startTime }
        } catch {
          return null
        }
      })
    )
    
    return results.filter(Boolean) as { teamId: number; time: number }[]
  }

  const loadRankings = async (raceId: number) => {
    setLoadingRaceId(raceId)
    try {
      const recordsRes = await fetch("/api/records")
      if (!recordsRes.ok) throw new Error("Failed to fetch records")
      
      const records = await recordsRes.json()
      const eventData = records.filter(
        (r: RaceRecord) => r.competitionId === competition?.id && r.raceId === raceId
      )

      const raceTimes = await fetchRaceTimesForEvent(eventData)
      raceTimes.sort((a, b) => a.time - b.time)

      // Group by vehicle category
      const grouped = raceTimes.reduce((acc, raceTime) => {
        const team = competition?.teams.find(t => t.id === raceTime.teamId)
        if (!team) return acc
        
        const category = `${team.vehicleClass} ${team.vehicleType}`
        if (!acc[category]) acc[category] = []
        acc[category].push(raceTime)
        return acc
      }, {} as Record<string, typeof raceTimes>)

      // Calculate rankings
      const rankings: any[] = []
      for (const [category, times] of Object.entries(grouped)) {
        times.sort((a, b) => a.time - b.time)
        
        const categoryRankings = await Promise.all(
          times.map(async (teamToRace, index) => {
            const score = calculateScore(index + 1, times.length)
            const res = await fetch("/api/rankings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                teamId: teamToRace.teamId,
                raceId,
                rank: index + 1,
                score
              })
            })
            
            if (res.ok) {
              const newRanking = await res.json()
              return { ...newRanking, vehicleCategory: category }
            }
            return null
          })
        )
        
        rankings.push(...categoryRankings.filter(Boolean))
      }

      // Update state
      setRankingsByCategory(prev => {
        const updated = { ...prev }
        if (!updated[raceId]) updated[raceId] = {}
        
        for (const ranking of rankings) {
          if (!updated[raceId][ranking.vehicleCategory]) {
            updated[raceId][ranking.vehicleCategory] = []
          }
          updated[raceId][ranking.vehicleCategory].push(ranking)
        }
        
        // Sort by score
        for (const category in updated[raceId]) {
          updated[raceId][category].sort((a, b) => b.score - a.score)
        }
        
        return updated
      })

      // Mark race as completed
      await fetch(`/api/races/${raceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true })
      })

      // Refresh competition data
      const compRes = await fetch(`/api/competitions/${id}`)
      if (compRes.ok) setCompetition(await compRes.json())
      
    } catch (error) {
      toast.error("Failed to load rankings")
      console.error("Error:", error)
    } finally {
      setLoadingRaceId(null)
    }
  }

  const overallRankings = useMemo(() => {
    if (!competition) return {}

    const scores: Record<string, { teamId: number; teamName: string; totalScore: number }[]> = {}

    Object.values(rankingsByCategory).forEach(raceRankings => {
      Object.entries(raceRankings).forEach(([category, rankings]) => {
        if (!scores[category]) scores[category] = []
        
        rankings.forEach(ranking => {
          const existing = scores[category].find(t => t.teamId === ranking.teamId)
          if (existing) {
            existing.totalScore += ranking.score
          } else {
            const team = teams.find(t => t.id === ranking.teamId)
            scores[category].push({
              teamId: ranking.teamId,
              teamName: team?.teamName || "Unknown",
              totalScore: ranking.score
            })
          }
        })
      })
    })

    // Sort each category
    Object.values(scores).forEach(category => 
      category.sort((a, b) => b.totalScore - a.totalScore)
    )

    return scores
  }, [competition, rankingsByCategory, teams])

  if (!competition) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "default"}
                onClick={() => router.push("/competitions")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-bold md:text-2xl">{competition.competitionName}</h1>
            </div>
            
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              disabled={loading}
            >
              Refresh
            </Button>
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
                    {competition.races.map((race) => (
                      <div key={race.id} className="space-y-2">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium md:text-base">
                              {events.find(e => e.id === race.eventId)?.eventName}
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
                            disabled={loadingRaceId !== null}
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
                    {competition.teams.map((team) => (
                      <div key={team.id} className="space-y-2">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="text-sm font-medium md:text-base">{team.teamName}</h3>
                            <p className="text-xs text-muted-foreground md:text-sm">
                              {team.vehicleClass} • {team.vehicleType}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {competition.races.slice(0, isMobile ? 2 : undefined).map((race) => {
                                if (!race.completed) return null
                                const isMissing = missingTeamIdsByRace[race.id]?.includes(team.id)
                                return (
                                  <Badge
                                    key={race.id}
                                    className={`text-xs ${isMissing ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
                                  >
                                    {getInitials(events.find(e => e.id === race.eventId)?.eventName || "")}
                                    {isMobile && isMissing ? "!" : ""}
                                  </Badge>
                                )
                              })}
                            </div>
                          </div>
                          <Link href={`/monitors/${team.id}/${competitionId}`} className="w-full md:w-auto">
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
              {competition.races.map((race) => (
                <option key={race.id} value={`race-${race.id}`}>
                  {events.find(e => e.id === race.eventId)?.eventName}
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
                    {Object.entries(overallRankings).map(([category, rankings]) => (
                      <div key={category} className="mb-4">
                        <h3 className="px-4 text-sm font-bold md:text-base md:px-6">{category}</h3>
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
                              {rankings.map((ranking, index) => (
                                <TableRow key={ranking.teamId}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell className="font-medium">
                                    {isMobile ? ranking.teamName.split(" ")[0] : ranking.teamName}
                                  </TableCell>
                                  {!isMobile && (
                                    <TableCell>{teams.find(t => t.id === ranking.teamId)?.vehicleClass}</TableCell>
                                  )}
                                  <TableCell className="text-right">{ranking.totalScore}</TableCell>
                                </TableRow>
                              ))}
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
            competition.races.map((race) =>
              `race-${race.id}` === selectedLeaderboard ? (
                <Card key={race.id}>
                  <CardHeader className={isMobile ? "p-4" : undefined}>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Trophy className="h-4 w-4" />
                      {events.find(e => e.id === race.eventId)?.eventName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={isMobile ? "p-0" : undefined}>
                    {rankingsByCategory[race.id] ? (
                      <div className="space-y-6">
                        {Object.entries(rankingsByCategory[race.id]).map(([category, rankings]) => (
                          <div key={category} className="mb-4">
                            <h3 className="px-4 text-sm font-bold md:text-base md:px-6">{category}</h3>
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
                                        {teams.find(t => t.id === ranking.teamId)?.teamName}
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
                          disabled={loading || Object.keys(finishStatusUpdates).length === 0}
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
        </main>
      </div>
    </>
  )
}