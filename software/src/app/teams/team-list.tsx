"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"
import type { Team } from "@/types/teams"

interface TeamListProps {
  teams: Team[]
  onEditTeam?: (team: Team) => void
  onConfigureECU?: (teamId: number) => void
  emptyMessage?: string
  showActions?: boolean
}

export function TeamList({
  teams,
  onEditTeam,
  onConfigureECU,
  emptyMessage = "No teams added yet. Add your first team!",
  showActions = true,
}: TeamListProps) {
  if (teams.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <Users className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {teams.map((team) => (
        <Card key={team.id}>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 gap-2 sm:gap-0">
            <div>
              <h3 className="text-xl font-semibold">{team.teamName}</h3>
              <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                <span>{team.vehicleClass} Class</span>
                <span>{team.vehicleType}</span>
              </div>
              <div className="mt-2 flex text-sm text-muted-foreground">
                {team.devices && team.devices.length > 0 ? (
                  <span>
                    Assigned to ECU: {team.devices.map((device) => device.serialNo).join(", ")}
                  </span>
                ) : (
                  <span>Not assigned to an ECU.</span>
                )}
              </div>
            </div>
            {showActions && (
              <div className="flex items-center gap-2">
                {onEditTeam && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:cursor-pointer"
                    onClick={() => onEditTeam(team)}
                  >
                    View/Edit
                  </Button>
                )}
                {onConfigureECU && (
                  <Button
                    variant="default"
                    size="sm"
                    className="hover:cursor-pointer"
                    onClick={() => onConfigureECU(team.id)}
                  >
                    Configure ECU
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
