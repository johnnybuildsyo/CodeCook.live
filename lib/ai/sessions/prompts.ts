import { Block } from "@/lib/types/session"

export function generateBlockPrompt(params: {
  block: Block
  title: string
  blocks: Block[]
  codeChanges: string
}) {
  const { block, title, blocks, codeChanges } = params
  const hasExistingContent = (block.content ?? "").trim().length > 0

  // Find adjacent markdown blocks
  const blockIndex = blocks.findIndex(s => s.id === block.id)
  const prevBlock = blocks
    .slice(0, blockIndex)
    .reverse()
    .find(s => s.type === "markdown")
  const nextBlock = blocks
    .slice(blockIndex + 1)
    .find(s => s.type === "markdown")

  const adjacentContext = `${prevBlock ? `Previous block: "${prevBlock.content}"\n` : ""}${
    nextBlock ? `Next block: "${nextBlock.content}"\n` : ""
  }`

  return `You are helping write a technical blog post.

${
  hasExistingContent
    ? `Current content: "${block.content}"
Please add 1-2 sentences that enhance this content, focusing on ${block.role === "intro" ? "the problem and motivation" : block.role === "summary" ? "benefits and impact" : "technical implementation details"}.`
    : `Write 2-3 EXTREMELY concise short sentences for a ${block.role === "intro" ? "thread introduction about the problem and motivation" : block.role === "summary" ? "conclusion highlighting benefits and impact" : "technical explanation of the implementation"}.`
}

Context:
Title: ${title || "Untitled Thread"}
${adjacentContext}
Code changes:
${codeChanges.slice(0, 2000)}...`
} 