'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Send, 
  Users, 
  MessageSquare, 
  Circle,
  Smile,
  Paperclip,
  MoreVertical
} from 'lucide-react'
import { useBroadcast } from '@/hooks/use-realtime'
import { getAuthHeaders } from '@/lib/token-helper'
import { toast } from 'sonner'

interface LiveChatProps {
  channelName: string
  channelDisplayName: string
  userId: string
  userName: string
  className?: string
}

interface ChatMessage {
  id: string
  message: string
  sender: {
    id: string
    name: string
    role: string
  }
  timestamp: string
  messageId: string
}

interface OnlineUser {
  id: string
  name: string
  role: string
  lastSeen: string
}

export function LiveChat({ 
  channelName, 
  channelDisplayName, 
  userId, 
  userName, 
  className 
}: LiveChatProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isSending, setIsSending] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Use the broadcast hook
  const { messages, sendMessage: broadcastMessage, clearMessages } = useBroadcast(
    channelName, 
    'chat_message'
  )

  // Subscribe to typing indicators
  const { messages: typingMessages } = useBroadcast(channelName, 'typing')

  // Subscribe to presence updates
  const { messages: presenceMessages } = useBroadcast(channelName, 'presence')

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle typing indicators
  useEffect(() => {
    const latestTyping = typingMessages[typingMessages.length - 1]
    if (latestTyping && latestTyping.userId !== userId) {
      if (latestTyping.isTyping) {
        setTypingUsers(prev => 
          prev.includes(latestTyping.userName) ? prev : [...prev, latestTyping.userName]
        )
      } else {
        setTypingUsers(prev => prev.filter(name => name !== latestTyping.userName))
      }
    }
  }, [typingMessages, userId])

  // Handle presence updates
  useEffect(() => {
    const latestPresence = presenceMessages[presenceMessages.length - 1]
    if (latestPresence) {
      if (latestPresence.type === 'join') {
        setOnlineUsers(prev => {
          if (prev.some(user => user.id === latestPresence.userId)) return prev
          return [...prev, {
            id: latestPresence.userId,
            name: latestPresence.userName,
            role: latestPresence.userRole || 'user',
            lastSeen: new Date().toISOString()
          }]
        })
      } else if (latestPresence.type === 'leave') {
        setOnlineUsers(prev => prev.filter(user => user.id !== latestPresence.userId))
      }
    }
  }, [presenceMessages])

  // Announce presence when component mounts
  useEffect(() => {
    const announcePresence = async () => {
      try {
        await broadcastMessage({
          type: 'join',
          userId,
          userName,
          userRole: 'staff' // This would come from user context
        })
      } catch (error) {
        console.error('Failed to announce presence:', error)
      }
    }

    announcePresence()

    // Announce leaving on unmount
    return () => {
      broadcastMessage({
        type: 'leave',
        userId,
        userName
      }).catch(console.error)
    }
  }, [userId, userName])

  const sendMessage = async () => {
    if (!message.trim() || isSending) return

    setIsSending(true)
    try {
      await broadcastMessage({
        message: message.trim(),
        sender: {
          id: userId,
          name: userName,
          role: 'staff'
        }
      })

      setMessage('')
      
      // Clear typing indicator
      if (isTyping) {
        setIsTyping(false)
        await broadcastMessage({
          userId,
          userName,
          isTyping: false
        })
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Kunde inte skicka meddelandet')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleTyping = async () => {
    if (!isTyping) {
      setIsTyping(true)
      try {
        await broadcastMessage({
          userId,
          userName,
          isTyping: true
        })
      } catch (error) {
        console.error('Failed to send typing indicator:', error)
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to clear typing indicator
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false)
      try {
        await broadcastMessage({
          userId,
          userName,
          isTyping: false
        })
      } catch (error) {
        console.error('Failed to clear typing indicator:', error)
      }
    }, 2000)
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const isOwnMessage = (senderId: string) => senderId === userId

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {channelDisplayName}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {onlineUsers.length}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Real-time kommunikation
          {onlineUsers.length > 0 && (
            <span className="ml-2">
              • {onlineUsers.map(user => user.name).join(', ')} online
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages Area */}
        <ScrollArea className="h-80 px-4 py-2">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Inga meddelanden än</p>
                <p className="text-xs">Skriv något för att starta konversationen</p>
              </div>
            ) : (
              messages.map((msg: ChatMessage, index) => (
                <div
                  key={msg.id || index}
                  className={`flex ${
                    isOwnMessage(msg.sender?.id) ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      isOwnMessage(msg.sender?.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {!isOwnMessage(msg.sender?.id) && (
                      <p className="text-xs font-medium mb-1">
                        {msg.sender?.name || 'Okänd användare'}
                      </p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${
                      isOwnMessage(msg.sender?.id) 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {formatMessageTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-muted px-3 py-2 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    {typingUsers.join(', ')} skriver
                    <span className="animate-pulse">...</span>
                  </p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex items-center gap-2">
            <Input
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                if (e.target.value) {
                  handleTyping()
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder="Skriv ett meddelande..."
              className="flex-1"
              disabled={isSending}
            />
            <Button
              size="sm"
              onClick={sendMessage}
              disabled={!message.trim() || isSending}
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
              <span>Ansluten</span>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                className="h-6 text-xs"
              >
                Rensa historik
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}