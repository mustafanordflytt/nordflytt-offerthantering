'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  MessageSquare,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Edit,
  Send,
  Plus,
  Paperclip,
  Calendar,
  Bug,
  HelpCircle,
  FileText,
  CreditCard,
  Tag,
  Users,
  Activity
} from 'lucide-react'
import Link from 'next/link'

interface Ticket {
  id: string
  ticketNumber: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  type: 'complaint' | 'inquiry' | 'technical' | 'billing' | 'general'
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  assignedTo: string | null
  assignedToName: string | null
  createdAt: string
  updatedAt: string
  lastActivity: string
  tags: string[]
  resolution: string | null
  timeSpent: number
  escalationLevel: number
}

interface Comment {
  id: string
  ticketId: string
  author: string
  authorName: string
  authorRole: 'staff' | 'customer'
  content: string
  isInternal: boolean
  createdAt: string
  attachments: string[]
  type: 'comment' | 'status_change' | 'assignment' | 'priority_change'
  metadata?: {
    oldValue?: string
    newValue?: string
  }
}

// Mock data
const mockTicket: Ticket = {
  id: '1',
  ticketNumber: 'TK-2024-001',
  title: 'Skada på möbler under flytt',
  description: 'Under flytten igår skadades min bokhylla. Den har fått en stor buckla på sidan. Jag tog bilder på skadan och undrar hur vi löser detta. Bokhyllan kostade 8000 kr och är bara 2 år gammal.',
  status: 'open',
  priority: 'high',
  type: 'complaint',
  customerId: 'f1916745-dc9c-4eee-943d-da636b90c258',
  customerName: 'Mustafa Abdulkarim',
  customerEmail: 'mustafa.abdulkarim@hotmail.com',
  customerPhone: '+46 72 368 39 67',
  assignedTo: null,
  assignedToName: null,
  createdAt: '2025-01-15T10:30:00Z',
  updatedAt: '2025-01-15T10:30:00Z',
  lastActivity: '2025-01-15T10:30:00Z',
  tags: ['möbelskada', 'ersättning', 'bokhylla'],
  resolution: null,
  timeSpent: 0,
  escalationLevel: 0
}

