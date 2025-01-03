import { useState } from "react"
import { generateSessionIdeas } from "@/lib/ai/sessions/actions"
import { readStreamableValue } from "ai/rsc"

interface UseSessionIdeasResult {
  sessionIdeas: string[]
  isGenerating: boolean
  generateIdeas: (codeChanges: string) => Promise<void>
  clearIdeas: () => void
}

export function useSessionIdeas(): UseSessionIdeasResult {
  const [sessionIdeas, setSessionIdeas] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const generateIdeas = async (codeChanges: string) => {
    setIsGenerating(true)
    try {
      const { object } = await generateSessionIdeas(codeChanges)
      for await (const partialObject of readStreamableValue(object)) {
        if (partialObject?.sessionIdeas) {
          setSessionIdeas(partialObject.sessionIdeas)
        }
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const clearIdeas = () => setSessionIdeas([])

  return {
    sessionIdeas,
    isGenerating,
    generateIdeas,
    clearIdeas
  }
} 