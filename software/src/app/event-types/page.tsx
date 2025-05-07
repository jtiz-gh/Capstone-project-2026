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
import { Event } from "@/types/teams"

export default function Home() {
    // Placeholder data for events until we connect to backend
    // Defaults are "Gymkhana" | "Drag Race" | "Endurance & Efficiency"
    const [events, setEvents] = useState<Event[]>([
        { id: 1, eventName: "Gymkhana", eventType: "Dynamic", completed: false },
        { id: 2, eventName: "Drag Race", eventType: "Dynamic", completed: false },
        { id: 3, eventName: "Endurance & Efficiency", eventType: "Dynamic", completed: false }
    ])

    // State for determining editing vs creating
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [activeTab, setActiveTab] = useState("view")

    const handleAddEvent = (eventData: Omit<Event, "id">) => {
        if (editingEvent) {
            // Update existing Event
            setEvents(
                events.map((Event) =>
                    Event.id === editingEvent.id
                        ? {
                            ...Event,
                            ...eventData,
                        }
                        : Event
                )
            )
            setEditingEvent(null)
        } else {
            // Add new Event
            const newTeam: Event = {
                id: Date.now(),
                ...eventData,
            }
            setEvents([...events, newTeam])
        }

        setActiveTab("view")
    }

    const handleEditEvent = (Event: Event) => {
        setEditingEvent(Event)
        setActiveTab("add")
    }

    const handleCancelEdit = () => {
        setEditingEvent(null)
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
                                {editingEvent ? "Edit Event Type" : "Add Event Type"}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="view" className="mt-6">
                            <EventTypeList events={events} onEditEvent={handleEditEvent} />
                        </TabsContent>

                        <TabsContent value="add" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{editingEvent ? "View/Edit EventType" : "Add New EventType"}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <EventTypeForm
                                        onSubmit={handleAddEvent}
                                        onCancel={editingEvent ? handleCancelEdit : undefined}
                                        initialEvent={editingEvent || undefined}
                                        submitLabel={editingEvent ? "Update EventType" : "Add EventType"}
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
