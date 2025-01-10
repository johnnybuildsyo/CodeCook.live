import { FileChange } from "@/lib/types/session"
import { useState, useEffect } from "react"
import { LoadingAnimation } from "@/components/ui/loading-animation"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { File, X } from "lucide-react"

interface CommitInfoProps {
  commit: {
    sha: string
    message: string
    author_name: string
    authored_at: string
  }
  files: FileChange[]
  fullName: string
  listenForCommits: boolean
  onListenChange: (value: boolean) => void
  onRemoveCommit?: () => void
  onChooseCommit: () => void
}

export function CommitInfo({ commit, files, fullName, listenForCommits, onListenChange, onRemoveCommit, onChooseCommit }: CommitInfoProps) {
  const [showFiles, setShowFiles] = useState(false)
  const fileArray = Array.isArray(files) ? files : []

  // Automatically start listening when there's no commit (only on initial mount)
  useEffect(() => {
    const shouldStartListening = !commit.sha && !listenForCommits
    if (shouldStartListening) {
      onListenChange(true)
    }
  }, []) // Empty dependency array for initial mount only

  // Handle listen mode changes
  const handleListenChange = (value: boolean) => {
    if (value && commit.sha && onRemoveCommit) {
      onRemoveCommit()
    }
    onListenChange(value)
  }

  // Handle choosing new commit
  const handleChooseCommit = () => {
    if (commit.sha && onRemoveCommit) {
      onRemoveCommit()
    }
    onChooseCommit()
  }

  return (
    <>
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleChooseCommit}>
            Choose New Commit
          </Button>
          <div className="flex items-center gap-2">
            <Switch id="listen-mode" checked={listenForCommits} onCheckedChange={handleListenChange} className="data-[state=checked]:bg-green-500" />
            <Label htmlFor="listen-mode" className="text-sm font-medium">
              Listen for commits
            </Label>
          </div>
        </div>
      </div>
      <div className="py-4 pl-4 pr-2 bg-muted/50 rounded-md">
        <div className="font-medium flex justify-between items-center">
          <div className="flex items-center gap-4">
            {commit.sha ? (
              <>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://github.com/${fullName}/commit/${commit.sha}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/70 hover:text-foreground font-mono text-xs hover:underline"
                  >
                    {commit.sha.slice(0, 7)}
                  </a>
                </div>
                <div className="text-sm line-clamp-1 font-extralight">{commit.message}</div>
              </>
            ) : (
              <LoadingAnimation className="text-sm font-mono">{listenForCommits ? "Listening for commits" : "Commit listening paused"}</LoadingAnimation>
            )}
          </div>
          {commit.sha && fileArray.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <div className="flex items-center gap-1">
                <File className="h-3 w-3" />
                {fileArray.length}
              </div>
              <button className="pl-1 py-1 h-auto text-foreground/70 hover:text-foreground" onClick={() => setShowFiles(!showFiles)}>
                {showFiles ? (
                  <>
                    <span className="mr-0.5">[-]</span>hide
                  </>
                ) : (
                  <>
                    <span className="mr-0.5">[-]</span>show
                  </>
                )}
              </button>
            </div>
          )}
          {commit.sha && onRemoveCommit && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500/70 hover:text-red-500" onClick={onRemoveCommit}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {showFiles && (
          <div className="text-sm">
            <div className="space-y-1">
              <div className="text-xs font-mono flex items-start justify-start flex-wrap gap-1">
                {fileArray.map((file) => (
                  <div key={file.filename} className="flex px-2 py-1 bg-foreground/5 rounded-md">
                    <span>{file.filename}</span>
                    <span className="text-muted-foreground ml-2">
                      +{file.additions} -{file.deletions}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
