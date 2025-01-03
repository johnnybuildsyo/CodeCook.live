import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronsLeft } from "lucide-react"
import { PauseCircleIcon } from "@heroicons/react/24/solid"

interface EndSessionButtonProps {
  username: string
  projectSlug: string
}

export function EndSessionButton({ username, projectSlug }: EndSessionButtonProps) {
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" className="flex flex-col items-center">
        <Link href={`/${username}/${projectSlug}`} className="flex items-center text-xs h-auto">
          <span className="flex items-center gap-1">
            <PauseCircleIcon className="h-3 w-3" />
            End Session
          </span>
          <span className="text-[10px] font-mono font-light flex items-center gap-0.5">
            <ChevronsLeft className="h-3 w-3 opacity-50" /> back to project
          </span>
        </Link>
      </Button>
    </div>
  )
}
