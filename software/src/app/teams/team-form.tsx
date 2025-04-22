"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { LineChartIcon as ChartLine } from "lucide-react"
import type { Team } from "@/types/teams"

interface TeamFormProps {
  onSubmit: (team: Omit<Team, "id">) => void
  onCancel?: () => void
  initialTeam?: Team
  submitLabel?: string
}

export function TeamForm({
  onSubmit,
  onCancel,
  initialTeam,
  submitLabel = "Add Team",
}: TeamFormProps) {
  const [teamName, setTeamName] = useState("")
  const [vehicleClass, setVehicleClass] = useState<"Open" | "Standard">("Open")
  const [vehicleType, setVehicleType] = useState<"Bike" | "Kart">("Kart")

  useEffect(() => {
    if (initialTeam) {
      setTeamName(initialTeam.name)
      setVehicleClass(initialTeam.vehicleClass)
      setVehicleType(initialTeam.vehicleType)
    }
  }, [initialTeam])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!teamName.trim()) return

    onSubmit({
      name: teamName,
      vehicleClass,
      vehicleType,
    })

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
            <RadioGroupItem value="Open" id="open" className="hover:cursor-pointer" />
            <Label htmlFor="open" className="hover:cursor-pointer">
              Open
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Standard" id="standard" className="hover:cursor-pointer" />
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
            <RadioGroupItem value="Bike" id="bike" className="hover:cursor-pointer" />
            <Label htmlFor="bike" className="hover:cursor-pointer">
              Bike
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Kart" id="kart" className="hover:cursor-pointer" />
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
            onClick={handleViewEnergyMonitor}
          >
            <ChartLine className="mr-2 h-4 w-4" />
            View Energy Monitor(s)
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" className="flex-1 hover:cursor-pointer">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="hover:cursor-pointer"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
