"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { LoadingAnimation } from "../ui/loading-animation"
import Link from "next/link"
import { toSlug } from "@/lib/utils/slug"

interface ProjectEditFormProps {
  project: {
    id: string
    name: string
    display_name: string
    description: string | null
    homepage: string | null
  }
  username: string
}

export function ProjectEditForm({ project, username }: ProjectEditFormProps) {
  const [name, setName] = useState(project.name)
  const [displayName, setDisplayName] = useState(project.display_name)
  const [description, setDescription] = useState(project.description || "")
  const [homepage, setHomepage] = useState(project.homepage || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleNameChange = (value: string) => {
    const slug = toSlug(value)
    setName(slug)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate the name (URL slug)
      if (!name || !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name)) {
        toast.error("URL slug must start and end with a letter or number, and can only contain lowercase letters, numbers, and hyphens")
        setIsSubmitting(false)
        return
      }

      const supabase = createClient()
      const { error } = await supabase
        .from("projects")
        .update({
          name,
          display_name: displayName,
          description: description || null,
          homepage: homepage || null,
        })
        .eq("id", project.id)

      if (error) throw error

      toast.success("Project updated successfully")
      router.push(`/${username}/${name}`)
      router.refresh()
    } catch (error) {
      console.error("Failed to update project:", error)
      toast.error("Failed to update project")
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          <p className="text-sm text-muted-foreground">The name that will be displayed throughout the site</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">URL Slug</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="my-project"
            pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
            title="Must start and end with a letter or number, and contain only lowercase letters, numbers, and hyphens"
          />
          <p className="text-sm text-muted-foreground">The URL-friendly version of your project name. Can only contain lowercase letters, numbers, and hyphens.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="homepage">Homepage URL</Label>
          <Input id="homepage" type="url" value={homepage} onChange={(e) => setHomepage(e.target.value)} placeholder="https://" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>

        <div className="flex justify-end space-x-4">
          {isSubmitting ? (
            <LoadingAnimation className="text-sm">Saving Changes</LoadingAnimation>
          ) : (
            <>
              <Link className="text-sm opacity-80 hover:opacity-100 flex items-center px-4 py-1 rounded-md" href={`/${username}/${project.name}`}>
                Cancel
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                Save Changes
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
