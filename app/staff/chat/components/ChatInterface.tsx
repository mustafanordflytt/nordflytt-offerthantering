'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  Users, 
  Settings,
  Phone,
  Video,
  MoreHorizontal,
  Search,
  Plus,
  Bell,
  BellOff
} from 'lucide-react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import OnlineStatus from './OnlineStatus'
import { useRealtime } from '@/lib/realtime'
import { cn } from '@/lib/utils'

interface User {
  id: string
  name: string
  avatar?: string
  role: string
  status: 'online' | 'offline' | 'away' | 'busy'
  lastSeen?: Date
}

interface ChatRoom {
  id: string
  name: string
  type: 'direct' | 'group' | 'emergency'
  participants: User[]
  lastMessage?: {
    content: string
    sender: User
    timestamp: Date
  }
  unreadCount: number
  isEmergency?: boolean
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
}

export default function ChatInterface() {
  // State management
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [notifications, setNotifications] = useState(true)

  // Realtime connection
  const { isConnected, subscribe, unsubscribe, sendMessage } = useRealtime()

  // Current user (mock data - should come from auth)
  const currentUser: User = {
    id: 'user-1',
    name: 'Admin',
    role: 'Administrator',
    status: 'online'
  }

  // Initialize chat data
  useEffect(() => {
    initializeChatData()
    setupRealtimeSubscriptions()

    return () => {
      cleanupSubscriptions()
    }
  }, [])

  const initializeChatData = async () => {
    try {
      // Mock data - replace with API calls
      const mockRooms: ChatRoom[] = [
        {
          id: 'room-1',
          name: 'Allmänt',
          type: 'group',
          participants: [
            { id: 'user-1', name: 'Admin', role: 'Administrator', status: 'online' },
            { id: 'user-2', name: 'Anna Svensson', role: 'Flyttare', status: 'online' },
            { id: 'user-3', name: 'Erik Johansson', role: 'Förare', status: 'away' }
          ],
          lastMessage: {
            content: 'Hej allihopa! Hur går det med dagens flytt?',
            sender: { id: 'user-2', name: 'Anna Svensson', role: 'Flyttare', status: 'online' },
            timestamp: new Date(Date.now() - 1000 * 60 * 5)
          },
          unreadCount: 2
        },
        {
          id: 'room-2',
          name: 'Nödkanal',
          type: 'emergency',
          participants: [
            { id: 'user-1', name: 'Admin', role: 'Administrator', status: 'online' },
            { id: 'user-2', name: 'Anna Svensson', role: 'Flyttare', status: 'online' },
            { id: 'user-3', name: 'Erik Johansson', role: 'Förare', status: 'away' },
            { id: 'user-4', name: 'Maria Andersson', role: 'Koordinator', status: 'online' }
          ],
          unreadCount: 0,
          isEmergency: true
        },
        {
          id: 'room-3',
          name: 'Anna Svensson',
          type: 'direct',
          participants: [
            { id: 'user-1', name: 'Admin', role: 'Administrator', status: 'online' },
            { id: 'user-2', name: 'Anna Svensson', role: 'Flyttare', status: 'online' }
          ],
          lastMessage: {
            content: 'Kan du kolla schemaändringen?',
            sender: { id: 'user-2', name: 'Anna Svensson', role: 'Flyttare', status: 'online' },
            timestamp: new Date(Date.now() - 1000 * 60 * 15)
          },
          unreadCount: 1
        }
      ]

      const mockOnlineUsers: User[] = [
        { id: 'user-1', name: 'Admin', role: 'Administrator', status: 'online' },
        { id: 'user-2', name: 'Anna Svensson', role: 'Flyttare', status: 'online' },
        { id: 'user-3', name: 'Erik Johansson', role: 'Förare', status: 'away' },
        { id: 'user-4', name: 'Maria Andersson', role: 'Koordinator', status: 'online' },
        { id: 'user-5', name: 'Johan Lindberg', role: 'Flyttare', status: 'offline', lastSeen: new Date(Date.now() - 1000 * 60 * 30) }
      ]

      setChatRooms(mockRooms)
      setOnlineUsers(mockOnlineUsers)
      setSelectedRoom(mockRooms[0])
      setIsLoading(false)
    } catch (error) {
      console.error('Error initializing chat data:', error)
      setIsLoading(false)
    }
  }

  const setupRealtimeSubscriptions = () => {
    // Subscribe to message updates
    subscribe('messages', (payload) => {
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as Message
        setMessages(prev => [...prev, newMessage])
        
        // Update room's last message
        setChatRooms(prev => prev.map(room => 
          room.id === newMessage.sender.id 
            ? { ...room, lastMessage: { content: newMessage.content, sender: newMessage.sender, timestamp: newMessage.timestamp } }
            : room
        ))
      }
    })

    // Subscribe to user status updates
    subscribe('user_status', (payload) => {
      if (payload.eventType === 'UPDATE') {
        const updatedUser = payload.new as User
        setOnlineUsers(prev => prev.map(user => 
          user.id === updatedUser.id ? { ...user, status: updatedUser.status } : user
        ))
      }
    })
  }

  const cleanupSubscriptions = () => {
    unsubscribe('messages')
    unsubscribe('user_status')
  }

  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!selectedRoom || !content.trim()) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: content.trim(),
      sender: currentUser,
      timestamp: new Date(),
      type,
      isRead: false
    }

    try {
      // Send via realtime
      await sendMessage('messages', {
        room_id: selectedRoom.id,
        content: content.trim(),
        sender_id: currentUser.id,
        type
      })

      // Optimistic update
      setMessages(prev => [...prev, newMessage])
      
      // Update room's last message
      setChatRooms(prev => prev.map(room => 
        room.id === selectedRoom.id 
          ? { ...room, lastMessage: { content: newMessage.content, sender: newMessage.sender, timestamp: newMessage.timestamp } }
          : room
      ))
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleRoomSelect = async (room: ChatRoom) => {
    setSelectedRoom(room)
    
    // Mark room as read
    setChatRooms(prev => prev.map(r => 
      r.id === room.id ? { ...r, unreadCount: 0 } : r
    ))

    // Load messages for this room
    try {
      // Mock messages - replace with API call
      const mockMessages: Message[] = room.id === 'room-1' ? [
        {
          id: 'msg-1',
          content: 'God morgon alla! Hur är läget?',
          sender: { id: 'user-2', name: 'Anna Svensson', role: 'Flyttare', status: 'online' },
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          type: 'text',
          isRead: true
        },
        {
          id: 'msg-2',
          content: 'Hej Anna! Allt bra här. Hur går flytten på Södermalm?',
          sender: currentUser,
          timestamp: new Date(Date.now() - 1000 * 60 * 25),
          type: 'text',
          isRead: true
        },
        {
          id: 'msg-3',
          content: 'Det går bra! Vi är nästan klara med packingen. Erik kommer om 30 min med bilen.',
          sender: { id: 'user-2', name: 'Anna Svensson', role: 'Flyttare', status: 'online' },
          timestamp: new Date(Date.now() - 1000 * 60 * 20),
          type: 'text',
          isRead: true
        },
        {
          id: 'msg-4',
          content: 'Perfekt! Låt mig veta om ni behöver något.',
          sender: currentUser,
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          type: 'text',
          isRead: true
        },
        {
          id: 'msg-5',
          content: 'Hej allihopa! Hur går det med dagens flytt?',
          sender: { id: 'user-2', name: 'Anna Svensson', role: 'Flyttare', status: 'online' },
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          type: 'text',
          isRead: false
        }
      ] : []

      setMessages(mockMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalUnreadCount = chatRooms.reduce((sum, room) => sum + room.unreadCount, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C] mx-auto"></div>
          <p className="mt-2 text-gray-600">Laddar chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center">
              <MessageCircle className="mr-2 h-5 w-5 text-[#002A5C]" />
              Personal Chat
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotifications(!notifications)}
                className={cn(notifications ? "text-[#002A5C]" : "text-gray-400")}
              >
                {notifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Sök konversationer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C] focus:border-transparent"
            />
          </div>
        </div>

        {/* Connection Status */}
        <div className={cn(
          "px-4 py-2 text-xs",
          isConnected ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        )}>
          <div className="flex items-center">
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
            {isConnected ? 'Ansluten' : 'Anslutning lost'}
          </div>
        </div>

        {/* Chat Rooms List */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => handleRoomSelect(room)}
              className={cn(
                "p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors",
                selectedRoom?.id === room.id ? "bg-blue-50 border-l-4 border-l-[#002A5C]" : "",
                room.isEmergency ? "bg-red-50" : ""
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {room.type === 'direct' ? (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {room.participants.find(p => p.id !== currentUser.id)?.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                      room.isEmergency ? "bg-red-500" : "bg-[#002A5C]"
                    )}>
                      {room.type === 'emergency' ? '🚨' : <Users className="h-4 w-4" />}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <h3 className="font-medium text-sm truncate">{room.name}</h3>
                      {room.isEmergency && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Nöd
                        </Badge>
                      )}
                    </div>
                    {room.lastMessage && (
                      <p className="text-xs text-gray-500 truncate">
                        {room.lastMessage.sender.name}: {room.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-1">
                  {room.lastMessage && (
                    <span className="text-xs text-gray-400">
                      {room.lastMessage.timestamp.toLocaleTimeString('sv-SE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  )}
                  {room.unreadCount > 0 && (
                    <Badge className="bg-[#002A5C] text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                      {room.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Online Users */}
        <OnlineStatus users={onlineUsers} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedRoom.type === 'direct' ? (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {selectedRoom.participants.find(p => p.id !== currentUser.id)?.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                      selectedRoom.isEmergency ? "bg-red-500" : "bg-[#002A5C]"
                    )}>
                      {selectedRoom.type === 'emergency' ? '🚨' : <Users className="h-4 w-4" />}
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-semibold">{selectedRoom.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedRoom.participants.length} deltagare
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <MessageList 
              messages={messages} 
              currentUser={currentUser}
              isEmergencyRoom={selectedRoom.isEmergency}
            />

            {/* Message Input */}
            <MessageInput 
              onSendMessage={handleSendMessage}
              isEmergencyRoom={selectedRoom.isEmergency}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Välj en konversation</h3>
              <p className="text-sm">Välj en konversation från listan för att börja chatta</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}