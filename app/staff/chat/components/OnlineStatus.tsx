'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Circle, 
  MessageCircle, 
  Phone, 
  Video,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  id: string
  name: string
  avatar?: string
  role: string
  status: 'online' | 'offline' | 'away' | 'busy'
  lastSeen?: Date
}

interface OnlineStatusProps {
  users: User[]
  currentUserId?: string
  onUserClick?: (user: User) => void
}

export default function OnlineStatus({ users, currentUserId, onUserClick }: OnlineStatusProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Group users by status
  const onlineUsers = users.filter(user => user.status === 'online')
  const awayUsers = users.filter(user => user.status === 'away')
  const busyUsers = users.filter(user => user.status === 'busy')
  const offlineUsers = users.filter(user => user.status === 'offline')

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'away':
        return 'bg-yellow-500'
      case 'busy':
        return 'bg-red-500'
      case 'offline':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusText = (status: User['status']) => {
    switch (status) {
      case 'online':
        return 'Online'
      case 'away':
        return 'Borta'
      case 'busy':
        return 'Upptagen'
      case 'offline':
        return 'Offline'
      default:
        return 'Okänd'
    }
  }

  const formatLastSeen = (lastSeen?: Date) => {
    if (!lastSeen) return ''
    
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Nyss'
    if (diffInMinutes < 60) return `${diffInMinutes}m sedan`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h sedan`
    
    return lastSeen.toLocaleDateString('sv-SE', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const UserItem = ({ user }: { user: User }) => {
    const isCurrentUser = user.id === currentUserId
    
    return (
      <div
        key={user.id}
        className={cn(
          "flex items-center justify-between p-2 rounded cursor-pointer transition-colors",
          isCurrentUser ? "bg-blue-50" : "hover:bg-gray-50"
        )}
        onClick={() => !isCurrentUser && onUserClick?.(user)}
      >
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-xs">
                {user.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
              getStatusColor(user.status)
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <p className={cn(
                "text-sm font-medium truncate",
                isCurrentUser && "text-blue-700"
              )}>
                {user.name}
                {isCurrentUser && ' (Du)'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {user.role}
              </Badge>
              {user.status === 'offline' && user.lastSeen && (
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatLastSeen(user.lastSeen)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons (only for other users) */}
        {!isCurrentUser && user.status !== 'offline' && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MessageCircle className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Phone className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  const StatusGroup = ({ title, users, count }: { title: string; users: User[]; count: number }) => {
    if (users.length === 0) return null

    return (
      <div className="space-y-1">
        <div className="text-xs font-medium text-gray-500 px-2">
          {title} ({count})
        </div>
        {users.map(user => (
          <UserItem key={user.id} user={user} />
        ))}
      </div>
    )
  }

  return (
    <div className="border-t bg-gray-50">
      {/* Header */}
      <div className="p-3 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between"
        >
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-[#002A5C]" />
            <span className="font-medium">Personal ({users.length})</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User list */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto p-2 space-y-3">
          {/* Online users */}
          <StatusGroup 
            title="Online" 
            users={onlineUsers} 
            count={onlineUsers.length}
          />

          {/* Away users */}
          <StatusGroup 
            title="Borta" 
            users={awayUsers} 
            count={awayUsers.length}
          />

          {/* Busy users */}
          <StatusGroup 
            title="Upptagen" 
            users={busyUsers} 
            count={busyUsers.length}
          />

          {/* Offline users */}
          <StatusGroup 
            title="Offline" 
            users={offlineUsers} 
            count={offlineUsers.length}
          />

          {/* Empty state */}
          {users.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Users className="mx-auto h-8 w-8 mb-2 text-gray-300" />
              <p className="text-sm">Ingen personal online</p>
            </div>
          )}
        </div>
      )}

      {/* Quick stats */}
      {isExpanded && (
        <div className="p-3 border-t bg-white">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                <span>{onlineUsers.length} online</span>
              </div>
              <div className="flex items-center space-x-1">
                <Circle className="h-2 w-2 fill-gray-400 text-gray-400" />
                <span>{offlineUsers.length} offline</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Uppdaterad nyss
            </div>
          </div>
        </div>
      )}
    </div>
  )
}