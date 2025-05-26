"use client"

import { SynchronizedCharts } from "@/components/MultiChartContainer"
import Navbar from "@/components/Navbar"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface SensorDataEntry {
  measurementId: number
  deviceId: number
  timestamp: number
  sessionId: number
  recordId: number
  avgVoltage: number | null
  avgCurrent: number | null
  avgPower: number | null
  peakVoltage: number | null
  peakCurrent: number | null
  peakPower: number | null
  energy: number | null
}


export default function Monitors() {
  const { teamId, competitionId } = useParams()
  const [isClient, setIsClient] = useState(false)
  const [mergedData, setMergedData] = useState<SensorDataEntry[]>([])
  const [teamName, setTeamName] = useState<string>("")
  const [competitionName, setCompetitionName] = useState<string>("")

  useEffect(() => {
    setIsClient(true)

    const fetchData = async () => {
      if (!teamId) return

      const res = await fetch(`/api/records/${teamId}/sensor-data`)
      const rawData: SensorDataEntry[] = await res.json()

      if (!Array.isArray(rawData) || rawData.length === 0) {
        setMergedData([])
        return
      }

      // Convert to relative time in ms
      const firstTimestamp = rawData[0].timestamp
      const mutatedData = rawData.map((entry) => ({
        ...entry,
        timestamp: entry.timestamp - firstTimestamp,
      }))

      setMergedData(mutatedData)
    }

    const fetchTeam = async () => {
      if (!teamId) return
      const res = await fetch(`/api/teams/${teamId}`)
      if (res.ok) {
        const data = await res.json()
        setTeamName(data.teamName)
      }
    }

    // Fetch competition name
    const fetchCompetition = async () => {
      if (!competitionId) return
      const res = await fetch(`/api/competitions/${competitionId}`)
      if (res.ok) {
        const data = await res.json()
        setCompetitionName(data.competitionName)
      }
    }

    fetchData()
    fetchTeam()
    fetchCompetition()
  }, [teamId, competitionId])

  return (
    <>
      <Navbar />
      <div className="mt-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-gray-300 px-4 pb-2">
        <Link href={`/competitions/${competitionId}`}>
          <Button
            variant="outline"
            className="flex h-10 items-center justify-center gap-2 px-4 text-sm hover:cursor-pointer sm:px-6 sm:text-lg"
            data-testid="energy-monitors-button"
          >
            ← Back
          </Button>
        </Link>
        <h1 className="text-lg sm:text-xl font-bold text-center sm:text-left">
          Energy Monitors for {teamName || decodeURIComponent(teamId as string)}{" "} competing in {competitionName || decodeURIComponent(competitionId as string)}
        </h1>
        <div className="hidden w-[120px] sm:block"></div>
      </div>
      {isClient ? (
        <div className="container mx-auto px-2 sm:px-4">
          <SynchronizedCharts chartData={mergedData} />
        </div>
      ) : (
        <div className="flex min-h-[200px] w-full items-center justify-center">
          Loading charts...
        </div>
      )}
    </>
  )
}
