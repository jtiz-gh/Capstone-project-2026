"use client"

import { useMemo, useState, useRef, useEffect, useCallback } from "react"
import UplotReact from "uplot-react"
import "uplot/dist/uPlot.min.css"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { type ChartConfig } from "@/components/ui/chart"
import Slider from "rc-slider"
import "rc-slider/assets/index.css"

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
  energy: number | null // cumulative energy in kWh or similar unit
}

type SynchronizedChartsProps = {
  chartData: SensorDataEntry[]
  deviceId?: string
}

export function SynchronizedCharts({ chartData }: SynchronizedChartsProps) {
  // Filter out rows with missing/invalid timestamp and handle nulls
  const filteredData = useMemo(
    () => chartData.filter((d) => typeof d.timestamp === "number" && !isNaN(d.timestamp)),
    [chartData]
  )
  // Convert ms to seconds for x axis so numbers are smaller and easier to read
  const x = useMemo(
    () => Float64Array.from(filteredData.map((d) => d.timestamp / 1000)),
    [filteredData]
  )
  const voltage = useMemo(
    () => Float64Array.from(filteredData.map((d) => d.avgVoltage ?? NaN)),
    [filteredData]
  )
  const current = useMemo(
    () => Float64Array.from(filteredData.map((d) => d.avgCurrent ?? NaN)),
    [filteredData]
  )
  const powerAvg = useMemo(
    () => Float64Array.from(filteredData.map((d) => d.avgPower ?? NaN)),
    [filteredData]
  )
  const powerPeak = useMemo(
    () => Float64Array.from(filteredData.map((d) => d.peakPower ?? NaN)),
    [filteredData]
  )

  // Use energy from DB, sum cumulatively (energy is delta since previous point)
  const energy = useMemo(() => {
    const arr = new Float64Array(filteredData.length)
    let acc = 0
    for (let i = 0; i < filteredData.length; ++i) {
      const e = filteredData[i].energy ?? 0
      acc += e
      arr[i] = acc
    }
    return arr
  }, [filteredData])

  // Shared zoom state for both charts
  const [zoom, setZoom] = useState<[number, number] | null>(null)

  // Brush (range slider) state
  const minX = x.length > 0 ? x[0] : 0
  const maxX = x.length > 0 ? x[x.length - 1] : 1
  const [brush, setBrush] = useState<[number, number] | null>(null)

  // Keep brush and zoom in sync
  useEffect(() => {
    if (zoom) setBrush(zoom)
    else setBrush([minX, maxX])
  }, [zoom, minX, maxX])

  // When brush changes, update zoom
  const handleBrushChange = useCallback(
    (newBrush: [number, number]) => {
      setBrush(newBrush)
      setZoom(newBrush[0] === minX && newBrush[1] === maxX ? null : newBrush)
    },
    [minX, maxX]
  )

  // Calculate total energy for display (in J) in the zoomed region, or full if not zoomed
  const zoomedEnergy = useMemo(() => {
    if (energy.length === 0 || x.length === 0) return 0
    if (!zoom) return energy[energy.length - 1]

    let startIdx = 0
    let endIdx = energy.length - 1
    for (let i = 0; i < x.length; ++i) {
      if (x[i] >= zoom[0]) {
        startIdx = i
        break
      }
    }
    for (let i = x.length - 1; i >= 0; --i) {
      if (x[i] <= zoom[1]) {
        endIdx = i
        break
      }
    }

    startIdx = Math.max(0, Math.min(startIdx, energy.length - 1))
    endIdx = Math.max(0, Math.min(endIdx, energy.length - 1))
    if (endIdx < startIdx) [startIdx, endIdx] = [endIdx, startIdx]
    return energy[endIdx] - energy[startIdx]
  }, [energy, x, zoom])

  // Responsive chart width
  const containerRef = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState(800)

  useEffect(() => {
    function updateWidth() {
      if (containerRef.current) {
        setChartWidth(containerRef.current.offsetWidth * 0.9)
      }
    }

    updateWidth()

    const resizeObserver = new window.ResizeObserver(updateWidth)
    if (containerRef.current) resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [])

  function formatTime(self: unknown, rawValue: number) {
    if (rawValue === null || isNaN(rawValue)) return "??"
    return `${rawValue.toFixed(1)}s`
  }

  function formatValue(rawValue: number) {
    if (rawValue === null || isNaN(rawValue)) return ""
    if (rawValue >= 1e6) return `${(rawValue / 1e6).toFixed(2)}M`
    if (rawValue >= 1e3) return `${(rawValue / 1e3).toFixed(2)}k`
    return rawValue.toFixed(2)
  }

  // uPlot options for metrics chart
  const metricsOpts = useMemo(
    () => ({
      width: chartWidth,
      height: 500,
      title: "Voltage, Current, Power (Avg/Peak)",
      scales: { x: { time: false, range: zoom ? () => zoom : undefined }, y: { auto: true } },
      series: [
        { label: "Time (s)", value: formatTime },
        {
          label: "Voltage",
          stroke: chartConfig.voltage.color,
          value: (_self: unknown, value: number) => `${formatValue(value)}V`,
        },
        {
          label: "Current",
          stroke: chartConfig.current.color,
          value: (_self: unknown, value: number) => `${formatValue(value)}A`,
        },
        {
          label: "Power (Avg)",
          stroke: "#e11d48",
          value: (_self: unknown, value: number) => `${formatValue(value)}W`,
        },
        {
          label: "Power (Peak)",
          stroke: "#f472b6",
          dash: [5, 5],
          value: (_self: unknown, value: number) => `${formatValue(value)}W`,
        },
      ],
      axes: [
        {
          stroke: "#888",
          grid: { show: true },
          values: (self: unknown, ticks: number[]) => ticks.map((t) => formatTime(self, t)),
          size: 60,
          label: "Time (s)",
        },
        {
          stroke: "#888",
          grid: { show: true },
          values: (self: unknown, ticks: number[]) => ticks.map((t) => formatValue(t)),
          size: 60,
        },
      ],
      legend: { show: true },
      cursor: {
        drag: { x: true, y: true, uni: 30 },
        focus: { prox: 16 },
      },
      hooks: {
        setSelect: [
          function (u: unknown) {
            const uu = u as {
              select: { width: number; left: number }
              posToVal: (px: number, scale: string) => number
            }
            if (uu.select.width > 0) {
              const min = uu.posToVal(uu.select.left, "x")
              const max = uu.posToVal(uu.select.left + uu.select.width, "x")
              setZoom([min, max])
            } else {
              setZoom(null)
            }
          },
        ],
        init: [
          function (u: unknown) {
            const uPlotInstance = u as { over: HTMLElement }
            if (uPlotInstance && uPlotInstance.over) {
              uPlotInstance.over.addEventListener("dblclick", () => setZoom(null))
            }
          },
        ],
      },
      select: { show: true, over: true, left: 0, top: 0, width: 0, height: 0 },
    }),
    [setZoom, zoom, chartWidth]
  )

  // uPlot options for energy chart
  const energyOpts = useMemo(
    () => ({
      width: chartWidth,
      height: 500,
      title: `Energy (Total in view: ${zoomedEnergy.toFixed(3)} J)`,
      scales: { x: { time: false, range: zoom ? () => zoom : undefined }, y: { auto: true } },
      series: [
        { label: "Time (s)", value: formatTime },
        {
          label: "Energy",
          stroke: chartConfig.energy.color,
          value: (_self: unknown, value: number) => `${formatValue(value)}J`,
        },
      ],
      axes: [
        {
          stroke: "#888",
          grid: { show: true },
          values: (self: unknown, ticks: number[]) => ticks.map((t) => formatTime(null, t)),
          size: 60,
          label: "Time (s)",
        },
        {
          stroke: "#888",
          grid: { show: true },
          values: (self: unknown, ticks: number[]) => ticks.map((t) => formatValue(t)),
          size: 60,
        },
      ],
      legend: { show: true },
      cursor: {
        drag: { x: true, y: true, uni: 30 },
        focus: { prox: 16 },
      },
      hooks: {
        setSelect: [
          function (u: unknown) {
            const uu = u as {
              select: { width: number; left: number }
              posToVal: (px: number, scale: string) => number
            }
            if (uu.select.width > 0) {
              const min = uu.posToVal(uu.select.left, "x")
              const max = uu.posToVal(uu.select.left + uu.select.width, "x")
              setZoom([min, max])
            } else {
              setZoom(null)
            }
          },
        ],
        init: [
          function (u: unknown) {
            const uPlotInstance = u as { over: HTMLElement }
            if (uPlotInstance && uPlotInstance.over) {
              uPlotInstance.over.addEventListener("dblclick", () => setZoom(null))
            }
          },
        ],
      },
      select: { show: true, over: true, left: 0, top: 0, width: 0, height: 0 },
    }),
    [setZoom, zoom, chartWidth, zoomedEnergy]
  )

  const metricsData = useMemo(
    () => [x, voltage, current, powerAvg, powerPeak],
    [x, voltage, current, powerAvg, powerPeak]
  )
  const energyData = useMemo(() => [x, energy], [x, energy])

  return (
    <div ref={containerRef} className="w-full max-w-full space-y-6 px-1 sm:px-2 md:px-4">
      <div className="mb-2 text-xs font-semibold text-muted-foreground">
        Device ID: <span className="text-foreground">{filteredData[0]?.deviceId ?? "N/A"}</span>
      </div>
      <div className="flex flex-col items-center gap-6">
        <div className="flex w-full justify-center overflow-x-auto rounded bg-white p-1 shadow sm:p-2 dark:bg-black">
          <UplotReact options={metricsOpts} data={metricsData} />
        </div>

        <div className="mb-2 flex w-full flex-col items-center justify-center overflow-x-auto rounded bg-white p-1 shadow sm:p-2 dark:bg-black">
          <div className="mt-1 mb-2 max-w-full text-center text-xs text-muted-foreground">
            <b>Tip:</b> Drag the handles to zoom time axis. Alternatively, drag along one axis of
            the graph to zoom that axis or drag diagonally to zoom into a rectangle. Double-click to
            reset zoom.
          </div>
          <div className="flex w-full items-center justify-center pb-4">
            <div style={{ width: "100%", maxWidth: chartWidth, margin: "0 24px" }}>
              <Slider
                range
                min={minX}
                max={maxX}
                step={(maxX - minX) / 500 || 0.01}
                value={brush ?? [minX, maxX]}
                allowCross={false}
                onChange={(vals: number[] | number) => {
                  const arr = Array.isArray(vals) ? vals : [minX, maxX]
                  handleBrushChange([Number(arr[0]), Number(arr[1])])
                }}
                trackStyle={[{ backgroundColor: "#000000", height: 18 }]}
                handleStyle={[
                  {
                    borderColor: "#000000",
                    backgroundColor: "#fff",
                    height: 28,
                    width: 28,
                    marginTop: -5.25,
                    opacity: 1,
                  },
                  {
                    borderColor: "#000000",
                    backgroundColor: "#ffffff",
                    height: 28,
                    width: 28,
                    marginTop: -5.25,
                    opacity: 1,
                  },
                ]}
                railStyle={{ backgroundColor: "#e5e7eb", height: 20, borderRadius: 8 }}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(null)}
              style={{ marginTop: 13.5 }}
              className="ml-2"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              <span className="text-xs font-semibold">Reset Zoom</span>
            </Button>
          </div>
        </div>
        <div className="mb-6 flex w-full justify-center overflow-x-auto rounded bg-white p-1 shadow sm:p-2 dark:bg-black">
          <UplotReact options={energyOpts} data={energyData} />
        </div>
      </div>
    </div>
  )
}
