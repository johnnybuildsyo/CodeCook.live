import { Block } from "@/lib/types/session"
import MarkdownIt from "markdown-it";

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

export function convertMarkdownToHtml(markdownContent: string) {
  const md = new MarkdownIt();
  return md.render(markdownContent);
}

export function generateSessionHTML(title: string, blocks: Block[], sessionUrl: string) {
  const markdownContent = generateSessionMarkdown(title, blocks, sessionUrl);
  return convertMarkdownToHtml(markdownContent);
}

export async function copyToClipboardWithFeedback(content: string, setIsCopied: (value: boolean) => void) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(content)
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = content
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
      } finally {
        textArea.remove()
      }
    }
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  } catch (error) {
    console.error("Failed to copy:", error)
  }
} 