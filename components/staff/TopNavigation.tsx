'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  Calendar,
  MessageSquare,
  X
} from 'lucide-react'

interface TopNavigationProps {
  unreadMessages?: number
  onChatToggle?: () => void
  isChatOpen?: boolean
}

export default function TopNavigation({ 
  unreadMessages = 0,
  onChatToggle,
  isChatOpen = false
}: TopNavigationProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/staff/dashboard',
      label: 'Dashboard',
      icon: Home,
      isActive: pathname === '/staff/dashboard'
    },
    {
      href: '/staff/schedule',
      label: 'Schema',
      icon: Calendar,
      isActive: pathname === '/staff/schedule'
    }
  ]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 py-2">
        <div className="flex items-center justify-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <Button
                  variant="ghost"
                  className={`w-full h-12 flex flex-col items-center space-y-1 py-1 relative ${
                    item.isActive
                      ? 'bg-blue-50 text-[#002A5C] border-b-2 border-[#002A5C]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </div>
        
        {/* Minimized Chat Icon */}
        {onChatToggle && (
          <button
            onClick={onChatToggle}
            className="absolute right-4 top-2 h-12 w-12 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-shadow z-50"
          >
          {isChatOpen ? (
            <X className="h-5 w-5 text-gray-600" />
          ) : (
            <div className="relative">
              <MessageSquare className="h-5 w-5 text-gray-600" />
              {unreadMessages > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </Badge>
              )}
            </div>
          )}
        </button>
        )}
      </div>
    </nav>
  )
}