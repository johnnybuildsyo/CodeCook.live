"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Rocket, Zap } from "lucide-react"
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
        <div className="pt-6 border-t-2 border-dotted">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-center">Start New Coding Session</h2>
            <div className="grid grid-cols-2 gap-8 pt-4">
              <Card className="p-8 flex flex-col items-center justify-center gap-4">
                <p className="text-center text-balance text-muted-foreground -mt-2">We’ll start you off with a clean slate and listen for new commits</p>
                <Button className="text-base py-2.5 w-64 h-auto" onClick={handleStartFromScratch} disabled={isCreating}>
                  <Zap className="h-4 w-4 mr-2" />
                  {isCreating ? "Creating..." : "Start from Scratch"}
                </Button>
              </Card>
              <Card className="p-8 flex flex-col items-center justify-center gap-4">
                <p className="text-center text-balance text-muted-foreground -mt-2">Import commits you’ve already cooked up and start from there</p>
                <Button className="text-base py-2.5 w-64 h-auto" onClick={handleStartFromCommit}>
                  <Rocket className="h-4 w-4 mr-2" />
                  {showCommits ? "Loading Commits..." : "Start from a Commit"}
                </Button>
              </Card>
            </div>
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
