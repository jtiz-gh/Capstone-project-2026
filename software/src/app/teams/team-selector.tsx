"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Team } from "@/types/teams"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TeamForm } from "./team-form"
import { PlusCircle } from "lucide-react"

interface TeamSelectorProps {
  teams: Team[]
  selectedTeams: number[]
  onTeamToggle: (teamId: number) => void
  onAddTeam: (team: Omit<Team, "id">) => void
  showAddTeamOption?: boolean
}

export function TeamSelector({
  teams,
  selectedTeams,
  onTeamToggle,
  onAddTeam,
  showAddTeamOption = true,
}: TeamSelectorProps) {
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false)

  const handleAddTeam = (teamData: Omit<Team, "id">) => {
    onAddTeam(teamData)
    setIsAddTeamDialogOpen(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="block">
          Select Teams
          {selectedTeams.length === 0 && (
            <span className="ml-2 text-sm text-red-500">At least 1 team required</span>
          )}
        </Label>
        {showAddTeamOption && (
          <Dialog open={isAddTeamDialogOpen} onOpenChange={setIsAddTeamDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1 hover:cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                Add New Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Team</DialogTitle>
              </DialogHeader>
              <TeamForm addTeam={handleAddTeam} />
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {teams.map((team) => (
          <div key={team.id} className="flex items-center space-x-2">
            <Checkbox
              id={`team-${team.id}`}
              className="hover:cursor-pointer"
              checked={selectedTeams.includes(team.id)}
              onCheckedChange={() => onTeamToggle(team.id)}
            />
            <Label htmlFor={`team-${team.id}`} className="cursor-pointer">
              {team.teamName} ({team.vehicleClass} - {team.vehicleType})
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}