const mockComments: Comment[] = [
  {
    id: '1',
    ticketId: '1',
    author: 'customer-1',
    authorName: 'Mustafa Abdulkarim',
    authorRole: 'customer',
    content: 'Hej! Jag har nu tagit fler bilder på skadan från olika vinklar. Skadan är tydlig och verkar ha uppkommit under transporten. Vad händer nu?',
    isInternal: false,
    createdAt: '2025-01-15T11:45:00Z',
    attachments: ['bild1.jpg', 'bild2.jpg'],
    type: 'comment'
  },
  {
    id: '2',
    ticketId: '1',
    author: 'staff-1',
    authorName: 'Erik Andersson',
    authorRole: 'staff',
    content: 'Intern anteckning: Kontrollerat med flyttteamet. De bekräftar att det var trångt i trappan och att bokhyllan kan ha skadats då.',
    isInternal: true,
    createdAt: '2025-01-15T12:15:00Z',
    attachments: [],
    type: 'comment'
  }
]

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(mockTicket)
  const [comments, setComments] = useState<Comment[]>(mockComments)
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-orange-100 text-orange-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <MessageSquare className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'pending': return <AlertTriangle className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      case 'closed': return <XCircle className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white'
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'complaint': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'inquiry': return <HelpCircle className="h-4 w-4 text-blue-600" />
      case 'technical': return <Bug className="h-4 w-4 text-purple-600" />
      case 'billing': return <CreditCard className="h-4 w-4 text-green-600" />
      case 'general': return <FileText className="h-4 w-4 text-gray-600" />
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Öppet'
      case 'in_progress': return 'Pågående'
      case 'pending': return 'Väntar'
      case 'resolved': return 'Löst'
      case 'closed': return 'Stängt'
      default: return status
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Akut'
      case 'high': return 'Hög'
      case 'medium': return 'Medium'
      case 'low': return 'Låg'
      default: return priority
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'complaint': return 'Klagomål'
      case 'inquiry': return 'Förfrågan'
      case 'technical': return 'Tekniskt'
      case 'billing': return 'Faktura'
      case 'general': return 'Allmänt'
      default: return type
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!ticket) return
    
    // Add status change comment
    const statusComment: Comment = {
      id: `comment-${Date.now()}`,
      ticketId: ticket.id,
      author: 'current-staff',
      authorName: 'Erik Andersson',
      authorRole: 'staff',
      content: `Status ändrad från "${getStatusText(ticket.status)}" till "${getStatusText(newStatus)}"`,
      isInternal: true,
      createdAt: new Date().toISOString(),
      attachments: [],
      type: 'status_change',
      metadata: {
        oldValue: ticket.status,
        newValue: newStatus
      }
    }
    
    setComments(prev => [statusComment, ...prev])
    setTicket(prev => prev ? { ...prev, status: newStatus as any, lastActivity: new Date().toISOString() } : null)
  }

  const handlePriorityUpdate = async (newPriority: string) => {
    if (!ticket) return
    
    const priorityComment: Comment = {
      id: `comment-${Date.now()}`,
      ticketId: ticket.id,
      author: 'current-staff',
      authorName: 'Erik Andersson',
      authorRole: 'staff',
      content: `Prioritet ändrad från "${getPriorityText(ticket.priority)}" till "${getPriorityText(newPriority)}"`,
      isInternal: true,
      createdAt: new Date().toISOString(),
      attachments: [],
      type: 'priority_change',
      metadata: {
        oldValue: ticket.priority,
        newValue: newPriority
      }
    }
    
    setComments(prev => [priorityComment, ...prev])
    setTicket(prev => prev ? { ...prev, priority: newPriority as any, lastActivity: new Date().toISOString() } : null)
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket) return
    
    setIsSaving(true)
    
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      ticketId: ticket.id,
      author: 'current-staff',
      authorName: 'Erik Andersson',
      authorRole: 'staff',
      content: newComment,
      isInternal: isInternal,
      createdAt: new Date().toISOString(),
      attachments: [],
      type: 'comment'
    }
    
    setComments(prev => [comment, ...prev])
    setNewComment('')
    setTicket(prev => prev ? { ...prev, lastActivity: new Date().toISOString() } : null)
    setIsSaving(false)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const sortedComments = comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (!ticket) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Ärende hittades inte</p>
            <Button onClick={() => router.back()} className="mt-4">
              Gå tillbaka
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{ticket.ticketNumber}</h1>
            <p className="text-gray-600">{ticket.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon(ticket.status)}
            <Badge className={getStatusColor(ticket.status)}>
              {getStatusText(ticket.status)}
            </Badge>
          </div>
          <Badge className={getPriorityColor(ticket.priority)}>
            {getPriorityText(ticket.priority)}
          </Badge>
          <Link href={`/crm/arenden/${ticket.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Redigera
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Snabbåtgärder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={ticket.status} onValueChange={handleStatusUpdate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Öppet</SelectItem>
                  <SelectItem value="in_progress">Pågående</SelectItem>
                  <SelectItem value="pending">Väntar</SelectItem>
                  <SelectItem value="resolved">Löst</SelectItem>
                  <SelectItem value="closed">Stängt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Prioritet</label>
              <Select value={ticket.priority} onValueChange={handlePriorityUpdate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Låg</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">Hög</SelectItem>
                  <SelectItem value="urgent">Akut</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => window.open(`tel:${ticket.customerPhone}`)}
                className="w-full"
                variant="outline"
              >
                <Phone className="h-4 w-4 mr-2" />
                Ring kund
              </Button>
            </div>
            
            <div className="space-y-2">
              <Link href={`/crm/arenden/${ticket.id}/assign`}>
                <Button className="w-full" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Tilldela
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="conversation" className="space-y-4">
            <TabsList>
              <TabsTrigger value="conversation">Konversation</TabsTrigger>
              <TabsTrigger value="details">Detaljer</TabsTrigger>
              <TabsTrigger value="history">Historik</TabsTrigger>
            </TabsList>

            <TabsContent value="conversation" className="space-y-4">
              {/* Add Comment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Lägg till kommentar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Skriv din kommentar här..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={4}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="internal"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="internal" className="text-sm">
                        Intern anteckning (syns ej för kund)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Paperclip className="h-4 w-4 mr-2" />
                        Bifoga fil
                      </Button>
                      <Button 
                        onClick={handleAddComment} 
                        disabled={!newComment.trim() || isSaving}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isSaving ? 'Skickar...' : 'Skicka'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments */}
              <div className="space-y-4">
                {sortedComments.map((comment) => (
                  <Card key={comment.id} className={comment.isInternal ? 'border-yellow-200 bg-yellow-50' : ''}>
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-3">
                        <Avatar>
                          <AvatarFallback 
                            className={comment.authorRole === 'staff' ? 'bg-[#002A5C] text-white' : 'bg-gray-200'}
                          >
                            {getInitials(comment.authorName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium">{comment.authorName}</span>
                            <Badge variant={comment.authorRole === 'staff' ? 'default' : 'secondary'}>
                              {comment.authorRole === 'staff' ? 'Personal' : 'Kund'}
                            </Badge>
                            {comment.isInternal && (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                Intern
                              </Badge>
                            )}
                            <span className="text-sm text-gray-500">
                              {new Date(comment.createdAt).toLocaleString('sv-SE')}
                            </span>
                          </div>
                          
                          {comment.type === 'status_change' && (
                            <div className="flex items-center space-x-2 mb-2">
                              <Activity className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-blue-600 font-medium">Status ändrad</span>
                            </div>
                          )}
                          
                          {comment.type === 'priority_change' && (
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <span className="text-sm text-orange-600 font-medium">Prioritet ändrad</span>
                            </div>
                          )}
                          
                          <p className="text-gray-900 whitespace-pre-wrap">{comment.content}</p>
                          
                          {comment.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {comment.attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center space-x-2 text-sm text-blue-600">
                                  <Paperclip className="h-4 w-4" />
                                  <span>{attachment}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ärendebeskrivning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{ticket.description}</p>
                </CardContent>
              </Card>
              
              {ticket.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Tag className="h-5 w-5 mr-2" />
                      Taggar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {ticket.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ärendehistorik</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Ärende skapat</p>
                        <p className="text-sm text-gray-600">
                          {new Date(ticket.createdAt).toLocaleString('sv-SE')}
                        </p>
                      </div>
                    </div>
                    
                    {sortedComments.filter(c => c.type !== 'comment').map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">{activity.content}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(activity.createdAt).toLocaleString('sv-SE')} av {activity.authorName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Ärendeinformation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Typ</label>
                <div className="flex items-center space-x-2 mt-1">
                  {getTypeIcon(ticket.type)}
                  <span>{getTypeText(ticket.type)}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Skapat</label>
                <p className="text-sm mt-1">
                  {new Date(ticket.createdAt).toLocaleString('sv-SE')}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Senast aktiv</label>
                <p className="text-sm mt-1">
                  {new Date(ticket.lastActivity).toLocaleString('sv-SE')}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Tid spenderad</label>
                <p className="text-sm mt-1">{ticket.timeSpent}h</p>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Kundinformation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Link 
                  href={`/crm/kunder/${ticket.customerId}`}
                  className="font-medium text-[#002A5C] hover:underline"
                >
                  {ticket.customerName}
                </Link>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{ticket.customerEmail}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => window.open(`mailto:${ticket.customerEmail}`)}
                    className="h-auto p-1"
                  >
                    E-post
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{ticket.customerPhone}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => window.open(`tel:${ticket.customerPhone}`)}
                    className="h-auto p-1"
                  >
                    Ring
                  </Button>
                </div>
              </div>
              
              <Link href={`/crm/kunder/${ticket.customerId}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Visa kundprofil
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Tilldelning
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.assignedToName ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#002A5C] text-white">
                        {getInitials(ticket.assignedToName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{ticket.assignedToName}</span>
                  </div>
                  <Link href={`/crm/arenden/${ticket.id}/assign`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Ändra tilldelning
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Ej tilldelad</p>
                  <Link href={`/crm/arenden/${ticket.id}/assign`}>
                    <Button size="sm" className="w-full">
                      Tilldela personal
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}