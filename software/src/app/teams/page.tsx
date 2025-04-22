"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Team } from "@/types/teams"
import { TeamList } from "@/app/teams/team-list"
import { TeamForm } from "@/app/teams/team-form"

export default function TeamsPage() {
  // Placeholder data for teams until we connect to backend
  const [teams, setTeams] = useState<Team[]>([
    { id: "1", name: "Speed Demons", vehicleClass: "Open", vehicleType: "Kart" },
    { id: "2", name: "Electric Riders", vehicleClass: "Standard", vehicleType: "Bike" },
  ])

  // State for determining editing vs creating
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [activeTab, setActiveTab] = useState("view")

  const handleAddTeam = (teamData: Omit<Team, "id">) => {
    if (editingTeam) {
      // Update existing team
      setTeams(
        teams.map((team) =>
          team.id === editingTeam.id
            ? {
                ...team,
                ...teamData,
              }
            : team
        )
      )
      setEditingTeam(null)
    } else {
      // Add new team
      const newTeam: Team = {
        id: Date.now().toString(),
        ...teamData,
      }
      setTeams([...teams, newTeam])
    }

    setActiveTab("view")
  }

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team)
    setActiveTab("add")
  }

  const handleConnectECU = (teamId: string) => {
    // TODO: Actually need to connect to the ECU
    alert(`Connecting to ECU for team ID: ${teamId}`)
  }

  const handleCancelEdit = () => {
    setEditingTeam(null)
    setActiveTab("view")
  }

  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
      <main className="row-start-2 flex w-full max-w-3xl flex-col gap-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:cursor-pointer">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-[30px] font-bold">Teams</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="view" className="hover:cursor-pointer">
              View Teams
            </TabsTrigger>
            <TabsTrigger value="add" className="hover:cursor-pointer">
              {editingTeam ? "Edit Team" : "Add Team"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="mt-6">
            <TeamList teams={teams} onEditTeam={handleEditTeam} onConnectECU={handleConnectECU} />
          </TabsContent>

          <TabsContent value="add" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingTeam ? "View/Edit Team" : "Add New Team"}</CardTitle>
              </CardHeader>
              <CardContent>
                <TeamForm
                  onSubmit={handleAddTeam}
                  onCancel={editingTeam ? handleCancelEdit : undefined}
                  initialTeam={editingTeam || undefined}
                  submitLabel={editingTeam ? "Update Team" : "Add Team"}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
