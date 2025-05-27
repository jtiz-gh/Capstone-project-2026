"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  DatabaseIcon,
  GripVertical,
  Merge,
  Clock,
  Settings,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
} from "lucide-react"

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

interface RecordWithTimeOffset extends Record {
  customTimeOffset: number
}

interface SortableRecordProps {
  record: RecordWithTimeOffset
  isSelected: boolean
  onSelect: (recordId: number, selected: boolean) => void
  onTimeOffsetChange: (recordId: number, offset: number) => void
  onToggleDisabled: (recordId: number) => void
  onView: (recordId: number) => void
}

function SortableRecord({
  record,
  isSelected,
  onSelect,
  onTimeOffsetChange,
  onToggleDisabled,
  onView,
}: SortableRecordProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: record.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatEnergy = (energy: number | null) => {
    if (energy === null) return "N/A"
    return `${energy.toFixed(2)} J`
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all ${
        record.disabled ? "bg-gray-50 opacity-50" : ""
      } ${isSelected ? "ring-2 ring-primary" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-sm">
                <DatabaseIcon className="h-4 w-4" />
                Record #{record.id}
                {record.mergedFromIds && record.mergedFromIds.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Merged from {record.mergedFromIds.length} records
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {record.device.deviceName} | {record._count.sensorData} data points
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(record.id, !!checked)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="font-medium text-muted-foreground">Energy</p>
            <p className="font-semibold">{formatEnergy(record.energy)}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Avg Voltage</p>
            <p className="font-semibold">
              {record.avgVoltage ? `${record.avgVoltage.toFixed(2)} V` : "N/A"}
            </p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Avg Current</p>
            <p className="font-semibold">
              {record.avgCurrent ? `${record.avgCurrent.toFixed(2)} A` : "N/A"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <Label htmlFor={`time-offset-${record.id}`} className="text-xs">
              Time Offset (ms)
            </Label>
          </div>
          <Input
            id={`time-offset-${record.id}`}
            type="number"
            value={record.customTimeOffset}
            onChange={(e) => onTimeOffsetChange(record.id, parseInt(e.target.value) || 0)}
            className="h-7 text-xs"
            min="0"
            step="100"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(record.id)}
              className="h-7 px-2 text-xs"
            >
              <Eye className="mr-1 h-3 w-3" />
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleDisabled(record.id)}
              className={`h-7 px-2 text-xs ${record.disabled ? "text-green-600" : "text-red-600"}`}
            >
              {record.disabled ? (
                <>
                  <Eye className="mr-1 h-3 w-3" />
                  Enable
                </>
              ) : (
                <>
                  <EyeOff className="mr-1 h-3 w-3" />
                  Disable
                </>
              )}
            </Button>
          </div>
          <Badge variant="secondary" className="text-xs">
            {formatDate(record.stopTime)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

interface AdvancedRecordManagerProps {
  isOpen: boolean
  onClose: () => void
  records: Record[]
  teamId: string
  competitionId: string
  competitionName: string
  onRecordUpdated: (recordId: number) => void
  onRecordsMerged: (newRecordId: number) => void
}

export default function AdvancedRecordManager({
  isOpen,
  onClose,
  records,
  teamId,
  competitionId,
  competitionName,
  onRecordUpdated,
  onRecordsMerged,
}: AdvancedRecordManagerProps) {
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([])
  const [recordsWithOffsets, setRecordsWithOffsets] = useState<RecordWithTimeOffset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("manage")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (records.length > 0) {
      const initialRecords = records.map((record, index) => ({
        ...record,
        customTimeOffset: record.timeOffset || 0,
        sortOrder: record.sortOrder || index,
      }))
      setRecordsWithOffsets(initialRecords.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)))
    }
  }, [records])

  const handleSelectRecord = (recordId: number, selected: boolean) => {
    setSelectedRecordIds((prev) =>
      selected ? [...prev, recordId] : prev.filter((id) => id !== recordId)
    )
  }

  const handleSelectAll = () => {
    if (selectedRecordIds.length === recordsWithOffsets.filter((r) => !r.disabled).length) {
      setSelectedRecordIds([])
    } else {
      setSelectedRecordIds(recordsWithOffsets.filter((r) => !r.disabled).map((r) => r.id))
    }
  }

  const handleTimeOffsetChange = (recordId: number, offset: number) => {
    setRecordsWithOffsets((prev) =>
      prev.map((record) =>
        record.id === recordId ? { ...record, customTimeOffset: offset } : record
      )
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setRecordsWithOffsets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleToggleDisabled = async (recordId: number) => {
    setIsLoading(true)
    try {
      const record = recordsWithOffsets.find((r) => r.id === recordId)
      const response = await fetch(`/api/records/${recordId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          disabled: !record?.disabled,
        }),
      })

      if (response.ok) {
        setRecordsWithOffsets((prev) =>
          prev.map((r) => (r.id === recordId ? { ...r, disabled: !r.disabled } : r))
        )
        onRecordUpdated(recordId)
        toast.success(
          `Record #${recordId} ${record?.disabled ? "enabled" : "disabled"} successfully`
        )
      } else {
        throw new Error("Failed to update record status")
      }
    } catch (error) {
      console.error("Error toggling record disabled status:", error)
      toast.error("Failed to update record status")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMergeRecords = async () => {
    if (selectedRecordIds.length < 2) return

    setIsLoading(true)
    try {
      // Get the records to merge
      const recordsToMerge = recordsWithOffsets.filter((r) => selectedRecordIds.includes(r.id))
      const sortedRecords = recordsToMerge.sort(
        (a, b) => recordsWithOffsets.indexOf(a) - recordsWithOffsets.indexOf(b)
      )

      // Calculate time offsets for merging
      const timeOffsets = sortedRecords.map((record, index) => ({
        recordId: record.id,
        offset: record.customTimeOffset + index * 1000, // Add 1 second between records
      }))

      // Create merged record
      const response = await fetch("/api/records/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordIds: selectedRecordIds,
          timeOffsets,
          competitionId: parseInt(competitionId),
          deviceId: recordsToMerge[0].device.id,
        }),
      })

      if (response.ok) {
        const newRecord = await response.json()
        onRecordsMerged(newRecord.id)
        setSelectedRecordIds([])
        toast.success(
          `Successfully merged ${selectedRecordIds.length} records into Record #${newRecord.id}`
        )
        onClose()
      } else {
        throw new Error("Failed to merge records")
      }
    } catch (error) {
      console.error("Error merging records:", error)
      toast.error("Failed to merge records")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveOrder = async () => {
    setIsLoading(true)
    try {
      const updates = recordsWithOffsets.map((record, index) => ({
        id: record.id,
        sortOrder: index,
        timeOffset: record.customTimeOffset,
      }))

      const response = await fetch("/api/records/batch-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      })

      if (response.ok) {
        updates.forEach((update) => onRecordUpdated(update.id))
        toast.success("Record order and time offsets saved successfully")
      } else {
        throw new Error("Failed to save changes")
      }
    } catch (error) {
      console.error("Error saving record order:", error)
      toast.error("Failed to save record order and time offsets")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewRecord = (recordId: number) => {
    onRecordUpdated(recordId)
    onClose()
  }

  const enabledRecords = recordsWithOffsets.filter((r) => !r.disabled)
  const disabledRecords = recordsWithOffsets.filter((r) => r.disabled)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Record Management - {competitionName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage">Manage Records</TabsTrigger>
            <TabsTrigger value="merge">Merge & Sort</TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="flex-1 overflow-hidden">
            <div className="h-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">
                    Records ({enabledRecords.length} enabled, {disabledRecords.length} disabled)
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={enabledRecords.length === 0}
                  >
                    {selectedRecordIds.length === enabledRecords.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveOrder}
                    disabled={isLoading}
                  >
                    <Save className="mr-1 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>

              <div className="grid h-full grid-cols-1 gap-4 overflow-auto lg:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-700">Enabled Records</h4>
                  <div className="max-h-[400px] space-y-2 overflow-auto">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={enabledRecords.map((r) => r.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {enabledRecords.map((record) => (
                          <SortableRecord
                            key={record.id}
                            record={record}
                            isSelected={selectedRecordIds.includes(record.id)}
                            onSelect={handleSelectRecord}
                            onTimeOffsetChange={handleTimeOffsetChange}
                            onToggleDisabled={handleToggleDisabled}
                            onView={handleViewRecord}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-red-700">Disabled Records</h4>
                  <div className="max-h-[400px] space-y-2 overflow-auto">
                    {disabledRecords.map((record) => (
                      <SortableRecord
                        key={record.id}
                        record={record}
                        isSelected={false}
                        onSelect={() => {}}
                        onTimeOffsetChange={handleTimeOffsetChange}
                        onToggleDisabled={handleToggleDisabled}
                        onView={handleViewRecord}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="merge" className="flex-1 overflow-hidden">
            <div className="h-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Merge Selected Records</h3>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedRecordIds([])}
                    disabled={selectedRecordIds.length === 0}
                  >
                    <RotateCcw className="mr-1 h-4 w-4" />
                    Clear Selection
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleMergeRecords}
                    disabled={selectedRecordIds.length < 2 || isLoading}
                  >
                    <Merge className="mr-1 h-4 w-4" />
                    Merge {selectedRecordIds.length} Records
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Merge Instructions</CardTitle>
                  <CardDescription>
                    1. Select 2 or more records from the list below
                    <br />
                    2. Arrange them in the desired order by dragging
                    <br />
                    3. Set time offsets for smooth transitions
                    <br />
                    4. Click &quot;Merge Records&quot; to create a new combined record
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="max-h-[400px] space-y-2 overflow-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={enabledRecords.map((r) => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {enabledRecords.map((record) => (
                      <SortableRecord
                        key={record.id}
                        record={record}
                        isSelected={selectedRecordIds.includes(record.id)}
                        onSelect={handleSelectRecord}
                        onTimeOffsetChange={handleTimeOffsetChange}
                        onToggleDisabled={handleToggleDisabled}
                        onView={handleViewRecord}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
