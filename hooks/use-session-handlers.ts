import { toast } from "sonner"
import { FileChange } from "@/lib/types/session"

interface UseSessionHandlersProps {
  username: string
  projectSlug: string
  session: {
    id: string
  }
  setCommit: (commit: {
    sha: string
    message: string
    author_name: string
    authored_at: string
  }) => void
  setFiles: (files: FileChange[]) => void
  setListenForCommits: (listen: boolean) => void
  setIsCopied: (copied: boolean) => void
  setCommitSelectorOpen: (open: boolean) => void
}

export function useSessionHandlers({
  username,
  projectSlug,
  session,
  setCommit,
  setFiles,
  setListenForCommits,
  setIsCopied,
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
    setListenForCommits(true)
  }

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/${username}/${projectSlug}/session/${session.id}`
    navigator.clipboard.writeText(url)
    toast.success("Share link copied to clipboard")
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleCommitSelect = async (selectedCommit: { sha: string; commit: { message: string; author: { name: string; date: string } } }) => {
    // First remove the current commit
    handleRemoveCommit()

    // Then set the new commit
    setCommit({
      sha: selectedCommit.sha,
      message: selectedCommit.commit.message,
      author_name: selectedCommit.commit.author.name,
      authored_at: selectedCommit.commit.author.date,
    })
    setFiles([])
    setCommitSelectorOpen(false)
  }

  const handleFilesChange = (newFiles: FileChange[]) => {
    setFiles(newFiles)
  }

  return {
    handleRemoveCommit,
    handleCopyShareLink,
    handleCommitSelect,
    handleFilesChange,
  }
} 