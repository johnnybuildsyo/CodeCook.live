import { FileChange } from "@/lib/types/session"

type Commit = {
  sha: string
  message: string
  author_name: string
  authored_at: string
}

type GitHubCommit = {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    }
  }
}

interface UseSessionHandlersProps {
  setCommit: (commit: Commit) => void
  setFiles: (files: FileChange[]) => void
  setListenForCommits: (listen: boolean) => void
  setCommitSelectorOpen: (open: boolean) => void
}

export function useSessionHandlers({
  setCommit,
  setFiles,
  setListenForCommits,
  setCommitSelectorOpen,
}: UseSessionHandlersProps) {
  const handleRemoveCommit = () => {
    setCommit({
      sha: "",
      message: "",
      author_name: "",
      authored_at: "",
    })
    setFiles([])
    setListenForCommits(false)
  }

  const handleCommitSelect = (commit: GitHubCommit) => {
    setCommit({
      sha: commit.sha,
      message: commit.commit.message,
      author_name: commit.commit.author.name,
      authored_at: commit.commit.author.date,
    })
    setFiles([])
    setListenForCommits(true)
    setCommitSelectorOpen(false)
  }

  return {
    handleRemoveCommit,
    handleCommitSelect,
  }
} 