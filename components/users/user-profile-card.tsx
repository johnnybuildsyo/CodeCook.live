import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { convertImageUrl } from "@/lib/utils"
import { Github, Pencil, Link as LinkIcon } from "lucide-react"
import Link from "next/link"

interface UserProfileCardProps {
  name: string | null
  username: string
  avatar: string | null
  bio: string | null
  github: string | null
  twitter: string | null
  isCurrentUser?: boolean
  links?: { title: string; url: string }[]
}

export function UserProfileCard({ name, username, avatar, bio, github, twitter, isCurrentUser, links = [] }: UserProfileCardProps) {
  return (
    <Card className="md:col-span-1">
      <CardHeader className="relative">
        {isCurrentUser && (
          <Link className="absolute top-2 right-2 text-xs flex items-center gap-1 px-2 py-1 rounded-md hover:ring-1 hover:ring-foreground/10" href={`/${username}/edit`}>
            <span>edit</span>
            <Pencil className="h-3 w-3 scale-75" />
          </Link>
        )}
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatar ? convertImageUrl(avatar) : undefined} alt={name || undefined} />
            <AvatarFallback>
              {name
                ?.split(" ")
                .map((n) => n?.[0])
                .join("") || username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>@{username}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {bio && <p className="text-muted-foreground mb-4 text-sm">{bio}</p>}

        <div className="space-y-2">
          <div className="flex space-x-2">
            {github && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`https://github.com/${github}`}>
                  <Github className="mr-1 h-4 w-4" />
                  GitHub
                </Link>
              </Button>
            )}
            {twitter && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`https://twitter.com/${twitter}`}>
                  <span className="font-extrabold scale-105">𝕏</span>
                  <span className="text-muted-foreground font-light"> / </span>
                  <span>Twitter</span>
                </Link>
              </Button>
            )}
          </div>

          {links.length > 0 && (
            <div className="flex flex-wrap gap-2 py-2">
              {links.map((link) => (
                <a key={link.url} href={link.url} target="_blank" className="flex items-center gap-1 text-sm text-blue-500 hover:underline">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  {link.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
