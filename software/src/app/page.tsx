import Image from "next/image";
import { Button } from "@/components/ui/button"

export default function Home() {
	return (
		<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
			<main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">

				<h1 className="text-[30px] font-bold text-center w-full">EVolocity</h1>


				<div className="grid grid-cols-2 gap-4 w-full max-w-md">
					<Button variant="outline" className="aspect-square w-full text-lg flex flex-col items-center justify-center gap-2 h-40">
						<span>Teams</span>
						<Image aria-hidden src="/teams_icon.svg" alt="Teams icon" width={40} height={40} />
					</Button>
					<Button variant="outline" className="aspect-square w-full text-lg flex flex-col items-center justify-center gap-2 h-40">
						<span>Competitions</span>
						<Image aria-hidden src="/competitions_icon.svg" alt="Teams icon" width={40} height={40} />
					</Button>
					<Button variant="outline" className="col-span-2 w-full text-lg">Event Types</Button>
				</div>
			</main>
		</div>
	);
}
