import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, FileDiff, Plus, ChevronDown, ChevronUp, SparklesIcon, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { CommitDiff } from "./commit-diff"
import { ImageUpload } from "./image-upload"
import { CommitLink } from "../commit-link"
import { Block } from "@/lib/types/session"
import { convertMarkdownToSocialPost, extractImagesFromMarkdown } from "@/lib/bluesky/format"
import { useState } from "react"
import { toast } from "sonner"

interface BlockRendererProps {
  block: Block
  theme?: string
  onRemoveBlock: (id: string) => void
  onGenerateMarkdown: (block: Block) => void
  onAddNewBlock: (id: string) => void
  onUpdateContent: (id: string, content: string) => void
  onUpdateCollapsed: (id: string, isCollapsed: boolean) => void
  onUpdateFile: (id: string, value: string) => void
  onUploadImage: (file: File, blockId: string) => void
  onOpenDiffDialog: (blockId: string) => void
  onOpenLinkSelector: (blockId: string) => void
  fullName: string
}

export function BlockRenderer({
  block,
  theme,
  onRemoveBlock,
  onGenerateMarkdown,
  onAddNewBlock,
  onUpdateContent,
  onUpdateCollapsed,
  onUpdateFile,
  onUploadImage,
  onOpenDiffDialog,
  onOpenLinkSelector,
  fullName,
}: BlockRendererProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyContent = async () => {
    const formattedContent = convertMarkdownToSocialPost(block.content || "")
    const images = extractImagesFromMarkdown(block.content || "")

    await navigator.clipboard.writeText(formattedContent)
    setCopied(true)
    toast.success("Content copied to clipboard!", {
      description: images.length > 0 ? "Text copied! Note: You'll need to upload the images separately to your social media post." : "Ready to share on Bluesky, X, or other social platforms!",
      duration: 3000,
      position: "top-center",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {block.type === "markdown" && (
        <div className="relative mt-2">
          <div className="flex flex-col gap-2 absolute -right-8 px-1">
            <Button aria-label="Remove Block" variant="ghost" className="h-6 w-6 p-0" onClick={() => onRemoveBlock(block.id)}>
              <X className="h-4 w-4" />
            </Button>
            <Button aria-label="Generate Markdown" variant="outline" className="h-6 w-6 p-0 border-yellow-500/30 hover:animate-pulse" onClick={() => onGenerateMarkdown(block)}>
              <SparklesIcon className="h-4 w-4 text-yellow-500" />
            </Button>
            <Button aria-label="Copy for Social" variant="outline" className="h-6 w-6 p-0" onClick={handleCopyContent}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4 scale-90 text-blue-600" />}
            </Button>
          </div>
          <Textarea
            className="mb-2"
            value={block.content}
            onChange={(e) => onUpdateContent(block.id, e.target.value)}
            placeholder={
              block.role === "intro"
                ? "Start with introducting the problem we're solving or what feature we're adding. Why are we cooking this up?"
                : block.role === "summary"
                  ? "Wrap up with the key benefits and where are we going next?"
                  : "Let's get into it. What are we cooking up? How are we doing it?"
            }
            rows={block.role === "implementation" ? 4 : 3}
          />
          <div className="flex gap-2">
            <ImageUpload onUpload={(file) => onUploadImage(file, block.id)} />
            <Button variant="outline" size="sm" onClick={() => onOpenDiffDialog(block.id)}>
              <FileDiff className="h-4 w-4 mr-1" />
              Add Code
            </Button>
            <Button variant="outline" size="sm" onClick={() => onAddNewBlock(block.id)}>
              <Plus className="h-4 w-4 mr-1" />
              New Block
            </Button>
          </div>
        </div>
      )}
      {block.type === "diff" && block.file && (
        <div className="relative">
          <div className="flex flex-col gap-2 absolute -right-8 px-1">
            <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => onRemoveBlock(block.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CommitDiff files={[block.file]} defaultRenderDiff={false} theme={theme} />
        </div>
      )}
      {block.type === "code" && block.file && (
        <div className="relative">
          <div className="flex flex-col gap-2 absolute -right-8 px-1">
            <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => onRemoveBlock(block.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="font-mono text-sm bg-muted rounded-lg">
            <div className={cn("flex justify-between items-center text-xs text-muted-foreground px-4", block.isCollapsed ? "py-1" : "py-2")}>
              <span>{block.file.filename}</span>
              <Button variant="ghost" size="sm" onClick={() => onUpdateCollapsed(block.id, !block.isCollapsed)}>
                {block.isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </div>
            {!block.isCollapsed && (
              <div className="p-4 pt-0">
                <Textarea
                  value={block.file.newValue}
                  onChange={(e) => onUpdateFile(block.id, e.target.value)}
                  className="font-mono text-sm min-h-[200px] bg-transparent border-none focus-visible:ring-0 p-0 resize-none"
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {block.type === "commit-links" && block.commits && (
        <div className="relative">
          <div className="flex flex-col gap-2 absolute -right-8 px-1">
            <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => onRemoveBlock(block.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="not-prose flex flex-col gap-1">
            {block.commits.map((link) => (
              <div key={link.filename}>
                <CommitLink filename={link.filename} sha={link.sha} fullName={fullName} />
              </div>
            ))}
            <div>
              <button className="text-xs pl-4" onClick={() => onOpenLinkSelector(block.id)}>
                + add links
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
