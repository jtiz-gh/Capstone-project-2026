import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function Home() {
  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
      <main className="row-start-2 flex flex-col items-center gap-[32px] sm:items-start">
        <h1 className="w-full text-center text-[30px] font-bold">EVolocity</h1>

        <div className="grid w-full max-w-md grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="flex aspect-square h-40 w-full flex-col items-center justify-center gap-2 text-lg"
          >
            <span>Teams</span>
            <Image aria-hidden src="/teams_icon.svg" alt="Teams icon" width={40} height={40} />
          </Button>
          <Button
            variant="outline"
            className="flex aspect-square h-40 w-full flex-col items-center justify-center gap-2 text-lg"
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
          <Button variant="outline" className="col-span-2 w-full text-lg">
            Event Types
          </Button>
        </div>
      </main>
    </div>
  )
}
