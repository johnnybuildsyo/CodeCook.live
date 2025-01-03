import { Block } from "@/lib/types/session"

export const MAX_POST_LENGTH = 300

export interface ThreadPost {
  text: string
  images?: { alt: string; url: string }[]
}

export function extractHandleFromUrl(input: string): string {
  // Check if input is a Bluesky profile URL
  const profileUrlMatch = input.match(/https?:\/\/bsky\.app\/profile\/([^/\s]+)/)
  if (profileUrlMatch) {
    return profileUrlMatch[1]
  }
  return input
}

export function formatCodeBlock(code: string, language?: string): string {
  return `\`\`\`${language || ""}\n${code}\n\`\`\``
}

export function convertMarkdownToBluesky(markdown: string): string {
  return (
    markdown
      // Remove image markdown as it will be handled separately
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "")
      // Convert links with text [text](url) to just the clean url
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
        // Remove http:// or https:// from the URL
        return url.replace(/^https?:\/\//, "")
      })
      // Convert bare URLs (remove protocol)
      .replace(/https?:\/\/([^\s]+)/g, "$1")
      // Convert bold
      .replace(/\*\*([^*]+)\*\*/g, "*$1*")
      // Convert italic
      .replace(/_([^_]+)_/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      // Convert lists to plain text with emoji bullets
      .replace(/^[-*+]\s+/gm, "• ")
      // Convert headers to plain text
      .replace(/^#{1,6}\s+(.+)$/gm, "$1")
      // Convert blockquotes
      .replace(/^>\s+(.+)$/gm, "↱ $1")
      // Remove HTML tags
      .replace(/<[^>]+>/g, "")
      // Normalize whitespace
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  )
}

export function extractImagesFromMarkdown(markdown: string): { alt: string; url: string }[] {
  const images: { alt: string; url: string }[] = []
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  let match

  while ((match = imageRegex.exec(markdown)) !== null) {
    images.push({
      alt: match[1],
      url: match[2],
    })
  }

  return images
}

export function splitTextIntoChunks(text: string, maxLength: number): string[] {
  // If text fits in one chunk, return it
  if (text.length <= maxLength) {
    return [text]
  }

  // Try splitting by paragraphs first
  const paragraphs = text.split(/\n{2,}/)

  // If we have multiple paragraphs, try combining them
  if (paragraphs.length > 1) {
    const chunks: string[] = []
    let currentChunk = ""

    for (const paragraph of paragraphs) {
      const withNewlines = currentChunk ? currentChunk + "\n\n" + paragraph : paragraph

      if (withNewlines.length <= maxLength) {
        currentChunk = withNewlines
      } else {
        // If current chunk is not empty, push it
        if (currentChunk) {
          chunks.push(currentChunk)
        }
        // If this paragraph itself is too long, split it
        if (paragraph.length > maxLength) {
          chunks.push(...splitTextIntoChunks(paragraph, maxLength))
        } else {
          currentChunk = paragraph
        }
      }
    }

    // Don't forget the last chunk
    if (currentChunk) {
      chunks.push(currentChunk)
    }

    return chunks
  }

  // If we're here, we need to split a single paragraph
  // Try to split on sentence boundaries first
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]

  if (sentences.length > 1) {
    const chunks: string[] = []
    let currentChunk = ""

    for (const sentence of sentences) {
      const withSpace = currentChunk ? currentChunk + " " + sentence : sentence

      if (withSpace.length <= maxLength) {
        currentChunk = withSpace
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim())
        }
        if (sentence.length > maxLength) {
          // If a single sentence is too long, bisect it
          chunks.push(...bisectText(sentence.trim(), maxLength))
        } else {
          currentChunk = sentence
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }

  // If we're here, we need to bisect the text
  return bisectText(text, maxLength)
}

export function bisectText(text: string, maxLength: number): string[] {
  const chunks: string[] = []
  let remaining = text

  while (remaining.length > maxLength) {
    // Find the last space before maxLength
    let splitIndex = remaining.lastIndexOf(" ", maxLength)

    // If no space found or it's too close to start, force split at maxLength
    if (splitIndex < maxLength * 0.5) {
      splitIndex = maxLength
    }

    chunks.push(remaining.slice(0, splitIndex).trim())
    remaining = remaining.slice(splitIndex).trim()
  }

  if (remaining) {
    chunks.push(remaining)
  }

  return chunks
}

export function formatBlueskyThread(
  title: string,
  blocks: Block[],
  projectFullName?: string,
  username?: string,
  projectId?: string
): { posts: ThreadPost[]; hasImages: boolean } {
  const posts: ThreadPost[] = []
  let currentPost = ""
  let currentImages: { alt: string; url: string }[] = []
  let hasImages = false

  function pushCurrentPost() {
    if (currentPost.trim() || currentImages.length > 0) {
      posts.push({ text: currentPost.trim(), images: [...currentImages] })
      currentPost = ""
      currentImages = []
    }
  }

  blocks.forEach((block) => {
    if (block.type === "markdown") {
      // Extract any inline images
      const images = extractImagesFromMarkdown(block.content || "")
      if (images.length > 0) {
        hasImages = true
        pushCurrentPost() // Push any accumulated text before the inline images
        currentImages.push(...images)
      }

      // Then convert the text
      const text = convertMarkdownToBluesky(block.content || "")
      const chunks = splitTextIntoChunks(text, MAX_POST_LENGTH)

      // Add each chunk as a separate post
      chunks.forEach((chunk, index) => {
        if (index === 0) {
          // First chunk keeps any accumulated images
          if (currentPost) {
            pushCurrentPost()
          }
          currentPost = chunk + "\n\n"
        } else {
          // Subsequent chunks start fresh
          pushCurrentPost()
          currentPost = chunk + "\n\n"
        }
      })
    } else if (block.type === "commit-links" && block.commits && projectFullName) {
      // Format first commit link as GitHub URL
      const commitText = `github.com/${projectFullName}/commit/${block.commits[0].sha.slice(0, 7)}`

      if ((currentPost + commitText).length > MAX_POST_LENGTH) {
        pushCurrentPost()
        currentPost = commitText + "\n\n"
      } else {
        currentPost += commitText + "\n\n"
      }
    } else if (block.type === "code" || block.type === "diff") {
      const codeText = formatCodeBlock(block.content || "", block.type === "code" ? (block as { language?: string }).language : "diff")
      if ((currentPost + codeText).length > MAX_POST_LENGTH) {
        pushCurrentPost()
        posts.push({ text: codeText })
      } else {
        currentPost += codeText + "\n\n"
      }
    }
  })

  pushCurrentPost()

  // Combine title with first post or create new first post
  if (posts.length > 0) {
    const titleAndFirstPost = `${title}: ${posts[0].text}`
    if (titleAndFirstPost.length <= MAX_POST_LENGTH) {
      posts[0] = { ...posts[0], text: titleAndFirstPost }
    } else {
      posts.unshift({ text: title })
    }
  } else {
    posts.push({ text: title })
  }

  // Add project link to the last post if there's room, otherwise create a new post
  if (username && projectId) {
    const projectLink = `\n\nYou can check out all my code cooking sessions at codecook.live/${username}/${projectId}`
    const lastPost = posts[posts.length - 1]
    
    if (lastPost.text.length + projectLink.length <= MAX_POST_LENGTH) {
      lastPost.text += projectLink
    } else {
      posts.push({ text: projectLink.trim() })
    }
  }

  return { posts, hasImages }
} 