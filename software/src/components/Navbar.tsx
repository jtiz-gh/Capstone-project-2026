import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import Link from "next/link"
import Image from "next/image"
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
    <div className="border-gray flex w-full justify-center border-b-4 bg-white p-4 shadow-md">
      <NavigationMenu>
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
    </div>
  )
}
