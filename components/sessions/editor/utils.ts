import type { SessionBlock } from "@/lib/types/session"

export const DEFAULT_SESSION_BLOCKS: SessionBlock[] = [
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