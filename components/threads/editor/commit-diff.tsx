import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import DiffViewer from "react-diff-viewer-continued"

interface FileChange {
  filename: string
  status: string
  additions: number
  deletions: number
  oldValue: string
  newValue: string
}

export const CommitDiff = ({ files, theme, onRemove }: { files: FileChange[]; theme: string | undefined; onRemove?: (filename: string) => void }) => (
  <div className="space-y-4">
    {files.map((file, i) => (
      <div key={i} className="border rounded-lg p-4 bg-muted/50 relative">
        {onRemove && (
          <Button variant="ghost" className="absolute -top-4 -right-[50px] h-6 w-6 px-1" onClick={() => onRemove(file.filename)}>
            <X className="h-4 w-4" />
          </Button>
        )}
        <div className="flex justify-between items-center mb-2">
          <code className="text-xs">{file.filename}</code>
          <span className="text-xs text-muted-foreground">
            +{file.additions} -{file.deletions}
          </span>
        </div>
        <div className="max-h-[300px] overflow-auto text-[13px]">
          <DiffViewer
            oldValue={file.oldValue}
            newValue={file.newValue}
            splitView={false}
            useDarkTheme={theme === "dark"}
            hideLineNumbers
            styles={{
              contentText: {
                fontSize: "13px",
                lineHeight: "1.4",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              },
            }}
          />
        </div>
      </div>
    ))}
  </div>
)