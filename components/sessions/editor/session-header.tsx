import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles } from "lucide-react"

interface SessionHeaderProps {
  title: string
  onTitleChange: (title: string) => void
  onGenerateIdeas: () => void
  view: "edit" | "preview"
  onViewChange: (view: "edit" | "preview") => void
}

export function SessionHeader({ title, onTitleChange, onGenerateIdeas, view, onViewChange }: SessionHeaderProps) {
  return (
    <div className="flex gap-4 items-center py-4">
      <Input
        className="!text-2xl font-bold border-t-0 shadow-none border-l-0 border-r-0 rounded-none border-b-foreground/20 pl-1 !focus:outline-none !focus-visible:ring-0 focus:border-b-foreground !ring-0"
        placeholder="Session title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />
      <Button variant="outline" onClick={onGenerateIdeas}>
        <>
          <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
          AI Assist
        </>
      </Button>
      <Tabs className="2xl:hidden" value={view} onValueChange={(v) => onViewChange(v as "edit" | "preview")}>
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
