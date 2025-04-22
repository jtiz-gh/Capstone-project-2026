"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"
import type { Team } from "@/types/teams"

interface TeamListProps {
  teams: Team[]
  onEditTeam?: (team: Team) => void
  onConnectECU?: (teamId: string) => void
  emptyMessage?: string
  showActions?: boolean
}

export function TeamList({
  teams,
  onEditTeam,
  onConnectECU,
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
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-xl font-semibold">{team.name}</h3>
              <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                <span>{team.vehicleClass} Class</span>
                <span>{team.vehicleType}</span>
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
                {onConnectECU && (
                  <Button
                    variant="default"
                    size="sm"
                    className="hover:cursor-pointer"
                    onClick={() => onConnectECU(team.id)}
                  >
                    Connect to ECU
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
