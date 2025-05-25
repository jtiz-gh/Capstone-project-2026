"use client"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import Link from "next/link"
import Image from "next/image"
import { Menu } from "lucide-react"
import logo from "@/assets/detailed_logo.png"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
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
    <div className="flex w-full justify-center bg-white p-4 border-b-4 border-gray shadow-md">
      {/* Desktop Navigation */}
      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/" passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()} data-testid="nav-home-link">Home</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/teams" passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()} data-testid="nav-teams-link">
                Teams
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/competitions" passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()} data-testid="nav-competitions-link">
                Competitions
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/event-types" passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()} data-testid="nav-event-types-link">
                Event Types
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Image src={logo} alt="Logo" width={160} height={70} className="absolute left-5" />
      <Button className="absolute right-5" onClick={handleSync} disabled={syncing}>
        <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "Syncing..." : "Sync"}
      </Button>

      {/* Mobile Navigation */}
      <Sheet>
        <SheetTrigger asChild className="md:hidden ml-auto">
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <nav className="flex flex-col gap-4 mt-8">
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
          </nav>
        </SheetContent>
      </Sheet>

      <Image
        src={logo}
        alt="Logo"
        width={160}
        height={70}
        className="absolute left-5"
      />
    </div>
  )
}
