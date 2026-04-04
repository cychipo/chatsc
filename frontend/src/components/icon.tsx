import { LucideIcon, MessageSquareMore } from 'lucide-react'

type AppIconProps = {
  icon?: LucideIcon
  size?: number
  className?: string
}

export function AppIcon({ icon: Icon = MessageSquareMore, size = 18, className }: AppIconProps) {
  return <Icon className={className} size={size} strokeWidth={2} />
}
