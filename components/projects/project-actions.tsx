"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CookingPot, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { signInWithGitHub } from "@/components/auth/actions"
import { CommitManager } from "./commit-manager"
import { createSession } from "@/app/actions/create-session"

interface ProjectActionsProps {
  username: string
  projectId: string
  fullName: string
  totalCommits: number
  hasGitHubToken: boolean
}

export function ProjectActions({ username, projectId, fullName, totalCommits, hasGitHubToken }: ProjectActionsProps) {
  const [showCommits, setShowCommits] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const handleStartFromScratch = async () => {
    setIsCreating(true)
    try {
      const { session, error } = await createSession(projectId, "", "")

      if (error || !session) {
        throw new Error(error || "Failed to create session")
      }

      router.push(`/${username}/${projectId}/session/${session.id}/live`)
    } catch (error) {
      console.error("Failed to create session:", error)
      setIsCreating(false)
    }
  }

  const handleStartFromCommit = async () => {
    if (!hasGitHubToken) {
      const url = await signInWithGitHub(window.location.pathname)
      if (url) {
        window.location.href = url
        return
      }
    }
    setShowCommits(true)
  }

  return (
    <>
      {!showCommits && (
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold mb-4 text-center">Cook Up a New Coding Session</h2>
          <div className="grid grid-cols-2 gap-6 p-6">
            <Card className="p-8 flex flex-col items-center justify-center gap-8">
              <p className="text-center text-balance text-muted-foreground">We’ll start you off with a clean slate and listen for new commits</p>
              <Button className="text-base py-3 w-64 h-auto" onClick={handleStartFromScratch} disabled={isCreating}>
                <CookingPot className="h-4 w-4 mr-2" />
                {isCreating ? "Creating..." : "Start from Scratch"}
              </Button>
            </Card>
            <Card className="p-8 flex flex-col items-center justify-center gap-8">
              <p className="text-center text-balance text-muted-foreground">Import commits you’ve already cooked up and start from there</p>
              <Button className="text-base py-3 w-64 h-auto" onClick={handleStartFromCommit}>
                <Sparkles className="h-4 w-4 mr-2" />
                {showCommits ? "Loading Commits..." : "Start from a Commit"}
              </Button>
            </Card>
          </div>
        </div>
      )}
      {hasGitHubToken && showCommits && (
        <div className="mt-8">
          <CommitManager projectId={projectId} fullName={fullName} totalCommits={totalCommits} />
        </div>
      )}
    </>
  )
}
