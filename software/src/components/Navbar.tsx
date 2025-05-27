"use client"

import logo from "@/assets/detailed_logo.png"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, RefreshCw } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export default function Navbar() {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // TODO: Replace with actual API call
    } catch (error) {
      console.error("Sync failed:", error)
    } finally {
      setSyncing(false)
    }
  }
  return (
    <div className="border-gray flex w-full justify-center border-b-4 bg-white p-4 shadow-md">
      {/* Desktop Navigation */}
      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="/"
              className={navigationMenuTriggerStyle()}
              data-testid="nav-home-link"
            >
              Home
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="/teams"
              className={navigationMenuTriggerStyle()}
              data-testid="nav-teams-link"
            >
              Teams
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="/competitions"
              className={navigationMenuTriggerStyle()}
              data-testid="nav-competitions-link"
            >
              Competitions
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="/event-types"
              className={navigationMenuTriggerStyle()}
              data-testid="nav-event-types-link"
            >
              Event Types
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Image src={logo} alt="Logo" width={160} height={70} className="absolute left-5" />
      <Button
        className="absolute right-5 hidden md:flex hover:cursor-pointer"
        onClick={handleSync}
        disabled={syncing}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "Syncing..." : "Sync"}
      </Button>

      {/* Mobile Navigation */}
      <Sheet>
        <SheetTrigger asChild className="ml-auto md:hidden">
          <button className="rounded-md p-2 hover:bg-gray-100">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <nav className="mt-8 flex flex-col gap-4">
            <Link href="/" className="text-lg font-medium hover:text-gray-600">
              Home
            </Link>
            <Link href="/teams" className="text-lg font-medium hover:text-gray-600">
              Teams
            </Link>
            <Link href="/competitions" className="text-lg font-medium hover:text-gray-600">
              Competitions
            </Link>
            <Link href="/event-types" className="text-lg font-medium hover:text-gray-600">
              Event Types
            </Link>
            <Button className="mt-6 md:hidden" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync"}
            </Button>
          </nav>
        </SheetContent>
      </Sheet>

      <Image src={logo} alt="Logo" width={160} height={70} className="absolute left-5" />
    </div>
  )
}
