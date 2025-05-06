import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type VoltageData = { seconds: number; voltage: number }[];
type CurrentData = { seconds: number; current: number }[];

export function mergeAndCalculateEnergy(
  voltageData: VoltageData,
  currentData: CurrentData,
  timestepSeconds: number = 1
) {
  return voltageData.map((v) => {
    const matchingCurrent = currentData.find((c) => c.seconds === v.seconds)
    const current = matchingCurrent?.current ?? 0
    const energy = v.voltage * current * timestepSeconds

    return {
      seconds: v.seconds,
      voltage: v.voltage,
      current: current,
      energy: energy,
    }
  })
}

export function calculateScore(place: number | string, n: number): number {
  // Check if place is a string ("DNS", "DNF", "DQ")
  if (typeof place === "string" && (place === "DNS" || place === "DNF" || place === "DQ")) {
    return 0
  }

  // Ensure place is a number for calculations
  if (typeof place === "number") {

    // Guard against invalid placements
    if (place < 1 || place > n) {
      return 0
    }

    if (place === 1) return 100
    if (place === n) return 25

    const interval: number = 75 / (n - 1)
    return Math.round((n - place) * interval + 25)
  }

  return 0
}
