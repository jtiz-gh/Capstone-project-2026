// components/RecordSelectionModal.tsx

"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import { CalendarIcon, DatabaseIcon, MonitorIcon } from "lucide-react"

interface Record {
  id: number
  avgVoltage: number | null
  avgCurrent: number | null
  energy: number | null
  stopTime: string
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

interface RecordSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  records: Record[]
  teamId: string
  competitionId: string
  competitionName: string
  onRecordSelected: (recordIds: number[]) => void
  isAssigning?: boolean
}

export default function RecordSelectionModal({
  isOpen,
  onClose,
  records,
  teamId,
  competitionId,
  competitionName,
  onRecordSelected,
  isAssigning = false,
}: RecordSelectionModalProps) {
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Auto-select all records when in assigning mode
  useEffect(() => {
    if (isOpen && isAssigning && records.length > 0) {
      setSelectedRecordIds(records.map((r) => r.id))
    } else {
      setSelectedRecordIds([])
    }
  }, [isOpen, isAssigning, records])

  const handleSelectRecord = (recordId: number, checked: boolean) => {
    if (isAssigning) {
      // Multi-select mode for assigning
      if (checked) {
        setSelectedRecordIds((prev) => [...prev, recordId])
      } else {
        setSelectedRecordIds((prev) => prev.filter((id) => id !== recordId))
      }
    } else {
      // Single select mode for viewing
      setSelectedRecordIds(checked ? [recordId] : [])
    }
  }

  const handleSelectAll = () => {
    if (selectedRecordIds.length === records.length) {
      setSelectedRecordIds([])
    } else {
      setSelectedRecordIds(records.map((r) => r.id))
    }
  }

  const handleConfirm = async () => {
    if (selectedRecordIds.length === 0) return

    if (isAssigning) {
      // Assign multiple records to the competition
      setIsLoading(true)
      try {
        const promises = selectedRecordIds.map((recordId) =>
          fetch("/api/records/assign", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              recordId,
              competitionId: parseInt(competitionId),
            }),
          })
        )

        const responses = await Promise.all(promises)
        const failedResponses = responses.filter((response) => !response.ok)

        if (failedResponses.length > 0) {
          throw new Error(`Failed to assign ${failedResponses.length} records`)
        }

        onRecordSelected(selectedRecordIds)
        onClose()
      } catch (error) {
        console.error("Error assigning records:", error)
        // TODO: Show error message to user
      } finally {
        setIsLoading(false)
      }
    } else {
      // Just select the records for viewing
      onRecordSelected(selectedRecordIds)
      onClose()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatEnergy = (energy: number | null) => {
    if (energy === null) return "N/A"
    return `${energy.toFixed(2)} J`
  }

  const title = isAssigning
    ? `Assign Records to ${competitionName}`
    : `Select Record for ${competitionName}`

  const description = isAssigning
    ? "No assigned records found for this competition. Select records to assign (you can select multiple):"
    : "Multiple records found. Please select one to view:"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{description}</p>
            {isAssigning && records.length > 1 && (
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedRecordIds.length === records.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>

          {records.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No records available.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {records.map((record) => (
                <Card
                  key={record.id}
                  className={`cursor-pointer transition-all ${
                    selectedRecordIds.includes(record.id)
                      ? "bg-primary/5 ring-2 ring-primary"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    const isSelected = selectedRecordIds.includes(record.id)
                    handleSelectRecord(record.id, !isSelected)
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {isAssigning && (
                          <Checkbox
                            checked={selectedRecordIds.includes(record.id)}
                            onCheckedChange={(checked) =>
                              handleSelectRecord(record.id, checked as boolean)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <div>
                          <CardTitle className="text-lg">Record #{record.id}</CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-2">
                            <MonitorIcon className="h-4 w-4" />
                            Device: {record.device.deviceName || record.device.id} (
                            {record.device.team?.teamName || "No Team"})
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {record.competition && (
                          <Badge variant="secondary">
                            Assigned to: {record.competition.competitionName}
                          </Badge>
                        )}
                        {!record.competition && <Badge variant="outline">Unassigned</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      <div>
                        <p className="font-medium text-muted-foreground">Energy</p>
                        <p>{formatEnergy(record.energy)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Avg Voltage</p>
                        <p>{record.avgVoltage ? `${record.avgVoltage.toFixed(2)} V` : "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Avg Current</p>
                        <p>{record.avgCurrent ? `${record.avgCurrent.toFixed(2)} A` : "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Data Points</p>
                        <p className="flex items-center gap-1">
                          <DatabaseIcon className="h-3 w-3" />
                          {record._count.sensorData}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 border-t pt-3">
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        Recorded: {formatDate(record.stopTime)}
                      </p>
                      {record.race && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Race: {record.race.raceName}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              {selectedRecordIds.length > 0 &&
                `${selectedRecordIds.length} record${selectedRecordIds.length > 1 ? "s" : ""} selected`}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedRecordIds.length === 0 || isLoading}
                className="min-w-[100px]"
              >
                {isLoading
                  ? "Processing..."
                  : isAssigning
                    ? `Assign (${selectedRecordIds.length})`
                    : "Select"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
