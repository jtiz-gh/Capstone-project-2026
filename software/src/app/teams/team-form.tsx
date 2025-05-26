"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { LineChartIcon as ChartLine, Loader2 } from "lucide-react"
import type { Team } from "@/types/teams"

interface TeamFormProps {
  addTeam: (team: Omit<Team, "id">) => void
  editTeam?: (team: Team) => void
  onCancel?: () => void
  initialTeam?: Team
  submitLabel?: string
  loading?: boolean
  setLoading?: (arg0: boolean) => void
}

export function TeamForm({
  addTeam,
  editTeam,
  onCancel,
  initialTeam,
  submitLabel = "Add Team",
  loading,
  setLoading,
}: Readonly<TeamFormProps>) {
  const [teamName, setTeamName] = useState("")
  const [vehicleClass, setVehicleClass] = useState<"Open" | "Standard">("Open")
  const [vehicleType, setVehicleType] = useState<"Bike" | "Kart">("Kart")

  useEffect(() => {
    if (initialTeam) {
      setTeamName(initialTeam.teamName)
      setVehicleClass(initialTeam.vehicleClass)
      setVehicleType(initialTeam.vehicleType)
    }
  }, [initialTeam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (setLoading) {
      setLoading(true)
    }

    if (!teamName.trim()) return

    if (initialTeam && editTeam) {
      await Promise.resolve(
        editTeam({
          id: initialTeam.id,
          teamName,
          vehicleClass,
          vehicleType,
          rankings: initialTeam.rankings,
          devices: initialTeam.devices,
        })
      )
    } else {
      await Promise.resolve(
        addTeam({
          teamName,
          vehicleClass,
          vehicleType,
          rankings: [],
          devices: [],
        })
      )
    }

    if (setLoading) {
      setLoading(false)
    }

    // Reset form if not editing
    if (!initialTeam) {
      setTeamName("")
      setVehicleClass("Open")
      setVehicleType("Kart")
    }
  }

  const handleViewEnergyMonitor = () => {
    // TODO: Actually need to go to ECU
    alert("No energy monitors yet :)))))")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="team-name">Team Name</Label>
        <Input
          id="team-name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Enter team name"
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Vehicle Class</Label>
        <RadioGroup
          value={vehicleClass}
          onValueChange={(value) => setVehicleClass(value as "Open" | "Standard")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="Open"
              id="open"
              className="hover:cursor-pointer"
              disabled={loading}
            />
            <Label htmlFor="open" className="hover:cursor-pointer">
              Open
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="Standard"
              id="standard"
              className="hover:cursor-pointer"
              disabled={loading}
            />
            <Label htmlFor="standard" className="hover:cursor-pointer">
              Standard
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Vehicle Type</Label>
        <RadioGroup
          value={vehicleType}
          onValueChange={(value) => setVehicleType(value as "Bike" | "Kart")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="Bike"
              id="bike"
              className="hover:cursor-pointer"
              disabled={loading}
            />
            <Label htmlFor="bike" className="hover:cursor-pointer">
              Bike
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="Kart"
              id="kart"
              className="hover:cursor-pointer"
              disabled={loading}
            />
            <Label htmlFor="kart" className="hover:cursor-pointer">
              Kart
            </Label>
          </div>
        </RadioGroup>
      </div>

      {initialTeam && (
        <div>
          <Button
            type="button"
            variant="outline"
            className="hover:cursor-pointer"
            disabled={loading}
            onClick={handleViewEnergyMonitor}
          >
            <ChartLine className="mr-2 h-4 w-4" />
            View Energy Monitor(s)
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" className="flex-1 hover:cursor-pointer" disabled={loading}>
          {loading ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="hover:cursor-pointer"
            disabled={loading}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
