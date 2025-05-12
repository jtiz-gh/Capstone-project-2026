"use client"

import ChartCard from "@/components/ChartCard"
import Layout from "@/app/layout"
import Navbar from "@/components/Navbar"
import { useParams } from "next/navigation"
import { mergeAndCalculateEnergy } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

// Separate voltage and current datasets
const voltageData = [
  { seconds: 0, voltage: 186 },
  { seconds: 1, voltage: 190 },
  { seconds: 2, voltage: 195 },
  { seconds: 3, voltage: 200 },
  { seconds: 4, voltage: 188 },
  { seconds: 5, voltage: 192 },
]

const currentData = [
  { seconds: 0, current: 5 },
  { seconds: 1, current: 5.2 },
  { seconds: 2, current: 5.1 },
  { seconds: 3, current: 4.9 },
  { seconds: 4, current: 5.3 },
  { seconds: 5, current: 5.0 },
]

// Merge datasets and calculate energy
const mergedData = mergeAndCalculateEnergy(voltageData, currentData, 1)

export default function Monitors() {
  const { teamId } = useParams()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-between px-4 mt-4 mb-4 border-b-2 border-gray-300 pb-2">
        <Link href={`/teams/${teamId}`}>
          <Button
            variant="outline"
            className="flex h-10 px-6 items-center justify-center gap-2 text-lg hover:cursor-pointer"
            data-testid="energy-monitors-button"
          >
            ← Back to Team View
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Energy Monitors for {decodeURIComponent(teamId as string)}</h1>
        <div className="w-[120px]"></div> {/* Spacer to balance the layout */}
      </div>
      {isClient ? (
        <div className="grid grid-cols-2 gap-4">
          {/* Top row: Voltage and Current charts */}
          <div className="flex justify-center">
            <ChartCard chartData={mergedData} title="Average Voltage" yAxisLabel="Voltage (V)" dataKey="voltage" />
          </div>
          <div className="flex justify-center">
            <ChartCard chartData={mergedData} title="Average Current" yAxisLabel="Current (A)" dataKey="current" />
          </div>

          {/* Bottom row: Energy chart */}
          <div className="col-span-2 flex justify-center">
            <ChartCard chartData={mergedData} title="Calculated Energy" yAxisLabel="Energy (J)" dataKey="energy" />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[200px] w-full">
          Loading charts...
        </div>
      )}
    </>
  )
}
