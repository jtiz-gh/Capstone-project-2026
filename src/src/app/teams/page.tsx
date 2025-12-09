"use client"

import { TeamForm } from "@/app/teams/team-form"
import { TeamList } from "@/app/teams/team-list"
import Navbar from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Team } from "@/types/teams"
import { ArrowLeft, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  // State for determining editing vs creating
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [activeTab, setActiveTab] = useState("view")
  const [showDevicePopup, setShowDevicePopup] = useState(false)
  const [devices, setDevices] = useState<{ id: number; serialNo: number; teamId: number | null }[]>(
    []
  )
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [search, setSearch] = useState("")

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
        let errorMsg = "Failed to create team"
        const errorJson = await response.json()
        errorMsg = errorJson.error || errorMsg
        toast.error(errorMsg)
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
        let errorMsg = "Failed to update team"
        const errorJson = await response.json()
        errorMsg = errorJson.error || errorMsg
        toast.error(errorMsg)
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

  const handleDeleteTeam = async (teamId: number) => {
    if (!confirm("Delete this team?")) return
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setTeams((prev) => prev.filter((t) => t.id !== teamId))
        setEditingTeam(null)
        setActiveTab("view")
      } else {
        console.error("Failed to delete team")
      }
    } catch (error) {
      console.error("Error deleting team:", error)
    }
  }

  const handleConfigureECU = async (teamId: number) => {
    setSelectedTeamId(teamId)
    try {
      const response = await fetch("/api/devices")
      if (response.ok) {
        const devices = await response.json()
        setDevices(devices)
        setShowDevicePopup(true)
      } else {
        alert("Failed to fetch devices")
      }
    } catch {
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
        setDevices((prevDevices) => {
          prevDevices.find((device) => device.id === deviceId)!.teamId = selectedTeamId
          return [...prevDevices]
        })
      }
    } catch {
      alert("Error assigning device")
    }
  }

  const handleUnassignDevice = async (deviceId: number, teamId: number) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: null }),
      })

      if (response.ok) {
        await fetch(`/api/teams/${teamId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            devices: {
              disconnect: [{ id: deviceId }],
            },
          }),
        })

        setTeams((prevTeams) =>
          prevTeams.map((team) =>
            team.id === teamId
              ? {
                  ...team,
                  devices: team.devices.filter((device) => device.id !== deviceId),
                }
              : team
          )
        )

        setDevices((prevDevices) =>
          prevDevices.map((device) =>
            device.id === deviceId ? { ...device, teamId: null } : device
          )
        )
      } else {
        throw new Error("Failed to unassign device")
      }
    } catch (err) {
      console.error("Error unassigning device:", err)
      alert("Error unassigning device")
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
          <div className="relative z-50 w-full max-w-[95vw] rounded-lg bg-white p-2 shadow-lg sm:max-w-lg sm:p-6">
            <button
              onClick={() => setShowDevicePopup(false)}
              className="absolute top-2 right-2 rounded-full p-2 text-gray-500 hover:cursor-pointer hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="mb-4 text-lg font-bold">
              Assign Device to {teams.find((team) => team.id == selectedTeamId)?.teamName}
            </h2>
            {devices.length === 0 ? (
              <p className="mb-4">No devices available.</p>
            ) : (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full min-w-[320px] text-xs sm:text-sm">
                  <thead>
                    <tr>
                      <th className="px-1 py-2 text-left sm:px-4">Device Serial No</th>
                      <th className="px-1 py-2 text-left sm:px-4">Assigned Team</th>
                      <th className="px-1 py-2 sm:px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((device) => (
                      <tr key={device.id} className="border-t">
                        <td className="px-1 py-2 sm:px-4">{device.serialNo}</td>
                        <td className="px-1 py-2 sm:px-4">
                          {device.teamId ? (
                            teams.find((team) => team.id == device.teamId)?.teamName || "Unknown"
                          ) : (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                        </td>
                        <td className="px-1 py-2 text-right sm:px-2">
                          {device.teamId ? (
                            <Button
                              size="sm"
                              onClick={() => handleUnassignDevice(device.id, device.teamId!)}
                              className="bg-red-600 text-white hover:cursor-pointer hover:bg-red-700 hover:text-white"
                            >
                              Unassign
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleAssignDevice(device.id)}
                              className="hover:cursor-pointer"
                            >
                              Assign
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex min-h-screen justify-center px-8 pt-4 pb-20 font-[family-name:var(--font-geist-sans)] sm:px-20 sm:pt-8">
        <main className="flex w-full max-w-3xl flex-col gap-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="hover:cursor-pointer"
                data-testid="back-button"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-[30px] font-bold">Teams</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="view" className="font-semibold hover:cursor-pointer">
                View Teams
              </TabsTrigger>
              <TabsTrigger value="add" className="font-semibold hover:cursor-pointer">
                {editingTeam ? "Edit Team" : "Add Team"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="mt-6">
              <div className="mb-4 flex w-full">
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <p>Loading teams...</p>
                </div>
              ) : (
                <TeamList
                  teams={teams.filter((team) =>
                    team.teamName.toLowerCase().includes(search.toLowerCase())
                  )}
                  onEditTeam={handleEditingMode}
                  onConfigureECU={handleConfigureECU}
                  searchTerm={search}
                />
              )}
            </TabsContent>

            <TabsContent value="add" className="mt-6">
              <Card>
                <CardContent>
                  <TeamForm
                    addTeam={handleAddTeam}
                    editTeam={handleEditTeam}
                    onCancel={editingTeam ? handleCancelEdit : undefined}
                    initialTeam={editingTeam || undefined}
                    submitLabel={editingTeam ? "Update Team" : "Add Team"}
                    loading={loading}
                    setLoading={setLoading}
                    onDeleteTeam={editingTeam ? handleDeleteTeam : undefined}
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
