"use client"

import { SynchronizedCharts } from "@/components/MultiChartContainer"
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
        <div className="w-[120px]"></div> {/* Spacer to balance the layout */}
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
