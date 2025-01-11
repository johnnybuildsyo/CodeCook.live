import { Block } from "@/lib/types/session"

export function generateSessionMarkdown(title: string, blocks: Block[], sessionUrl: string) {
  let markdownContent = `# ${title}\n\n`

  blocks.forEach((block) => {
    if (block.type === "markdown") {
      markdownContent += `${block.content}\n\n`
    } else if (block.type === "diff") {
      markdownContent += "```diff\n"
      markdownContent += block.content
      markdownContent += "\n```\n\n"
    }
  })

  markdownContent += `\nOriginally published as a CodeCook session at ${sessionUrl}`
  return markdownContent
}

export async function copyToClipboardWithFeedback(content: string, setIsCopied: (value: boolean) => void) {
  await navigator.clipboard.writeText(content)
  setIsCopied(true)
  setTimeout(() => setIsCopied(false), 2000)
} 