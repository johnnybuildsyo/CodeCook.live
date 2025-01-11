"use client"

import { ProjectImport } from "./project-import"
import { useState, useEffect } from "react"
import type { GithubRepo } from "@/types/github"
import { LoadingAnimation } from "../ui/loading-animation"
import { createProject } from "@/app/actions/create-project"
import { GitHubAuthGate } from "@/components/auth/github-auth-gate"
import { fetchGitHubApi } from "@/lib/github/api"

interface ProjectImportContainerProps {
  username: string
  className?: string
  existingProjects?: number[]
  onImportComplete?: () => void
}

interface GitHubApiResponse {
  id: number
  name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  updated_at: string
  homepage: string | null
}

export function ProjectImportContainer({ username, className, existingProjects, onImportComplete }: ProjectImportContainerProps) {
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchRepos() {
      setIsLoading(true)
      setError("")

      try {
        const response = await fetchGitHubApi("https://api.github.com/user/repos?sort=updated&per_page=100")
        if (!response.ok) throw new Error("Failed to fetch repositories")

        const data = await response.json()
        const mappedRepos: GithubRepo[] = data
          .map((repo: GitHubApiResponse) => ({
            id: repo.id,
            name: repo.name,
            description: repo.description || "",
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language,
            updated_at: repo.updated_at,
            homepage: repo.homepage,
          }))
          .filter((repo: GithubRepo) => !existingProjects?.includes(repo.id))

        setRepos(mappedRepos)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch repositories")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRepos()
  }, [])

  const handleProjectSelect = async (repoId: number) => {
    setIsCreating(true)
    setError("")

    try {
      const selectedRepo = repos.find((repo) => repo.id === repoId)
      if (!selectedRepo) throw new Error("Repository not found")

      const result = await createProject(username, selectedRepo)
      if (result?.error) {
        setError(result.error)
      } else {
        onImportComplete?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) return <LoadingAnimation className="w-full text-center pt-24">Loading repositories</LoadingAnimation>
  if (error.includes("access token")) {
    return <GitHubAuthGate>Connect your GitHub account to import your repositories</GitHubAuthGate>
  }
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>

  return <ProjectImport className={className} username={username} repos={repos} onProjectSelect={handleProjectSelect} isCreating={isCreating} isFirstProject={existingProjects?.length === 0} />
}
