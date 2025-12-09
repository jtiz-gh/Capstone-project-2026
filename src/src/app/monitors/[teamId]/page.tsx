"use client"

import { useParams } from "next/navigation"

export default function TeamPage() {
  const { teamId } = useParams()

  return (
    <div>
      <h1 className="text-xl font-bold">Team: {decodeURIComponent(teamId as string)}</h1>
      <p>Details about {decodeURIComponent(teamId as string)} go here...</p>
    </div>
  )
}
