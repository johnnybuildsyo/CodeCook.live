"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AvatarUpload } from "@/components/auth/avatar-upload"
import Link from "next/link"
import { LoadingAnimation } from "../ui/loading-animation"
import { Plus, X, GripVertical } from "lucide-react"

export interface Link {
  title: string
  url: string
}

interface EditProfileFormProps {
  profile: {
    username: string
    name: string | null
    bio: string | null
    avatar_url: string | null
    github_username: string | null
    twitter_username: string | null
    links: Link[] | null
  }
}

export function EditProfileForm({ profile }: EditProfileFormProps) {
  const [name, setName] = useState(profile.name || "")
  const [bio, setBio] = useState(profile.bio || "")
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "")
  const [twitter, setTwitter] = useState(profile.twitter_username || "")
  const [links, setLinks] = useState<Link[]>(profile.links || [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const addLink = () => {
    setLinks([...links, { title: "", url: "" }])
  }

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const updateLink = (index: number, field: keyof Link, value: string) => {
    setLinks(
      links.map((link, i) => {
        if (i === index) {
          const updatedLink = { ...link, [field]: value }
          if (field === "url") {
            const cleanUrl = value.replace(/^(https?:\/\/)/, "").replace(/\/$/, "")
            updatedLink.title = cleanUrl || link.title
          }
          return updatedLink
        }
        return link
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          bio,
          avatar_url: avatarUrl,
          twitter_username: twitter || null,
          links: links.filter((link) => link.title && link.url), // Only save non-empty links
        })
        .eq("username", profile.username)

      if (error) throw error

      toast.success("Profile updated successfully")
      router.push(`/${profile.username}`)
      router.refresh()
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast.error("Failed to update profile")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-center">
        <AvatarUpload currentUrl={avatarUrl} onUpload={(url) => setAvatarUrl(url)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="twitter">
          <span className="font-extrabold scale-105">𝕏</span>
          <span className="text-muted-foreground font-light"> / </span>
          <span>Twitter Username</span>
        </Label>
        <div className="flex items-center">
          <span className="mr-2">@</span>
          <Input id="twitter" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="username" />
        </div>
      </div>

      <div className="space-y-4 pt-2 pb-4">
        <div className="flex items-center justify-between">
          <Label>Links</Label>
        </div>

        <div className="space-y-3">
          {links.map((link, index) => (
            <div key={index} className="flex items-center gap-2 group">
              <GripVertical className="h-4 w-4 text-muted-foreground/30" />
              <Input placeholder="URL" value={link.url} onChange={(e) => updateLink(index, "url", e.target.value)} className="flex-1" />
              <Input placeholder="Title" value={link.title} onChange={(e) => updateLink(index, "title", e.target.value)} className="flex-1" />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(index)} className="opacity-0 group-hover:opacity-100">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addLink}>
            <Plus className="h-4 w-4 mr-1" />
            Add Link
          </Button>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        {isSubmitting ? (
          <LoadingAnimation className="text-sm">Saving Changes</LoadingAnimation>
        ) : (
          <>
            <Link className="text-sm opacity-80 hover:opacity-100 flex items-center px-4 py-1 rounded-md" href={`/${profile.username}`}>
              Cancel
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              Save Changes
            </Button>
          </>
        )}
      </div>
    </form>
  )
}
