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
