"use client"

import ChartCard from "@/components/ChartCard"
import Layout from "@/app/layout"
import Navbar from "@/components/Navbar"
import { useParams } from "next/navigation"
import { mergeAndCalculateEnergy } from "@/lib/utils"

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

    return (
        <>
            <Navbar />
            <h1 className="text-xl font-bold mb-4 mt-4 text-center">Energy Monitors for {decodeURIComponent(teamId as string)}</h1>
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

        </>
    )
}
