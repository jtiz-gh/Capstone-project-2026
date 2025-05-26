"use client"

import { SynchronizedCharts } from "@/components/MultiChartContainer"
import Layout from "@/app/layout"
import Navbar from "@/components/Navbar"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface SensorDataEntry {
  timestamp: string;
  avgVoltage: number | null;
  avgCurrent: number | null;
  energy: number | null;
  device: {
    serialNo: string;
  };
}

export default function Monitors() {
  const { teamId, competitionId } = useParams()
  const [isClient, setIsClient] = useState(false)
  const [mergedData, setMergedData] = useState<any[]>([])
  const [teamName, setTeamName] = useState<string>("")
  const [competitionName, setCompetitionName] = useState<string>("")

  useEffect(() => {
    setIsClient(true)

    const fetchData = async () => {
      const res = await fetch("/api/sensor-data")
      const rawData: SensorDataEntry[] = await res.json()

      const processed = rawData.map((entry) => ({
        timestamp: new Date(entry.timestamp).toISOString(),
        voltage: entry.avgVoltage,
        current: entry.avgCurrent,
        energy: entry.energy,
        device: entry.device.serialNo,
      }))

      setMergedData(processed)
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
            className="flex h-10 items-center justify-center gap-2 px-4 sm:px-6 text-sm sm:text-lg hover:cursor-pointer"
            data-testid="energy-monitors-button"
          >
            ← Back
          </Button>
        </Link>
        <h1 className="text-lg sm:text-xl font-bold text-center sm:text-left">
          Energy Monitors for {teamName || decodeURIComponent(teamId as string)}{" "} competing in {competitionName || decodeURIComponent(competitionId as string)}
        </h1>
        <div className="hidden sm:block w-[120px]"></div>
      </div>
      {isClient ? (
        <div className="container mx-auto px-2 sm:px-4">
          <SynchronizedCharts chartData={mergedData} />
        </div>
      ) : (
        <div className="flex min-h-[200px] w-full items-center justify-center">Loading charts...</div>
      )}
    </>
  )
}
