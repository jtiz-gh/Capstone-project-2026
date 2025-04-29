"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"
import type { EventType } from "@/types/teams"

interface EventTypeListProps {
    eventTypes: EventType[]
    onEditEventType?: (EventType: EventType) => void
    emptyMessage?: string
    showActions?: boolean
}

export function EventTypeList({
    eventTypes,
    onEditEventType,
    emptyMessage = "No eventTypes added yet. Add your first EventType!",
    showActions = true,
}: Readonly<EventTypeListProps>) {
    if (eventTypes.length === 0) {
        return (
            <div className="flex h-40 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className="grid gap-4">
            {eventTypes.map((EventType) => (
                <Card key={EventType.id}>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <h3 className="text-xl font-semibold">{EventType.name}</h3>
                        </div>
                        {showActions && (
                            <div className="flex items-center gap-2">
                                {onEditEventType && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="hover:cursor-pointer"
                                        onClick={() => onEditEventType(EventType)}
                                    >
                                        View/Edit
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
