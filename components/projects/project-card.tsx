import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { convertImageUrl } from "@/lib/utils"
interface ProjectCardProps {
  project: {
    id: string
    name: string
    display_name: string
    description: string | null
    created_at: string
    updated_at: string
    logo_url?: string | null
    screenshot_url?: string | null
  }
  username: string
  sessionCount?: number
}

export function ProjectCard({ project, username, sessionCount = 0 }: ProjectCardProps) {
  return (
    <Link href={`/${username}/${project.name}`} className="block hover:no-underline group">
      <Card className="transition-all hover:shadow-md group-hover:border-primary">
        {(project.screenshot_url || project.logo_url) && (
          <div className="p-6 pb-0">
            <div className="relative w-full aspect-video overflow-hidden border border-foreground/10 rounded-lg">
              <Image src={convertImageUrl(project.screenshot_url || "")} alt={project.display_name} fill={true} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
            </div>
          </div>
        )}
        <CardHeader>
          <CardTitle className="group-hover:text-primary transition-colors text-2xl font-extrabold">{project.display_name}</CardTitle>
          <CardDescription>{project.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{sessionCount} sessions</span>
            <span className="flex items-center space-x-1">
              <CalendarDays className="h-3 w-3" />
              <span>{new Date(project.updated_at).toLocaleDateString()}</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
