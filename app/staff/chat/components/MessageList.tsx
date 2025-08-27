'use client'

import { useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Download, 
  ExternalLink,
  Heart,
  ThumbsUp,
  Smile,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  id: string
  name: string
  avatar?: string
  role: string
  status: 'online' | 'offline' | 'away' | 'busy'
}

interface Message {
  id: string
  content: string
  sender: User
  timestamp: Date
  type: 'text' | 'image' | 'file' | 'emergency'
  isRead: boolean
  reactions?: Array<{
    emoji: string
    users: User[]
  }>
  fileData?: {
    name: string
    size: number
    url: string
    type: string
  }
}

interface MessageListProps {
  messages: Message[]
  currentUser: User
  isEmergencyRoom?: boolean
}

export default function MessageList({ messages, currentUser, isEmergencyRoom }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const messageDate = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Nu'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    
    return messageDate.toLocaleDateString('sv-SE', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFullTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleReaction = (messageId: string, emoji: string) => {
    // TODO: Implement reaction logic
    console.log('Add reaction:', emoji, 'to message:', messageId)
  }

  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-2">
            <img 
              src={message.content} 
              alt="Shared image" 
              className="max-w-xs rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => window.open(message.content, '_blank')}
            />
          </div>
        )
      
      case 'file':
        return (
          <div className="border rounded-lg p-3 bg-gray-50 max-w-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#002A5C] rounded">
                <Download className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{message.fileData?.name}</p>
                <p className="text-xs text-gray-500">
                  {message.fileData?.size ? `${Math.round(message.fileData.size / 1024)} KB` : 'Okänd storlek'}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      
      case 'emergency':
        return (
          <div className="border-2 border-red-500 rounded-lg p-4 bg-red-50">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <Badge variant="destructive" className="text-xs">
                NÖDMEDDELANDE
              </Badge>
            </div>
            <p className="font-medium text-red-900">{message.content}</p>
          </div>
        )
      
      default:
        return <p className="break-words">{message.content}</p>
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    
    messages.forEach(message => {
      const dateKey = new Date(message.timestamp).toDateString()
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })
    
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {Object.entries(messageGroups).map(([dateKey, dayMessages]) => (
        <div key={dateKey}>
          {/* Date separator */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
              {new Date(dateKey).toLocaleDateString('sv-SE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>

          {/* Messages for this date */}
          {dayMessages.map((message, index) => {
            const isOwnMessage = message.sender.id === currentUser.id
            const showAvatar = !isOwnMessage && (
              index === dayMessages.length - 1 || 
              dayMessages[index + 1]?.sender.id !== message.sender.id
            )
            const showSenderName = !isOwnMessage && (
              index === 0 || 
              dayMessages[index - 1]?.sender.id !== message.sender.id
            )

            return (
              <div
                key={message.id}
                className={cn(
                  "flex items-end space-x-2 mb-2",
                  isOwnMessage ? "justify-end" : "justify-start"
                )}
              >
                {/* Avatar for others' messages */}
                {!isOwnMessage && (
                  <div className="w-8">
                    {showAvatar ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.sender.avatar} />
                        <AvatarFallback className="text-xs">
                          {message.sender.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ) : null}
                  </div>
                )}

                <div className={cn(
                  "max-w-[70%] space-y-1",
                  isOwnMessage ? "items-end" : "items-start"
                )}>
                  {/* Sender name */}
                  {showSenderName && !isOwnMessage && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        {message.sender.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {message.sender.role}
                      </Badge>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 relative group",
                      isOwnMessage
                        ? "bg-[#002A5C] text-white"
                        : message.type === 'emergency'
                        ? "bg-white"
                        : "bg-gray-100 text-gray-900",
                      message.type === 'emergency' && "border-2 border-red-500"
                    )}
                    title={formatFullTime(message.timestamp)}
                  >
                    {renderMessageContent(message)}

                    {/* Message time and status */}
                    <div className={cn(
                      "flex items-center justify-end space-x-1 mt-1",
                      isOwnMessage ? "text-blue-200" : "text-gray-500"
                    )}>
                      <span className="text-xs">{formatTime(message.timestamp)}</span>
                      {isOwnMessage && (
                        <div className="text-xs">
                          {message.isRead ? '✓✓' : '✓'}
                        </div>
                      )}
                    </div>

                    {/* Quick reactions (show on hover) */}
                    <div className="absolute -bottom-2 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center space-x-1 bg-white border rounded-full px-2 py-1 shadow-lg">
                        <button
                          onClick={() => handleReaction(message.id, '👍')}
                          className="hover:scale-110 transition-transform"
                          title="Tumme upp"
                        >
                          👍
                        </button>
                        <button
                          onClick={() => handleReaction(message.id, '❤️')}
                          className="hover:scale-110 transition-transform"
                          title="Hjärta"
                        >
                          ❤️
                        </button>
                        <button
                          onClick={() => handleReaction(message.id, '😊')}
                          className="hover:scale-110 transition-transform"
                          title="Le"
                        >
                          😊
                        </button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex items-center space-x-1 mt-1">
                      {message.reactions.map((reaction, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-1 bg-gray-200 rounded-full px-2 py-1 text-xs cursor-pointer hover:bg-gray-300 transition-colors"
                          title={reaction.users.map(u => u.name).join(', ')}
                        >
                          <span>{reaction.emoji}</span>
                          <span className="text-gray-600">{reaction.users.length}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-medium mb-2">Inga meddelanden än</h3>
            <p className="text-sm">
              {isEmergencyRoom 
                ? 'Detta är nödkanalen. Använd endast för akuta situationer.'
                : 'Skicka ett meddelande för att starta konversationen'
              }
            </p>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  )
}