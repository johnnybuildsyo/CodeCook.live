import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { Block } from "@/lib/types/session"

interface SortableItemProps {
  block: Block
  children: React.ReactNode
}

export function SortableItem({ block, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        tabIndex={0}
        aria-disabled={false}
        aria-roledescription="sortable"
        aria-describedby="DndDescribedBy-0"
        className="absolute -left-8 top-2 opacity-50 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      {children}
    </div>
  )
}
