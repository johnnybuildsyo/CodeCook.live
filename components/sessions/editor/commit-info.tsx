import { FileChange } from "@/lib/types/session"
import { useState } from "react"
import { LoadingAnimation } from "@/components/ui/loading-animation"

interface CommitInfoProps {
  commit: {
    sha: string
    message: string
    author_name: string
    authored_at: string
  }
  files: FileChange[]
  fullName: string
}

export function CommitInfo({ commit, files, fullName }: CommitInfoProps) {
  const [showFiles, setShowFiles] = useState(false)
  const fileArray = Array.isArray(files) ? files : []

  return (
    <div className="p-4 bg-muted/50 rounded-md">
      <div className="font-medium flex justify-between">
        <div className="flex items-center gap-2">
          {commit.sha ? (
            <>
              <a
                href={`https://github.com/${fullName}/commit/${commit.sha}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/70 hover:text-foreground font-mono text-sm underline"
              >
                {commit.sha.slice(0, 7)}
              </a>
              <div>{commit.message}</div>
            </>
          ) : (
            <LoadingAnimation className="text-sm font-mono">Listening for commits</LoadingAnimation>
          )}
        </div>
        {commit.sha && fileArray.length > 0 ? (
          <div className="flex items-center gap-2 text-xs font-mono">
            <div>{fileArray.length} files</div>
            <button className="px-1 py-1 h-auto text-foreground/70 hover:text-foreground" onClick={() => setShowFiles(!showFiles)}>
              {showFiles ? <>[-] hide files</> : <>[+] show files</>}
            </button>
          </div>
        ) : commit.sha ? (
          <LoadingAnimation className="text-sm font-mono">Loading commits...</LoadingAnimation>
        ) : null}
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
  )
}
