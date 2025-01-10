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
  }
  username: string
  sessionCount?: number
}

export function ProjectCard({ project, username, sessionCount = 0 }: ProjectCardProps) {
  return (
    <Link href={`/${username}/${project.name}`} className="block hover:no-underline group">
      <Card className="transition-all hover:shadow-md group-hover:border-primary">
        {project.logo_url && (
          <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
            <Image src={convertImageUrl(project.logo_url)} alt={project.display_name} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
          </div>
        )}
        <CardHeader>
          <CardTitle className="group-hover:text-primary transition-colors">{project.display_name}</CardTitle>
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
