"use client"

import { ProjectCard } from "./project-card"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import { ProjectImportContainer } from "./project-import-container"
import { useState } from "react"

interface ProjectWithCount {
  id: string
  name: string
  display_name: string
  description: string | null
  created_at: string
  updated_at: string
  github_id: number
  logo_url?: string | null
  sessionCount: number
}

interface ProjectListProps {
  projects: ProjectWithCount[]
  username: string
  isCurrentUser: boolean
}

export function ProjectList({ projects, username, isCurrentUser }: ProjectListProps) {
  const [showImport, setShowImport] = useState(false)

  return (
    <div className="md:col-span-2">
      <div className="mb-6 relative">
        <h2 className="text-2xl font-bold mb-4">Projects</h2>
        {isCurrentUser && (
          <>
            {showImport ? (
              <div className="w-full relative">
                <button aria-label="Close" className="absolute top-0 right-0 p-4" onClick={() => setShowImport(false)}>
                  <X className="w-4 h-4" />
                </button>
                <ProjectImportContainer className="w-full px-0 py-0" username={username} existingProjects={projects.map((p) => p.github_id)} onImportComplete={() => setShowImport(false)} />
              </div>
            ) : (
              <Button className="absolute top-0 right-0" size="sm" variant="outline" onClick={() => setShowImport(true)}>
                <Plus className="mr-1" />
                Import Project
              </Button>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} username={username} sessionCount={project.sessionCount} />
        ))}
      </div>
    </div>
  )
}
