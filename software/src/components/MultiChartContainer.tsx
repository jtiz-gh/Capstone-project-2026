"use client"

import { useState } from "react"
import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  ReferenceArea,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ZoomIn, RefreshCw } from "lucide-react"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  voltage: {
    label: "Voltage",
    color: "hsl(220, 70%, 50%)",
  },
  current: {
    label: "Current",
    color: "hsl(160, 60%, 45%)",
  },
  energy: {
    label: "Energy",
    color: "hsl(30, 80%, 55%)",
  },
} satisfies ChartConfig

type SynchronizedChartsProps = {
  chartData: { seconds: number; [key: string]: number }[]
  deviceId?: string
}

// Define a type for domain values that can be either a number or special string values
type DomainValue = number | "auto" | "dataMin" | "dataMax" | "dataMin-1" | "dataMax+1"

export function SynchronizedCharts({ chartData }: SynchronizedChartsProps) {
  // Calculate initial Y-axis domains for all charts
  const calculateYDomain = (dataKey: string) => {
    if (!chartData.length) return [0, 100]

    let minValue = chartData[0][dataKey]
    let maxValue = chartData[0][dataKey]

    for (const item of chartData) {
      if (item[dataKey] < minValue) minValue = item[dataKey]
      if (item[dataKey] > maxValue) maxValue = item[dataKey]
    }

    // Add some padding to the domain
    return [(minValue | 0) - 1, (maxValue | 0) + 1]
  }

  const topEnergy = 1000 // Example top energy value, can be adjusted as needed

  // Initial Y domains
  const [initialVoltageDomain] = useState(() => calculateYDomain("voltage"))
  const [initialCurrentDomain] = useState(() => calculateYDomain("current"))
  const [initialEnergyDomain] = useState(() => calculateYDomain("energy"))

  // Shared state for all charts - properly typed to accept both numbers and special string values
  const [left, setLeft] = useState<DomainValue>("dataMin")
  const [right, setRight] = useState<DomainValue>("dataMax")
  const [voltageTop, setVoltageTop] = useState<number>(initialVoltageDomain[1])
  const [voltageBottom, setVoltageBottom] = useState<number>(initialVoltageDomain[0])
  const [currentTop, setCurrentTop] = useState<number>(initialCurrentDomain[1])
  const [currentBottom, setCurrentBottom] = useState<number>(initialCurrentDomain[0])
  const [energyTop, setEnergyTop] = useState<number>(Math.min(initialEnergyDomain[1], topEnergy))
  const [energyBottom, setEnergyBottom] = useState<number>(initialEnergyDomain[0])
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null)
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null)
  const [zoomEnabled, setZoomEnabled] = useState(true)

  // Track brush indices separately from the chart domains
  const [brushIndices, setBrushIndices] = useState<{ startIndex: number; endIndex: number }>({
    startIndex: 0,
    endIndex: chartData.length - 1,
  })

  // Get the data extremes for the y-axis
  const getAxisYDomain = (from: number, to: number, dataKey: string, offset: number) => {
    // Find valid indices, ensuring they exist in the data
    const fromIndex = Math.max(
      0,
      chartData.findIndex((d) => d.seconds >= from)
    )
    const toIndex = chartData.findIndex((d) => d.seconds > to)

    // If toIndex is -1, set it to the last index of the data so we can slice correctly
    const validToIndex = toIndex === -1 ? chartData.length - 1 : toIndex

    // Ensure we have a valid slice with at least one element
    const refData = chartData.slice(fromIndex, validToIndex + 1)

    // Handle empty data case
    if (refData.length === 0) {
      return [0, 100] // Default domain if no data
    }

    // Find min and max values safely
    let minValue = refData[0][dataKey]
    let maxValue = refData[0][dataKey]

    for (const item of refData) {
      if (item[dataKey] < minValue) minValue = item[dataKey]
      if (item[dataKey] > maxValue) maxValue = item[dataKey]
    }

    return [(minValue | 0) - offset, (maxValue | 0) + offset]
  }

  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === null || refAreaLeft === null) {
      setRefAreaLeft(null)
      setRefAreaRight(null)
      return
    }

    // Ensure left is always less than right
    const [fromX, toX] =
      refAreaLeft < refAreaRight ? [refAreaLeft, refAreaRight] : [refAreaRight, refAreaLeft]

    // Get new domain for Y axis for all charts
    const [newVoltageBottom, newVoltageTop] = getAxisYDomain(fromX, toX, "voltage", 1)
    const [newCurrentBottom, newCurrentTop] = getAxisYDomain(fromX, toX, "current", 1)
    const [newEnergyBottom, newEnergyTop] = getAxisYDomain(fromX, toX, "energy", 1)

    setRefAreaLeft(null)
    setRefAreaRight(null)
    setLeft(fromX)
    setRight(toX)
    setVoltageBottom(newVoltageBottom)
    setVoltageTop(newVoltageTop)
    setCurrentBottom(newCurrentBottom)
    setCurrentTop(newCurrentTop)
    setEnergyBottom(newEnergyBottom)
    setEnergyTop(Math.min(newEnergyTop, topEnergy))

    // Update brush indices to match the new domain
    const startIndex = Math.max(
      0,
      chartData.findIndex((d) => d.seconds >= fromX)
    )
    const endIndex = chartData.findIndex((d) => d.seconds > toX)
    const validEndIndex = endIndex === -1 ? chartData.length - 1 : endIndex - 1

    setBrushIndices({
      startIndex,
      endIndex: validEndIndex,
    })
  }

  const zoomOut = () => {
    setLeft("dataMin")
    setRight("dataMax")

    // Use the initial calculated domains instead of arbitrary values
    setVoltageTop(initialVoltageDomain[1])
    setVoltageBottom(initialVoltageDomain[0])
    setCurrentTop(initialCurrentDomain[1])
    setCurrentBottom(initialCurrentDomain[0])
    setEnergyTop(Math.min(initialEnergyDomain[1], topEnergy))
    setEnergyBottom(initialEnergyDomain[0])

    // Reset brush to full range
    setBrushIndices({
      startIndex: 0,
      endIndex: chartData.length - 1,
    })
  }

  const handleBrushChange = (brushArea: any) => {
    if (!brushArea || brushArea.startIndex === undefined || brushArea.endIndex === undefined) return

    // Store the brush indices
    setBrushIndices({
      startIndex: brushArea.startIndex,
      endIndex: brushArea.endIndex,
    })

    // Only update the chart domains if we have valid indices
    if (brushArea.startIndex === brushArea.endIndex) return

    const start = chartData[brushArea.startIndex]?.seconds
    const end = chartData[brushArea.endIndex]?.seconds

    if (start !== undefined && end !== undefined) {
      setLeft(start)
      setRight(end)
      try {
        const [newVoltageBottom, newVoltageTop] = getAxisYDomain(start, end, "voltage", 1)
        const [newCurrentBottom, newCurrentTop] = getAxisYDomain(start, end, "current", 1)
        const [newEnergyBottom, newEnergyTop] = getAxisYDomain(start, end, "energy", 1)

        setVoltageBottom(newVoltageBottom)
        setVoltageTop(newVoltageTop)
        setCurrentBottom(newCurrentBottom)
        setCurrentTop(newCurrentTop)
        setEnergyBottom(newEnergyBottom)
        setEnergyTop(Math.min(newEnergyTop, topEnergy))
      } catch (error) {
        console.error("Error calculating axis domain:", error)
      }
    }
  }

  // Common event handlers for all charts
  const handleMouseDown = (e: any) => {
    if (!zoomEnabled) return
    setRefAreaLeft(e?.activeLabel)
  }

  const handleMouseMove = (e: any) => {
    if (!zoomEnabled) return
    if (refAreaLeft) {
      setRefAreaRight(e?.activeLabel)
    }
  }

  const handleMouseUp = () => {
    if (!zoomEnabled) return
    zoom()
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${zoomEnabled ? "select-none" : ""}`}>
      <div className="mb-2 flex flex-col items-start justify-between gap-2 px-2 sm:flex-row sm:items-center sm:px-4">
        {/* Device ID */}
        <div className="text-xs font-semibold text-muted-foreground sm:text-sm">
          Device ID: <span className="text-foreground">{chartData[0]?.device ?? "N/A"}</span>
        </div>

        {/* Zoom controls */}
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomEnabled(!zoomEnabled)}
            className={`flex-1 sm:flex-initial ${zoomEnabled ? "bg-blue-100 dark:bg-blue-900" : ""}`}
          >
            <ZoomIn className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
            <span className="text-xs font-semibold sm:text-sm">Toggle Zoom</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-initial" onClick={zoomOut}>
            <RefreshCw className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
            <span className="text-xs font-semibold sm:text-sm">Reset Zoom</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
        {/* Voltage Chart */}
        <Card className="w-full">
          <CardContent className="p-2 sm:p-4">
            <h3 className="mb-1 text-sm font-semibold sm:mb-2 sm:text-lg">Average Voltage</h3>
            <ChartContainer config={chartConfig} className="h-40 sm:h-48">
              <LineChart
                data={chartData}
                margin={{ left: 8, right: 8, top: 5, bottom: 5 }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="seconds"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  tickFormatter={(value) => `${value}s`}
                  domain={[left, right]}
                  type="number"
                  allowDataOverflow
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  domain={[voltageBottom, voltageTop]}
                  allowDataOverflow
                  tick={{ fontSize: 10 }}
                  label={{
                    value: "Voltage (V)",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 10,
                  }}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Line
                  dataKey="voltage"
                  type="natural"
                  stroke={chartConfig.voltage.color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                {refAreaLeft && refAreaRight && (
                  <ReferenceArea
                    x1={refAreaLeft}
                    x2={refAreaRight}
                    strokeOpacity={0.3}
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                )}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Current Chart */}
        <Card className="w-full">
          <CardContent className="p-2 sm:p-4">
            <h3 className="mb-1 text-sm font-semibold sm:mb-2 sm:text-lg">Average Current</h3>
            <ChartContainer config={chartConfig} className="h-40 sm:h-48">
              <LineChart
                data={chartData}
                margin={{ left: 8, right: 8, top: 5, bottom: 5 }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="seconds"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  tickFormatter={(value) => `${value}s`}
                  domain={[left, right]}
                  type="number"
                  allowDataOverflow
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  domain={[currentBottom, currentTop]}
                  allowDataOverflow
                  tick={{ fontSize: 10 }}
                  label={{
                    value: "Current (A)",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 10,
                  }}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Line
                  dataKey="current"
                  type="natural"
                  stroke={chartConfig.current.color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                {refAreaLeft && refAreaRight && (
                  <ReferenceArea
                    x1={refAreaLeft}
                    x2={refAreaRight}
                    strokeOpacity={0.3}
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                )}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Energy Chart (spans full width) */}
        <Card className="col-span-1 w-full sm:col-span-2">
          <CardContent className="flex flex-col justify-center p-2 sm:p-4">
            <h3 className="mb-1 text-sm font-semibold sm:mb-2 sm:text-lg">Calculated Energy</h3>
            <ChartContainer config={chartConfig} className="h-40 sm:h-48">
              <LineChart
                data={chartData}
                margin={{ left: 8, right: 8, top: 5, bottom: 5 }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="seconds"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  tickFormatter={(value) => `${value}s`}
                  domain={[left, right]}
                  type="number"
                  allowDataOverflow
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  domain={[energyBottom, energyTop]}
                  allowDataOverflow
                  tick={{ fontSize: 10 }}
                  label={{
                    value: "Energy (J)",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 10,
                  }}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Line
                  dataKey="energy"
                  type="natural"
                  stroke={chartConfig.energy.color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                {refAreaLeft && refAreaRight && (
                  <ReferenceArea
                    x1={refAreaLeft}
                    x2={refAreaRight}
                    strokeOpacity={0.3}
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                )}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Shared Brush Component */}
      <div className="mt-2 h-12 border-t pt-2 sm:mt-4 sm:h-16 sm:pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 8, right: 8, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <Brush
              dataKey="seconds"
              height={20}
              stroke="#3b82f6"
              fill="#e2e8f0"
              fillOpacity={0.5}
              strokeWidth={1}
              startIndex={brushIndices.startIndex}
              endIndex={brushIndices.endIndex}
              onChange={handleBrushChange}
              travellerWidth={8}
              className="recharts-brush"
              tickFormatter={() => ""}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
