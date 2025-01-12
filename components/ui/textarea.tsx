"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(({ className, value, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  // const adjustHeight = React.useCallback(() => {
  //   const textarea = textareaRef.current
  //   if (!textarea) return
  //   textarea.style.height = "auto"
  //   textarea.style.height = `${textarea.scrollHeight}px`
  // }, [])

  // React.useEffect(() => {
  //   const textarea = textareaRef.current
  //   if (!textarea) return

  //   textarea.addEventListener("input", adjustHeight)
  //   adjustHeight() // Initial adjustment

  //   return () => textarea.removeEventListener("input", adjustHeight)
  // }, [adjustHeight])

  // React.useEffect(() => {
  //   adjustHeight()
  // }, [value, adjustHeight]) // Adjust height whenever `value` changes externally

  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={(element) => {
        // Handle both refs
        if (typeof ref === "function") {
          ref(element)
        } else if (ref) {
          ref.current = element
        }
        textareaRef.current = element
      }}
      value={value} // Pass the `value` prop to the textarea
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
