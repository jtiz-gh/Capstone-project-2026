"use client"

import { useParams } from "next/navigation";

export default function TeamPage() {
  const { teamId } = useParams();

  return (
    <div>
      <h1 className="font-bold text-xl">Team: {decodeURIComponent(teamId as string)}</h1>
      <p>Details about {decodeURIComponent(teamId as string)} go here...</p>
    </div>
  );
}