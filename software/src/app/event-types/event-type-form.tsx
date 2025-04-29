"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { LineChartIcon as ChartLine } from "lucide-react"
import type { EventType } from "@/types/teams"

interface EventTypeFormProps {
    onSubmit: (team: Omit<EventType, "id">) => void
    onCancel?: () => void
    initialEventType?: EventType
    submitLabel?: string
}

export function EventTypeForm({
    onSubmit,
    onCancel,
    initialEventType,
    submitLabel = "Add Team",
}: EventTypeFormProps) {
    const [eventTypeName, setEventTypeName] = useState("")

    useEffect(() => {
        if (initialEventType) {
            setEventTypeName(initialEventType.name)
        }
    }, [initialEventType])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!eventTypeName.trim()) return

        onSubmit({
            name: eventTypeName
        })

        // Reset form if not editing
        if (!initialEventType) {
            setEventTypeName("")
        }
    }

    const handleViewEnergyMonitor = () => {
        // TODO: Actually need to go to ECU
        alert("No energy monitors yet :)))))")
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                    id="team-name"
                    value={eventTypeName}
                    onChange={(e) => setEventTypeName(e.target.value)}
                    placeholder="Enter team name"
                    required
                />
            </div>

            <div className="flex gap-2">
                <Button type="submit" className="flex-1 hover:cursor-pointer">
                    {submitLabel}
                </Button>
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        className="hover:cursor-pointer"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    )
}
