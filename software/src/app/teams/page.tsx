"use client"

import Link from "next/link"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// Placeholder rules for schema
const formSchema = z.object({
  name: z.string().min(1).max(50),
  vehicleClass: z.string().nonempty("Please select a vehicle class"),
  vehicleType: z.string().nonempty("Please select a vehicle type"),
})

export default function Page() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      vehicleClass: "",
      vehicleType: "",
    },
  })
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  // Placeholder teams
  const teams = [
    { name: "Team 1", vehicleClass: "Open", vehicleType: "Kart" },
    { name: "Team 2", vehicleClass: "Open", vehicleType: "Bike" },
  ]

  return (
    <div>
      <p className="font-bold">Add a team</p>

      <div className="flex w-80 flex-col">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Add a name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicleClass"
              render={({ field }) => (
                <FormItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        {field.value == "" ? "Choose a vehicle class" : field.value}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuRadioGroup value={field.value} onValueChange={field.onChange}>
                        <DropdownMenuRadioItem value="Standard">
                          Standard (350W)
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="Open">Open (&lt;2kW)</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        {field.value == "" ? "Choose a vehicle type" : field.value}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuRadioGroup value={field.value} onValueChange={field.onChange}>
                        <DropdownMenuRadioItem value="Bike">
                          Bike (&lt;=2 Wheels)
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="Kart">
                          Kart (&gt;= 3 Wheels)
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="hover:cursor-pointer">
              Add team
            </Button>
          </form>
        </Form>
      </div>
      <hr className="mt-5" />
      <p className="font-bold">Added Teams</p>
      <div>
        {teams.map((team, index) => (
          <Link key={index} href={`/teams/${encodeURIComponent(team.name)}`}>
            <p className="cursor-pointer py-1 text-blue-500 hover:underline">{team.name}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
