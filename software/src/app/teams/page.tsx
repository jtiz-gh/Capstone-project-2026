"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Device, Team } from "@/types/teams"
import { TeamList } from "@/app/teams/team-list"
import { TeamForm } from "@/app/teams/team-form"
import Navbar from "@/components/Navbar"

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  // State for determining editing vs creating
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [activeTab, setActiveTab] = useState("view")
  const [showDevicePopup, setShowDevicePopup] = useState(false)
  const [availableDevices, setAvailableDevices] = useState<
    { id: number; serialNo: number; teamId: number | null }[]
  >([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

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
    setSelectedTeamId(teamId)
    try {
      const response = await fetch("/api/devices")
      if (response.ok) {
        const devices = await response.json()
        const unassigned = devices.filter((device: Device) => !device.teamId)
        setAvailableDevices(unassigned)
        setShowDevicePopup(true)
      } else {
        alert("Failed to fetch devices")
      }
    } catch (err) {
      alert("Error fetching devices")
    }
  }

  const handleAssignDevice = async (deviceId: number) => {
    if (!selectedTeamId) return
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeamId }),
      })
      if (response.ok) {
        const assignedDevice = await response.json()
        alert("Device assigned to team!")
        setShowDevicePopup(false)

        await fetch(`/api/teams/${selectedTeamId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            devices: {
              connect: [{ id: deviceId }],
            },
          }),
        })

        setTeams((prevTeams) =>
          prevTeams.map((team) =>
            team.id === selectedTeamId
              ? {
                  ...team,
                  devices: [...(team.devices || []), assignedDevice],
                }
              : team
          )
        )
      } else {
        alert("Failed to assign device")
      }
    } catch (err) {
      alert("Error assigning device")
    }
  }

  const handleCancelEdit = () => {
    setEditingTeam(null)
    setActiveTab("view")
  }

  return (
    <>
      <Navbar />
      {showDevicePopup && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="fixed inset-0 z-30 bg-black opacity-80"></div>
          <div className="z-50 min-w-[300px] rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold">Assign Device to Team</h2>
            {availableDevices.length === 0 ? (
              <p className="mb-4">No unassigned devices available.</p>
            ) : (
              <ul className="mb-4">
                {availableDevices.map((device) => (
                  <li key={device.id} className="mb-2 flex items-center justify-between">
                    <span>Serial No: {device.serialNo}</span>
                    <Button
                      size="sm"
                      onClick={() => handleAssignDevice(device.id)}
                      className="hover:cursor-pointer"
                    >
                      Assign
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="outline"
              onClick={() => setShowDevicePopup(false)}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
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
