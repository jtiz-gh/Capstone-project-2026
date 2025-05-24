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
  const { teamId } = useParams()
  const [isClient, setIsClient] = useState(false)
  const [mergedData, setMergedData] = useState<any[]>([])

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

    fetchData()
  }, [])

  return (
    <>
      <Navbar />
      <div className="mt-4 mb-4 flex items-center justify-between border-b-2 border-gray-300 px-4 pb-2">
        <Link href={`/teams/${teamId}`}>
          <Button
            variant="outline"
            className="flex h-10 items-center justify-center gap-2 px-6 text-lg hover:cursor-pointer"
            data-testid="energy-monitors-button"
          >
            ← Back to Team View
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Energy Monitors for {decodeURIComponent(teamId as string)}</h1>
        <div className="w-[120px]"></div>
      </div>
      {isClient ? (
        <div className="container mx-auto px-4">
          <SynchronizedCharts chartData={mergedData} />
        </div>
      ) : (
        <div className="flex min-h-[200px] w-full items-center justify-center">Loading charts...</div>
      )}
    </>
  )
}
