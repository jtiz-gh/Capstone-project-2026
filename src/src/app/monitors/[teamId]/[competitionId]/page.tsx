"use client"

import { SynchronizedCharts } from "@/components/MultiChartContainer"
import Navbar from "@/components/Navbar"
import RecordSelectionModal from "@/components/RecordSelectionModal"
import AdvancedRecordManager from "@/components/AdvancedRecordManager"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState, useRef, useCallback } from "react"
import { Loader2, AlertCircle, Database, Settings } from "lucide-react"

interface SensorDataEntry {
  id: number
  measurementId: number
  deviceId: number
  timestamp: number
  sessionId: number
  recordId: number
  avgVoltage: number | null
  avgCurrent: number | null
  avgPower: number | null
  peakVoltage: number | null
  peakCurrent: number | null
  peakPower: number | null
  energy: number | null
}

interface Record {
  id: number
  avgVoltage: number | null
  avgCurrent: number | null
  energy: number | null
  stopTime: string
  disabled: boolean
  mergedFromIds: number[]
  timeOffset: number
  sortOrder: number | null
  device: {
    id: number
    deviceName: string
    team: {
      id: number
      teamName: string
    }
  }
  race: {
    id: number
    raceName: string
  } | null
  competition: {
    id: number
    competitionName: string
  } | null
  _count: {
    sensorData: number
  }
}

