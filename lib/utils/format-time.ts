export function formatMessageTime(date: string | Date): string {
  const messageDate = new Date(date)
  const now = new Date()
  const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)

  // Today
  if (diffInHours < 24 && messageDate.getDate() === now.getDate()) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Yesterday
  if (diffInHours < 48 && messageDate.getDate() === now.getDate() - 1) {
    return 'Yesterday ' + messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Within a week
  if (diffInHours < 168) {
    return messageDate.toLocaleDateString([], { weekday: 'short' }) + ' ' + 
           messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Older
  return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
         messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
} 