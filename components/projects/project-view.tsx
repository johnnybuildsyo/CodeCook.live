"use client"

import { User, Star, GitFork, Eye, GitCommit, Calendar, Github, ExternalLink, LinkIcon, Pencil } from "lucide-react"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { SessionList } from "@/components/sessions/session-list"
import { ProjectActions } from "./project-actions"
import Header from "@/components/layout/header"
import type { Session as SupabaseSession } from "@supabase/supabase-js"
import type { Session, SessionBlock } from "@/lib/types/session"

interface ProjectStats {
  stars: number
  forks: number
  watchers: number
  commits: number
}

interface Project {
  owner_id: string
  display_name: string
  name: string
  homepage: string | null
  full_name: string
  description: string | null
  created_at: string
  profiles: {
    name: string | null
  }
}

interface ProjectViewProps {
  project: Project
  stats: ProjectStats | null
  sessions: Session[]
  session: SupabaseSession | null
  username: string
  projectId: string
}

export function ProjectView({ project, stats, sessions, session, username, projectId }: ProjectViewProps) {
  const isOwner = session?.user?.id === project.owner_id

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 relative">
          <h1 className="text-3xl font-bold mb-1">{project.display_name || project.name}</h1>
          {project.homepage && (
            <div>
              <a href={project.homepage} target="_blank" className="inline-flex items-center space-x-2 text-blue-500 font-medium underline mb-8">
                <LinkIcon className="h-3 w-3" />
                <span>{project.homepage}</span>
              </a>
            </div>
          )}
          {isOwner && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${username}/${projectId}/edit`} className="inline-flex items-center space-x-2 absolute top-0 right-0">
                <Pencil className="h-3 w-3" />
                <span>Edit Project</span>
              </Link>
            </Button>
          )}
          <div className="flex items-center space-x-4 mb-6">
            <Link href={`/${username}`} className="group inline-flex items-center space-x-2 font-mono text-xs border px-2 py-1 rounded-md hover:bg-foreground/5 transition-colors">
              <User className="h-3 w-3" />
              <p className="font-medium">{project.profiles.name}</p>
            </Link>
            <Link
              href={`https://github.com/${project.full_name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 font-mono text-xs bg-foreground/5 px-2 py-1 rounded-md hover:bg-foreground/10 transition-colors"
            >
              <Github className="h-3 w-3" />
              <span>{project.full_name}</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <TooltipProvider>
              <div className="flex items-center space-x-4 font-mono text-xs text-muted-foreground">
                {stats && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3" />
                          <span>{stats.stars.toLocaleString()}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{stats.stars.toLocaleString()} stars on GitHub</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-1">
                          <GitFork className="h-3 w-3" />
                          <span>{stats.forks.toLocaleString()}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{stats.forks.toLocaleString()} forks on GitHub</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{stats.watchers.toLocaleString()}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{stats.watchers.toLocaleString()} watching this repository</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-1">
                          <GitCommit className="h-3 w-3" />
                          <span>{stats.commits.toLocaleString()}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{stats.commits.toLocaleString()} commits</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Project created on {new Date(project.created_at).toLocaleDateString()}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
          <p className="text-muted-foreground">{project.description}</p>
          <div className="md:col-span-3 mt-8 border-b-2 border-dotted">
            <SessionList sessions={sessions?.map((t) => ({ ...t, blocks: t.blocks as unknown as SessionBlock[] })) || []} username={username} projectId={projectId} currentUser={session?.user} />
          </div>
          {isOwner && <ProjectActions username={username} projectId={projectId} fullName={project.full_name} totalCommits={stats?.commits || 0} hasGitHubToken={!!session?.provider_token} />}
        </div>
      </main>
    </div>
  )
}
