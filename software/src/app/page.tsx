import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import logo from "@/assets/detailed_logo.png"

export default function Home() {
  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
      <main className="row-start-2 flex flex-col items-center gap-[32px] sm:items-start">
        <Image
          src={logo}
          alt="Logo"
          width={200}
          height={70}
          className="mx-auto"
          data-testid="evolocity-logo"
        />

        <div className="grid w-full max-w-md grid-cols-2 gap-4">
          <Link href="/teams">
            <Button
              variant="outline"
              data-testid="homepage-teams"
              className="flex aspect-square h-40 w-full flex-col items-center justify-center gap-2 text-lg hover:cursor-pointer"
            >
              <span>Teams</span>
              <Image aria-hidden src="/teams_icon.svg" alt="Teams icon" width={40} height={40} />
            </Button>
          </Link>
          <Link href="/competitions">
            <Button
              data-testid="homepage-competitions"
              variant="outline"
              className="flex aspect-square h-40 w-full flex-col items-center justify-center gap-2 text-lg hover:cursor-pointer"
            >
              <span>Competitions</span>
              <Image
                aria-hidden
                src="/competitions_icon.svg"
                alt="Teams icon"
                width={40}
                height={40}
              />
            </Button>
          </Link>
          <Link href="/event-types" className="col-span-2">
            <Button 
              data-testid="homepage-event-types" variant="outline" className="col-span-2 w-full text-lg">
              Event Types
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
