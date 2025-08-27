'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageSquare,
  Send,
  Phone,
  Users,
  AlertTriangle,
  Camera,
  Paperclip,
  Smile,
  ArrowLeft,
  Wifi,
  WifiOff,
  Circle,
  CheckCircle,
  Home,
  Calendar,
  Mic,
  Search,
  Settings,
  Bell,
  Volume2,
  VolumeX
} from 'lucide-react'
import Link from 'next/link'
import TopNavigation from '@/components/staff/TopNavigation'

interface ChatRoom {
  id: string
  name: string
  type: 'team' | 'general' | 'emergency' | 'management'
  participants: string[]
  lastMessage: {
    content: string
    timestamp: string
    sender: string
  } | null
  unreadCount: number
  isActive: boolean
}

interface Message {
  id: string
  content: string
  sender: string
  senderName: string
  timestamp: string
  type: 'text' | 'image' | 'file' | 'emergency' | 'system'
  reactions?: Array<{
    emoji: string
    users: string[]
  }>
  isRead: boolean
}

interface UserPresence {
  userId: string
  name: string
  status: 'online' | 'offline' | 'away' | 'busy'
  lastSeen: string
}

export default function ChatPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<any>(null)
  const [currentRoom, setCurrentRoom] = useState<string>('team-alpha')
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [userPresence, setUserPresence] = useState<UserPresence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [unreadMessages, setUnreadMessages] = useState(3)

  useEffect(() => {
    // Check authentication
    const authData = localStorage.getItem('staff_auth')
    if (!authData) {
      router.push('/staff')
      return
    }

    try {
      const parsedAuth = JSON.parse(authData)
      setStaff(parsedAuth)
      initializeChat()
    } catch (error) {
      router.push('/staff')
    }

    // Set up online/offline detection
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [router])

  const initializeChat = async () => {
    setIsLoading(true)
    
    // Mock data - replace with Agent 3's real-time integration
    const mockRooms: ChatRoom[] = [
      {
        id: 'team-alpha',
        name: 'Team Alpha',
        type: 'team',
        participants: ['erik', 'sofia', 'marcus'],
        lastMessage: {
          content: 'Ses på Arenavägen 08:00!',
          timestamp: '2025-01-15T07:45:00Z',
          sender: 'erik'
        },
        unreadCount: 2,
        isActive: true
      },
      {
        id: 'general',
        name: 'Allmänt',
        type: 'general',
        participants: ['erik', 'sofia', 'marcus', 'anna', 'henrik'],
        lastMessage: {
          content: 'Glöm inte veckomötet imorgon!',
          timestamp: '2025-01-14T16:30:00Z',
          sender: 'anna'
        },
        unreadCount: 0,
        isActive: true
      },
      {
        id: 'emergency',
        name: 'Nödlarm',
        type: 'emergency',
        participants: ['erik', 'sofia', 'marcus', 'anna', 'henrik'],
        lastMessage: null,
        unreadCount: 0,
        isActive: true
      },
      {
        id: 'management',
        name: 'Ledning',
        type: 'management',
        participants: ['erik', 'anna'],
        lastMessage: {
          content: 'Månadens resultat ser bra ut',
          timestamp: '2025-01-14T14:20:00Z',
          sender: 'anna'
        },
        unreadCount: 1,
        isActive: true
      }
    ]

    const mockMessages: Message[] = [
      {
        id: '1',
        content: 'God morgon team! Klar för dagens jobb?',
        sender: 'erik',
        senderName: 'Erik Andersson',
        timestamp: '2025-01-15T07:30:00Z',
        type: 'text',
        reactions: [
          { emoji: '👍', users: ['sofia', 'marcus'] }
        ],
        isRead: true
      },
      {
        id: '2',
        content: 'Japp! På väg nu.',
        sender: 'sofia',
        senderName: 'Sofia Lindberg',
        timestamp: '2025-01-15T07:32:00Z',
        type: 'text',
        isRead: true
      },
      {
        id: '3',
        content: 'Ses på Arenavägen 08:00!',
        sender: 'erik',
        senderName: 'Erik Andersson',
        timestamp: '2025-01-15T07:45:00Z',
        type: 'text',
        isRead: false
      }
    ]

    const mockPresence: UserPresence[] = [
      {
        userId: 'erik',
        name: 'Erik Andersson',
        status: 'online',
        lastSeen: '2025-01-15T07:45:00Z'
      },
      {
        userId: 'sofia',
        name: 'Sofia Lindberg',
        status: 'online',
        lastSeen: '2025-01-15T07:44:00Z'
      },
      {
        userId: 'marcus',
        name: 'Marcus Johansson',
        status: 'away',
        lastSeen: '2025-01-15T07:20:00Z'
      },
      {
        userId: 'anna',
        name: 'Anna Svensson',
        status: 'busy',
        lastSeen: '2025-01-15T07:00:00Z'
      },
      {
        userId: 'henrik',
        name: 'Henrik Karlsson',
        status: 'offline',
        lastSeen: '2025-01-14T18:30:00Z'
      }
    ]

    setRooms(mockRooms)
    setMessages(mockMessages)
    setUserPresence(mockPresence)
    setIsLoading(false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: staff?.email || 'current-user',
      senderName: staff?.name || 'Current User',
      timestamp: new Date().toISOString(),
      type: 'text',
      isRead: false
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    // Play sound notification if enabled
    if (soundEnabled) {
      playNotificationSound()
    }

    // TODO: Send to real-time system via Agent 3's integration
    // await realtimeService.sendMessage(currentRoom, message)
  }

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/message-sent.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {
        // Fallback vibration if sound fails
        if ('vibrate' in navigator) {
          navigator.vibrate(100)
        }
      })
    } catch (error) {
      // Fallback vibration
      if ('vibrate' in navigator) {
        navigator.vibrate(100)
      }
    }
  }

  const getRoomColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200'
      case 'management': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'team': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online'
      case 'away': return 'Borta'
      case 'busy': return 'Upptagen'
      default: return 'Offline'
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const currentRoomData = rooms.find(r => r.id === currentRoom)
  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#002A5C]">Team Chat</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Sök kanaler..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Room List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                currentRoom === room.id
                  ? 'bg-[#002A5C] text-white'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => {
                setCurrentRoom(room.id)
                setShowSidebar(false)
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium">{room.name}</h3>
                {room.unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs">
                    {room.unreadCount}
                  </Badge>
                )}
              </div>
              
              {room.lastMessage && (
                <div className={`text-sm ${
                  currentRoom === room.id ? 'text-blue-100' : 'text-gray-600'
                }`}>
                  <p className="truncate">{room.lastMessage.content}</p>
                  <p className="text-xs opacity-75">
                    {formatTime(room.lastMessage.timestamp)}
                  </p>
                </div>
              )}
              
              <div className={`mt-2 ${getRoomColor(room.type)} px-2 py-1 rounded text-xs inline-block`}>
                {room.type === 'emergency' ? 'Nödlarm' :
                 room.type === 'management' ? 'Ledning' :
                 room.type === 'team' ? 'Team' : 'Allmänt'}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Online Users */}
      <div className="p-4 border-t">
        <h3 className="font-medium text-gray-700 mb-3">Online ({userPresence.filter(u => u.status === 'online').length})</h3>
        <div className="space-y-2">
          {userPresence.filter(u => u.status === 'online').slice(0, 3).map((user) => (
            <div key={user.userId} className="flex items-center space-x-2">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#002A5C] text-white text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`}></div>
              </div>
              <span className="text-sm">{user.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (isLoading || !staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002A5C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <TopNavigation unreadMessages={unreadMessages} />
      
      <div className="flex h-[calc(100vh-48px)]">
        {/* Mobile Sidebar Overlay */}
        {showSidebar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Desktop Sidebar - Always visible on desktop */}
        <div className="hidden lg:flex w-80 bg-white border-r flex-shrink-0">
          <SidebarContent />
        </div>

        {/* Mobile Sidebar - Slide from left on mobile */}
        <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:hidden fixed top-0 bottom-0 left-0 z-50 w-80 bg-white border-r transition-transform duration-300 ease-in-out`}>
          <SidebarContent />
        </div>

        {/* Main Chat Area - Takes remaining space */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setShowSidebar(true)}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              
              <div>
                <h1 className="font-bold text-lg">{currentRoomData?.name || 'Chat'}</h1>
                <p className="text-sm text-gray-600">
                  {currentRoomData?.participants.length} medlemmar
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link href="/staff/emergency">
                <Button variant="outline" size="sm" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  SOS
                </Button>
              </Link>
              
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === staff?.email ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${
                    message.sender === staff?.email
                      ? 'bg-[#002A5C] text-white'
                      : 'bg-white border'
                  } rounded-lg p-3 shadow-sm`}>
                    
                    {message.sender !== staff?.email && (
                      <p className="text-xs font-medium text-gray-600 mb-1">
                        {message.senderName}
                      </p>
                    )}
                    
                    <p className="text-sm">{message.content}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs ${
                        message.sender === staff?.email ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </span>
                      
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex space-x-1">
                          {message.reactions.map((reaction, index) => (
                            <span key={index} className="text-xs">
                              {reaction.emoji} {reaction.users.length}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {message.sender === staff?.email && (
                      <div className="flex justify-end mt-1">
                        {message.isRead ? (
                          <CheckCircle className="h-3 w-3 text-blue-200" />
                        ) : (
                          <Circle className="h-3 w-3 text-blue-200" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="bg-white border-t p-4 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm">
                <Camera className="h-4 w-4" />
              </Button>
              
              <div className="flex-1 relative">
                <Input
                  placeholder="Skriv ett meddelande..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="pr-20"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isLoading}
                className="bg-[#002A5C] hover:bg-[#001a42]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}