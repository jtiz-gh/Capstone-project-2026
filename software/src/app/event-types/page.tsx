"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventTypeList } from "@/app/event-types/event-type-list"
import { EventTypeForm } from "@/app/event-types/event-type-form"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { EventType } from "@/types/teams"

export default function Home() {
    // Placeholder data for eventTypes until we connect to backend
    // Defaults are "Gymkhana" | "Drag Race" | "Endurance & Efficiency"
    const [eventTypes, setEventTypes] = useState<EventType[]>([
        { id: "1", name: "Gymkhana" },
        { id: "2", name: "Drag Race" },
        { id: "3", name: "Endurance & Efficiency" }
    ])

    // State for determining editing vs creating
    const [editingEventType, setEditingEventType] = useState<EventType | null>(null)
    const [activeTab, setActiveTab] = useState("view")

    const handleAddEventType = (eventTypeData: Omit<EventType, "id">) => {
        if (editingEventType) {
            // Update existing EventType
            setEventTypes(
                eventTypes.map((EventType) =>
                    EventType.id === editingEventType.id
                        ? {
                            ...EventType,
                            ...eventTypeData,
                        }
                        : EventType
                )
            )
            setEditingEventType(null)
        } else {
            // Add new EventType
            const newTeam: EventType = {
                id: Date.now().toString(),
                ...eventTypeData,
            }
            setEventTypes([...eventTypes, newTeam])
        }

        setActiveTab("view")
    }

    const handleEditEventType = (EventType: EventType) => {
        setEditingEventType(EventType)
        setActiveTab("add")
    }

    const handleCancelEdit = () => {
        setEditingEventType(null)
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
                        <h1 className="text-[30px] font-bold">Event Types</h1>

                    </div>


                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="view" className="hover:cursor-pointer">
                                View Event Types
                            </TabsTrigger>
                            <TabsTrigger value="add" className="hover:cursor-pointer">
                                {editingEventType ? "Edit Event Type" : "Add Event Type"}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="view" className="mt-6">
                            <EventTypeList eventTypes={eventTypes} onEditEventType={handleEditEventType} />
                        </TabsContent>

                        <TabsContent value="add" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{editingEventType ? "View/Edit EventType" : "Add New EventType"}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <EventTypeForm
                                        onSubmit={handleAddEventType}
                                        onCancel={editingEventType ? handleCancelEdit : undefined}
                                        initialEventType={editingEventType || undefined}
                                        submitLabel={editingEventType ? "Update EventType" : "Add EventType"}
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
