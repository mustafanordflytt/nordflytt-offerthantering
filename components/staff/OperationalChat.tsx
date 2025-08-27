'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Clock,
  MapPin,
  Truck,
  AlertTriangle,
  CheckCircle,
  X,
  Send,
  MessageSquare,
  Phone,
  Navigation,
  Timer,
  Package,
  Users,
  Coffee,
  Wrench,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  UserPlus,
  PhoneCall
} from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'action' | 'text' | 'system'
  content: string
  timestamp: Date
  sender: string
  action?: QuickAction
}

interface QuickAction {
  id: string
  type: 'status' | 'location' | 'request' | 'alert'
  label: string
  icon: typeof Clock
  color: string
  description: string
}

interface StaffMember {
  id: string
  name: string
  role: string
  phone: string
  email: string
  isOnline: boolean
  lastSeen?: Date
}

interface OperationalChatProps {
  isOpen: boolean
  onClose: () => void
  teamMembers: string[]
  jobId?: string
}

export default function OperationalChat({ 
  isOpen, 
  onClose, 
  teamMembers,
  jobId 
}: OperationalChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [customMessage, setCustomMessage] = useState('')
  const [isCustomInputVisible, setIsCustomInputVisible] = useState(false)
  const [showStaffDirectory, setShowStaffDirectory] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Staff directory - alla anställda med telefonnummer
  const allStaff: StaffMember[] = [
    {
      id: '1',
      name: 'Erik Andersson',
      role: 'Flyttchef',
      phone: '+46 70 123 45 67',
      email: 'erik@nordflytt.se',
      isOnline: true,
      lastSeen: new Date()
    },
    {
      id: '2',
      name: 'Sofia Lindberg',
      role: 'Flyttare',
      phone: '+46 70 234 56 78',
      email: 'sofia@nordflytt.se',
      isOnline: true,
      lastSeen: new Date()
    },
    {
      id: '3',
      name: 'Marcus Johansson',
      role: 'Lastbilschaufför',
      phone: '+46 70 345 67 89',
      email: 'marcus@nordflytt.se',
      isOnline: false,
      lastSeen: new Date(Date.now() - 30 * 60 * 1000) // 30 min ago
    },
    {
      id: '4',
      name: 'Anna Svensson',
      role: 'Flyttassistent',
      phone: '+46 70 456 78 90',
      email: 'anna@nordflytt.se',
      isOnline: true,
      lastSeen: new Date()
    },
    {
      id: '5',
      name: 'Henrik Karlsson',
      role: 'Flyttare',
      phone: '+46 70 567 89 01',
      email: 'henrik@nordflytt.se',
      isOnline: false,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: '6',
      name: 'Lisa Åkesson',
      role: 'Städare',
      phone: '+46 70 678 90 12',
      email: 'lisa@nordflytt.se',
      isOnline: true,
      lastSeen: new Date()
    },
    {
      id: '7',
      name: 'David Nilsson',
      role: 'Flyttare',
      phone: '+46 70 789 01 23',
      email: 'david@nordflytt.se',
      isOnline: false,
      lastSeen: new Date(Date.now() - 45 * 60 * 1000) // 45 min ago
    },
    {
      id: '8',
      name: 'Maria Persson',
      role: 'Koordinator',
      phone: '+46 70 890 12 34',
      email: 'maria@nordflytt.se',
      isOnline: true,
      lastSeen: new Date()
    }
  ]

  // Get current user from localStorage
  const currentUser = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('staff_auth') || '{}')?.name || 'Okänd'
    : 'Okänd'

  // Quick action definitions
  const quickActions: QuickAction[] = [
    {
      id: 'arrived',
      type: 'status',
      label: 'Har ankommit',
      icon: CheckCircle,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Meddelar att du har anlänt till uppdragsplatsen'
    },
    {
      id: 'delayed',
      type: 'alert',
      label: 'Är försenad',
      icon: Clock,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      description: 'Meddelar att du är försenad från schemat'
    },
    {
      id: 'route',
      type: 'location',
      label: 'På väg',
      icon: Navigation,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Meddelar att du är på väg till uppdragsplatsen'
    },
    {
      id: 'break',
      type: 'status',
      label: 'Tar paus',
      icon: Coffee,
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Meddelar att du tar en paus'
    },
    {
      id: 'help',
      type: 'request',
      label: 'Behöver hjälp',
      icon: AlertTriangle,
      color: 'bg-red-500 hover:bg-red-600',
      description: 'Begär hjälp från teamet'
    },
    {
      id: 'equipment',
      type: 'request',
      label: 'Behöver utrustning',
      icon: Wrench,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Begär ytterligare utrustning'
    },
    {
      id: 'completed',
      type: 'status',
      label: 'Klart',
      icon: CheckCircle,
      color: 'bg-green-600 hover:bg-green-700',
      description: 'Meddelar att uppdraget är klart'
    },
    {
      id: 'problem',
      type: 'alert',
      label: 'Problem',
      icon: AlertTriangle,
      color: 'bg-red-600 hover:bg-red-700',
      description: 'Rapporterar ett problem som behöver åtgärdas'
    }
  ]

  // Send quick action message
  const sendQuickAction = (action: QuickAction) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'action',
      content: action.label,
      timestamp: new Date(),
      sender: currentUser,
      action
    }
    
    setMessages(prev => [...prev, message])
    
    // Add system confirmation
    setTimeout(() => {
      const systemMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: `${currentUser} - ${action.description}`,
        timestamp: new Date(),
        sender: 'System'
      }
      setMessages(prev => [...prev, systemMessage])
    }, 100)
  }

  // Send custom message
  const sendCustomMessage = () => {
    if (!customMessage.trim()) return
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'text',
      content: customMessage,
      timestamp: new Date(),
      sender: currentUser
    }
    
    setMessages(prev => [...prev, message])
    setCustomMessage('')
    setIsCustomInputVisible(false)
  }

  // Auto-cleanup messages older than 4 hours
  useEffect(() => {
    const cleanup = () => {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)
      setMessages(prev => prev.filter(msg => msg.timestamp > fourHoursAgo))
    }
    
    const interval = setInterval(cleanup, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Initialize with system message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const systemMessage: ChatMessage = {
        id: 'init',
        type: 'system',
        content: `Operativ chat öppnad för dagens team. Meddelanden raderas automatiskt efter 4 timmar.`,
        timestamp: new Date(),
        sender: 'System'
      }
      setMessages([systemMessage])
    }
  }, [isOpen, messages.length])

  if (!isOpen) return null

  // Staff Directory Modal
  const renderStaffDirectory = () => (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl border-2 border-gray-200">
        <div className="flex items-center justify-between p-4 border-b bg-[#002A5C] text-white rounded-t-lg">
          <h3 className="font-semibold text-white">Personal & Telefonnummer</h3>
          <button
            onClick={() => setShowStaffDirectory(false)}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {allStaff.map((staff) => (
              <div key={staff.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`w-3 h-3 rounded-full ${staff.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{staff.name}</div>
                      <div className="text-sm text-gray-600">{staff.role}</div>
                      {!staff.isOnline && staff.lastSeen && (
                        <div className="text-xs text-gray-500">
                          Senast online: {staff.lastSeen.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <div className="text-sm font-mono text-gray-700 font-medium">
                      {staff.phone}
                    </div>
                    <a
                      href={`tel:${staff.phone}`}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-md"
                      title={`Ring ${staff.name}`}
                    >
                      <Phone className="h-4 w-4" />
                      <span className="text-sm font-medium">Ring</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t text-center">
          <p className="text-xs text-gray-500">
            Klicka på telefonknappen för att ringa direkt
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {showStaffDirectory && renderStaffDirectory()}
      {!showStaffDirectory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-end">
          <div className="bg-white rounded-t-lg w-full max-w-md mx-auto h-[550px] flex flex-col relative z-[101]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-[#002A5C]" />
            <h3 className="font-semibold text-[#002A5C]">Operativ Chat</h3>
            <Badge className="bg-green-100 text-green-800">
              {teamMembers.length} online
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowStaffDirectory(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Visa personal & telefonnummer"
            >
              <Phone className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px]">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Välkommen till operativ chat!</p>
              <p className="text-xs">Använd snabbåtgärderna nedan för att kommunicera.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg max-w-[280px] ${
                  message.type === 'system'
                    ? 'bg-blue-50 text-blue-700 text-sm mx-auto text-center border border-blue-200'
                    : message.sender === currentUser
                    ? 'bg-[#002A5C] text-white ml-auto'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {message.action && (
                    <message.action.icon className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="text-sm">{message.content}</span>
                </div>
                <div className="text-xs opacity-75 mt-2">
                  {message.type !== 'system' && (
                    <span className="font-medium">{message.sender}</span>
                  )}
                  {message.type !== 'system' && ' • '}
                  {message.timestamp.toLocaleTimeString('sv-SE', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="border-t p-3 bg-gray-50">
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Snabbåtgärder</h4>
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {showQuickActions ? '▼ Dölj' : '▲ Visa'}
              </button>
            </div>
            {showQuickActions && (
              <div className="grid grid-cols-2 gap-1">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  onClick={() => sendQuickAction(action)}
                  className={`${action.color} text-white p-2 rounded-md flex items-center space-x-1 text-xs transition-colors`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="truncate">{action.label}</span>
                </button>
              )
            })}
              </div>
            )}
          </div>

          {/* Custom Message Input */}
          {isCustomInputVisible ? (
            <div className="flex space-x-2 mt-3">
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Skriv ett meddelande..."
                className="flex-1 min-h-[50px] resize-none text-sm"
                maxLength={200}
              />
              <div className="flex flex-col space-y-1">
                <Button
                  onClick={sendCustomMessage}
                  size="sm"
                  className="bg-[#002A5C] hover:bg-[#001a42] h-8 w-8 p-0"
                >
                  <Send className="h-3 w-3" />
                </Button>
                <Button
                  onClick={() => {
                    setIsCustomInputVisible(false)
                    setCustomMessage('')
                  }}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsCustomInputVisible(true)}
              variant="outline"
              className="w-full mt-3 text-sm"
              size="sm"
            >
              <MessageSquare className="h-3 w-3 mr-2" />
              Skriv meddelande
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 text-xs text-gray-500 text-center border-t">
          Endast dagens team • Auto-rensning efter 4h • Ingen personlig data
        </div>
      </div>
    </div>
      )}
    </>
  )
}