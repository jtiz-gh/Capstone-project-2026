"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft, Users, ChartLine } from "lucide-react"

type Team = {
  id: string
  name: string
  vehicleClass: "Open" | "Standard"
  vehicleType: "Bike" | "Kart"
}

export default function TeamsPage() {
  // Placeholder data for teams until we connect to backend
  const [teams, setTeams] = useState<Team[]>([
    { id: "1", name: "Speed Demons", vehicleClass: "Open", vehicleType: "Kart" },
    { id: "2", name: "Electric Riders", vehicleClass: "Standard", vehicleType: "Bike" },
  ])

  // States for current team
  const [teamName, setTeamName] = useState("")
  const [vehicleClass, setVehicleClass] = useState<"Open" | "Standard">("Open")
  const [vehicleType, setVehicleType] = useState<"Bike" | "Kart">("Kart")
  // State for determining editing vs creating
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [activeTab, setActiveTab] = useState("view")

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault()

    if (!teamName.trim()) return

    if (editingTeam) {
      // Update existing team
      setTeams(
        teams.map((team) =>
          team.id === editingTeam.id
            ? {
                ...team,
                name: teamName,
                vehicleClass,
                vehicleType,
              }
            : team
        )
      )
      setEditingTeam(null)
    } else {
      // Add new team
      const newTeam: Team = {
        id: Date.now().toString(),
        name: teamName,
        vehicleClass,
        vehicleType,
      }
      setTeams([...teams, newTeam])
    }

    // Reset form
    setTeamName("")
    setVehicleClass("Open")
    setVehicleType("Kart")
    setActiveTab("view")
  }

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team)
    setTeamName(team.name)
    setVehicleClass(team.vehicleClass)
    setVehicleType(team.vehicleType)
    setActiveTab("add")
  }

  const handleConnectECU = (teamId: string) => {
    // TODO: Actually need to connect to the ECU
    alert(`Connecting to ECU for team ID: ${teamId}`)
  }

  const handleViewEnergyMonitor = () => {
    // TODO: Actually need to go to ECU
    alert("No energy monitors yet :)))))")
  }

  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
      <main className="row-start-2 flex w-full max-w-3xl flex-col gap-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-[30px] font-bold">Teams</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="view">View Teams</TabsTrigger>
            <TabsTrigger value="add">{editingTeam ? "Edit Team" : "Add Team"}</TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="mt-6">
            {teams.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No teams added yet. Add your first team!</p>
              </div>
            ) : (
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
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditTeam(team)}>
                          View/Edit
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleConnectECU(team.id)}
                        >
                          Connect to ECU
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingTeam ? "View/Edit Team" : "Add New Team"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddTeam} className="space-y-6">
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
                        <RadioGroupItem value="Open" id="open" />
                        <Label htmlFor="open">Open</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Standard" id="standard" />
                        <Label htmlFor="standard">Standard</Label>
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
                        <RadioGroupItem value="Bike" id="bike" />
                        <Label htmlFor="bike">Bike</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Kart" id="kart" />
                        <Label htmlFor="kart">Kart</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    {editingTeam && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleViewEnergyMonitor}
                      >
                        <ChartLine />
                        View Energy Monitor(s)
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingTeam ? "Update Team" : "Add Team"}
                    </Button>
                    {editingTeam && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingTeam(null)
                          setTeamName("")
                          setVehicleClass("Open")
                          setVehicleType("Kart")
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