export default function Monitors() {
  const { teamId, competitionId } = useParams()
  const [isClient, setIsClient] = useState(false)
  const [mergedData, setMergedData] = useState<SensorDataEntry[]>([])
  const [teamName, setTeamName] = useState<string>("")
  const [competitionName, setCompetitionName] = useState<string>("")
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [modalRecords, setModalRecords] = useState<Record[]>([])
  const [isAssigningMode, setIsAssigningMode] = useState(false)
  const [showAdvancedManager, setShowAdvancedManager] = useState(false)

  const [showNewDataOverlay, setShowNewDataOverlay] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const [minId, setMinId] = useState<number | null>(null)
  const [lastMaxId, setLastMaxId] = useState<number>(0)

  const fetchSensorDataByRecordId = useCallback(async (recordId: number, resetCutoff = false) => {
    try {
      let newMinId = minId

      // If resetting cutoff, get the latest database ID first
      if (resetCutoff) {
        const latestRes = await fetch(`/api/sensor-data?recordId=${recordId}`)
        if (latestRes.ok) {
          const allData: SensorDataEntry[] = await latestRes.json()
          if (allData.length > 0) {
            const maxId = Math.max(...allData.map(d => d.id))
            newMinId = maxId + 1
            setMinId(newMinId)
            setLastMaxId(maxId)
            console.log(`Reset cutoff: will show data from ID ${newMinId} onwards`)
          } else {
            // No existing data, start from 0
            newMinId = 0
            setMinId(0)
            setLastMaxId(0)
            console.log('No existing data, will show all new data')
          }
        }
        // Always clear data when resetting
        setMergedData([])
        return
      }

      // Build URL with optional minId filter
      let url = `/api/sensor-data?recordId=${recordId}`
      if (newMinId !== null && newMinId > 0) {
        url += `&minId=${newMinId}`
      }

      console.log('Fetching sensor data:', url)
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error("Failed to fetch sensor data")
      }
      const rawData: SensorDataEntry[] = await res.json()
      console.log(`Received ${rawData.length} data points`)

      if (!Array.isArray(rawData) || rawData.length === 0) {
        setMergedData([])
        return
      }

      // Convert to relative time in ms
      const firstTimestamp = rawData[0].timestamp
      const mutatedData = rawData.map((entry) => ({
        ...entry,
        timestamp: entry.timestamp - firstTimestamp,
      }))

      setMergedData(mutatedData)
      
      // Track the max database ID we've seen
      const maxId = Math.max(...rawData.map(d => d.id))
      setLastMaxId(maxId)
      console.log(`Updated lastMaxId to ${maxId}`)
    } catch (error) {
      console.error("Error fetching sensor data:", error)
      setError("Failed to load sensor data")
    }
  }, [minId])

  const handleRecordSelection = async (recordIds: number[]) => {
    if (recordIds.length === 1) {
      // Single record selected - show it
      const record = modalRecords.find((r) => r.id === recordIds[0])
      if (record) {
        setSelectedRecord(record)
        await fetchSensorDataByRecordId(recordIds[0], true)
      }
    } else if (recordIds.length > 1) {
      // Multiple records selected - show first one but remember all
      const allSelectedRecords = modalRecords.filter((r) => recordIds.includes(r.id))
      setSelectedRecord(allSelectedRecords[0])
      await fetchSensorDataByRecordId(allSelectedRecords[0].id, true)
    }
  }

  const showRecordSelectionModal = (records: Record[], assigningMode = false) => {
    setModalRecords(records)
    setIsAssigningMode(assigningMode)
    setShowRecordModal(true)
  }

  const handleRecordUpdated = async (recordId: number) => {
    // Refresh the selected record if it was updated
    if (selectedRecord && selectedRecord.id === recordId) {
      await searchForRecords()
    }
  }

  const handleRecordsMerged = async (newRecordId: number) => {
    // Fetch the new merged record and set it as selected
    try {
      const response = await fetch(`/api/records/${newRecordId}`)
      if (response.ok) {
        const newRecord = await response.json()
        setSelectedRecord(newRecord)
        await fetchSensorDataByRecordId(newRecordId, false)
      }
    } catch (error) {
      console.error("Error fetching merged record:", error)
      await searchForRecords() // Fallback to search
    }
  }

  const searchForRecords = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // First, search for assigned records for this team and competition
      const assignedRes = await fetch(
        `/api/records?teamId=${teamId}&competitionId=${competitionId}`
      )
      if (!assignedRes.ok) {
        throw new Error("Failed to fetch assigned records")
      }

      const assignedData = await assignedRes.json()
      const assignedRecords: Record[] = assignedData.records || []

      if (assignedRecords.length > 0) {
        if (assignedRecords.length === 1) {
          // Single record found, use it directly
          setSelectedRecord(assignedRecords[0])
          await fetchSensorDataByRecordId(assignedRecords[0].id, true)
        } else {
          // Multiple records found, show selection modal
          showRecordSelectionModal(assignedRecords, false)
        }
      } else {
        // No assigned records found, search for unassigned records
        const unassignedRes = await fetch(`/api/records/unassigned?teamId=${teamId}`)
        if (!unassignedRes.ok) {
          throw new Error("Failed to fetch unassigned records")
        }

        const unassignedRecords: Record[] = await unassignedRes.json()

        if (unassignedRecords.length > 0) {
          if (unassignedRecords.length === 1) {
            // Single unassigned record - auto assign it
            try {
              const assignRes = await fetch("/api/records/assign", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  recordId: unassignedRecords[0].id,
                  competitionId: parseInt(competitionId as string),
                }),
              })

              if (assignRes.ok) {
                const updatedRecord = await assignRes.json()
                setSelectedRecord(updatedRecord)
                await fetchSensorDataByRecordId(updatedRecord.id, true)
              } else {
                throw new Error("Failed to auto-assign record")
              }
            } catch (error) {
              console.error("Error auto-assigning record:", error)
              // Fall back to showing assignment modal
              showRecordSelectionModal(unassignedRecords, true)
            }
          } else {
            // Multiple unassigned records - show assignment modal with all selected by default
            showRecordSelectionModal(unassignedRecords, true)
          }
        } else {
          setError("No records found for this team. Please upload sensor data first.")
        }
      }
    } catch (error) {
      console.error("Error searching for records:", error)
      setError("Failed to search for records")
    } finally {
      setIsLoading(false)
    }
  }, [teamId, competitionId, fetchSensorDataByRecordId])

  useEffect(() => {
    setIsClient(true)

    const fetchTeamAndCompetition = async () => {
      try {
        // Fetch team name
        if (teamId) {
          const teamRes = await fetch(`/api/teams/${teamId}`)
          if (teamRes.ok) {
            const teamData = await teamRes.json()
            setTeamName(teamData.teamName)
          }
        }

        // Fetch competition name
        if (competitionId) {
          const compRes = await fetch(`/api/competitions/${competitionId}`)
          if (compRes.ok) {
            const compData = await compRes.json()
            setCompetitionName(compData.competitionName)
          }
        }
      } catch (error) {
        console.error("Error fetching team/competition data:", error)
      }
    }

    fetchTeamAndCompetition()
    searchForRecords()
  }, [teamId, competitionId, searchForRecords])

  useEffect(() => {
    if (!selectedRecord) return
    setShowNewDataOverlay(false)
    if (pollingRef.current) clearInterval(pollingRef.current)
    const poll = async () => {
      try {
        // Check if there's any data with ID greater than what we've seen
        const checkId = Math.max(
          minId || 0,
          lastMaxId + 1
        )
        
        let checkUrl = `/api/sensor-data?recordId=${selectedRecord.id}`
        if (checkId > 0) {
          checkUrl += `&minId=${checkId}`
        }
        
        console.log('Polling for new data:', checkUrl, 'checkId:', checkId)
        const res = await fetch(checkUrl)
        if (res.ok) {
          const newData = await res.json()
          console.log(`Poll found ${newData.length} new data points`)
          if (newData.length > 0) {
            // New data arrived, refresh the display
            console.log('New data detected, refreshing display')
            await fetchSensorDataByRecordId(selectedRecord.id, false)
          }
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }
    pollingRef.current = setInterval(poll, 1000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [selectedRecord, minId, lastMaxId, fetchSensorDataByRecordId])

  const handleReloadGraph = async () => {
    if (selectedRecord) {
      setLastMaxId(0)
      await fetchSensorDataByRecordId(selectedRecord.id, true)
      setShowNewDataOverlay(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatEnergy = (energy: number | null) => {
    if (energy === null) return "N/A"
    return `${energy.toFixed(2)} J`
  }

  return (
    <>
      <Navbar />
      <div className="mt-4 mb-4 flex flex-col justify-between gap-2 border-b-2 border-gray-300 px-4 pb-2 sm:flex-row sm:items-center">
        <Link href={`/competitions/${competitionId}`}>
          <Button
            variant="outline"
            className="flex h-10 items-center justify-center gap-2 px-4 text-sm hover:cursor-pointer sm:px-6 sm:text-lg"
            data-testid="energy-monitors-button"
          >
            ← Back
          </Button>
        </Link>
        <h1 className="text-center text-lg font-bold sm:text-left sm:text-xl">
          Energy Monitors for {teamName || decodeURIComponent(teamId as string)} competing in{" "}
          {competitionName || decodeURIComponent(competitionId as string)}
        </h1>
        <div className="hidden w-[120px] sm:block"></div>
      </div>

      {/* Record Selection Modal */}
      <RecordSelectionModal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        records={modalRecords}
        teamId={teamId as string}
        competitionId={competitionId as string}
        competitionName={competitionName || decodeURIComponent(competitionId as string)}
        onRecordSelected={handleRecordSelection}
        isAssigning={isAssigningMode}
      />

      <div className="container mx-auto px-2 sm:px-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex min-h-[200px] w-full items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Searching for records...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex min-h-[200px] w-full items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">{error}</p>
                <Button onClick={searchForRecords} className="w-full">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Selected Record Info */}
        {selectedRecord && !isLoading && !error && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Selected Record #{selectedRecord.id}
                    </CardTitle>
                    <CardDescription>
                      Device: {selectedRecord.device.deviceName} | Data Points:{" "}
                      {selectedRecord._count.sensorData} | Recorded:{" "}
                      {formatDate(selectedRecord.stopTime)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {selectedRecord.competition && (
                      <Badge variant="secondary">
                        {selectedRecord.competition.competitionName}
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdvancedManager(true)}
                      className="flex items-center gap-1"
                    >
                      <Settings className="h-3 w-3" />
                      Advanced
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleReloadGraph}>
                      Reset Graph
                    </Button>
                    <Button variant="outline" size="sm" onClick={searchForRecords}>
                      Change Record
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                  <div>
                    <p className="font-medium text-muted-foreground">Energy</p>
                    <p className="text-lg font-semibold">{formatEnergy(selectedRecord.energy)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Avg Voltage</p>
                    <p className="text-lg font-semibold">
                      {selectedRecord.avgVoltage
                        ? `${selectedRecord.avgVoltage.toFixed(2)} V`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Avg Current</p>
                    <p className="text-lg font-semibold">
                      {selectedRecord.avgCurrent
                        ? `${selectedRecord.avgCurrent.toFixed(2)} A`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        {isClient && selectedRecord && (
          <>
            <SynchronizedCharts
              chartData={mergedData}
              showNewDataOverlay={showNewDataOverlay}
              onReloadRequested={handleReloadGraph}
            />
            {mergedData.length === 0 && (
              <div className="mt-4 flex w-full items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Waiting for new sensor data...
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Charts will update automatically when data is received
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* No Data State - removed as we handle this above */}
      </div>

      {/* Advanced Record Manager */}
      <AdvancedRecordManager
        isOpen={showAdvancedManager}
        onClose={() => setShowAdvancedManager(false)}
        records={modalRecords.length > 0 ? modalRecords : selectedRecord ? [selectedRecord] : []}
        teamId={teamId as string}
        competitionId={competitionId as string}
        competitionName={competitionName || decodeURIComponent(competitionId as string)}
        onRecordUpdated={handleRecordUpdated}
        onRecordsMerged={handleRecordsMerged}
      />
    </>
  )
}
