"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Team } from "@/types/teams"
import { TeamList } from "@/app/teams/team-list"
import { TeamForm } from "@/app/teams/team-form"
import Navbar from "@/components/Navbar"

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  // State for determining editing vs creating
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [activeTab, setActiveTab] = useState("view")

  // Fetch teams on component mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/teams")
        if (response.ok) {
          const data = await response.json()
          setTeams(data)
        } else {
          console.error("Failed to fetch teams")
        }
      } catch (error) {
        console.error("Error fetching teams:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [])

  const handleAddTeam = async (teamData: Omit<Team, "id">) => {
    try {
      const response = await fetch("api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamName: teamData.teamName,
          vehicleClass: teamData.vehicleClass,
          vehicleType: teamData.vehicleType,
        }),
      })

      if (response.ok) {
        const newTeam = await response.json()
        setTeams([...teams, newTeam])
      } else {
        const errorText = await response.text()
        console.error("Failed to create team:", response.status, errorText)
      }
    } catch (error) {
      console.error("Error creating team:", error)
    }
    setActiveTab("view")
  }

  const handleEditTeam = async (teamData: Team) => {
    try {
      const response = await fetch(`api/teams/${teamData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamData),
      })
      if (response.ok) {
        const updatedTeam = await response.json()
        setTeams(teams.map((team) => (team.id === editingTeam!.id ? updatedTeam : team)))
        setEditingTeam(null)
      } else {
        console.error("Failed to update team")
      }
    } catch (error) {
      console.error("Error updating team:", error)
    }
    setActiveTab("view")
  }

  const handleEditingMode = (team: Team) => {
    setEditingTeam(team)
    setActiveTab("add")
  }

  const handleConfigureECU = async (teamId: number) => {
    // TODO: Actually need to connect to the ECU
    alert(`Connecting to ECU for team ID: ${teamId}`)
  }

  const handleCancelEdit = () => {
    setEditingTeam(null)
    setActiveTab("view")
  }

  return (
    <>
    <Navbar />
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
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <p>Loading teams...</p>
              </div>
            ) : (
              <TeamList
                teams={teams}
                onEditTeam={handleEditingMode}
                onConfigureECU={handleConfigureECU}
              />
            )}{" "}
          </TabsContent>

          <TabsContent value="add" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingTeam ? "View/Edit Team" : "Add New Team"}</CardTitle>
              </CardHeader>
              <CardContent>
                <TeamForm
                  addTeam={handleAddTeam}
                  editTeam={handleEditTeam}
                  onCancel={editingTeam ? handleCancelEdit : undefined}
                  initialTeam={editingTeam || undefined}
                  submitLabel={editingTeam ? "Update Team" : "Add Team"}
                  loading={loading}
                  setLoading={setLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </>
  )
}
