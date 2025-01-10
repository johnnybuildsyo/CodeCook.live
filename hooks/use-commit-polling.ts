import { useEffect, useRef } from "react"
import { FileChange } from "@/lib/types/session"

interface UseCommitPollingProps {
  commit: {
    sha: string
    message: string
    author_name: string
    authored_at: string
  }
  setCommit: (commit: {
    sha: string
    message: string
    author_name: string
    authored_at: string
  }) => void
  fullName: string
  listenForCommits: boolean
  setFiles: (files: FileChange[]) => void
}

export function useCommitPolling({ commit, setCommit, fullName, listenForCommits, setFiles }: UseCommitPollingProps) {
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingActiveRef = useRef(false)

  useEffect(() => {
    // Clear any existing timeout
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
    isPollingActiveRef.current = false

    if (!commit.sha && listenForCommits) {
      const startTime = new Date().toISOString()
      isPollingActiveRef.current = true

      // Recursive polling function
      const pollForCommits = async () => {
        if (!isPollingActiveRef.current) return

        try {
          const response = await fetch(`/api/github/commits/latest?repo=${encodeURIComponent(fullName)}&since=${startTime}`)
          const data = await response.json()

          if (data?.commit?.sha && data.commit.sha !== commit.sha) {
            setCommit({
              sha: data.commit.sha,
              message: data.commit.message,
              author_name: data.commit.author.name,
              authored_at: data.commit.author.date,
            })
          }

          // Schedule next poll if still active
          if (isPollingActiveRef.current) {
            pollTimeoutRef.current = setTimeout(pollForCommits, 20000)
          }
        } catch (error) {
          console.error("Error polling for commits:", error)
          // Retry on error after a delay
          if (isPollingActiveRef.current) {
            pollTimeoutRef.current = setTimeout(pollForCommits, 20000)
          }
        }
      }

      // Start polling
      pollForCommits()

      return () => {
        isPollingActiveRef.current = false
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current)
          pollTimeoutRef.current = null
        }
      }
    }
  }, [commit.sha, fullName, listenForCommits, setCommit])

  // Separate effect for fetching diff only when commit SHA changes
  useEffect(() => {
    if (!commit.sha) return

    async function fetchDiff() {
      const response = await fetch(`/api/github/commits/${commit.sha}/diff?repo=${encodeURIComponent(fullName)}`)
      const data = await response.json()
      setFiles(data)
    }

    fetchDiff()
  }, [commit.sha, fullName, setFiles])
} 