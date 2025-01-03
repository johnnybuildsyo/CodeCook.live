import type { Block } from "@/lib/types/session"

export const DEFAULT_SESSION_BLOCKS: Block[] = [
  {
    id: crypto.randomUUID(),
    type: "markdown",
    content: "",
    role: "intro",
  },
  {
    id: crypto.randomUUID(),
    type: "markdown",
    content: "",
    role: "implementation",
  }
]