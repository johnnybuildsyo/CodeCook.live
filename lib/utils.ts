import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const shouldExcludeFile = (filename: string): boolean => {
  const excludePatterns = [
    /^public\//, // public folder
    /package-lock\.json$/, // npm
    /yarn\.lock$/, // yarn
    /pnpm-lock\.yaml$/, // pnpm
    /\.lock$/, // generic lock files
    /\.(woff2?|ttf|eot|otf)$/, // font files
    /\.ico$/, // ico files
  ]

  return excludePatterns.some((pattern) => pattern.test(filename))
}

export function convertImageUrl(url: string): string {
  return url.replace("codethreads.s3.us-east-2.amazonaws.com", "d22ircbunvt96b.cloudfront.net")
}

export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'js': return 'javascript'
    case 'jsx': return 'jsx'
    case 'ts': return 'typescript'
    case 'tsx': return 'tsx'
    case 'py': return 'python'
    case 'rb': return 'ruby'
    case 'go': return 'go'
    case 'java': return 'java'
    case 'php': return 'php'
    case 'css': return 'css'
    case 'html': return 'html'
    case 'json': return 'json'
    case 'yml':
    case 'yaml': return 'yaml'
    case 'md': return 'markdown'
    case 'sql': return 'sql'
    case 'sh': return 'bash'
    default: return 'text'
  }
}
