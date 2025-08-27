import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { verifyToken } from '@/lib/staff-auth'

// Message types
const MESSAGE_TYPES = {
  'text': 'Textmeddelande',
  'image': 'Bild',
  'file': 'Fil',
  'location': 'Platsdelning',
  'urgent': 'Brådskande',
  'system': 'Systemmeddelande'
}

// Chat channels/rooms
const CHAT_CHANNELS = {
  'general': {
    id: 'general',
    name: 'Allmän chat',
    description: 'Allmän kommunikation',
    members: ['all'],
    type: 'public'
  },
  'dispatch': {
    id: 'dispatch',
    name: 'Kundtjänst',
    description: 'Kommunikation med kundtjänst',
    members: ['staff', 'admin', 'customer_service'],
    type: 'department'
  },
  'management': {
    id: 'management',
    name: 'Ledning',
    description: 'Ledningskommunikation',
    members: ['admin', 'manager'],
    type: 'restricted'
  },
  'emergency': {
    id: 'emergency',
    name: 'Nödsituation',
    description: 'Brådskande kommunikation',
    members: ['all'],
    type: 'emergency'
  }
}

// Mock storage för meddelanden
const mockMessages = new Map<string, any[]>()
let messageCounter = 1

// Initiera med några exempel-meddelanden
mockMessages.set('general', [
  {
    id: 'msg-001',
    channelId: 'general',
    senderId: 'admin-001',
    senderName: 'Systemadmin',
    senderRole: 'admin',
    messageType: 'system',
    content: 'Personalappen är nu aktiv! Välkomna alla.',
    attachments: [],
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 timme sedan
    readBy: [],
    edited: false,
    deleted: false,
    replyTo: null
  },
  {
    id: 'msg-002',
    channelId: 'general',
    senderId: 'staff-002',
    senderName: 'Maria Eriksson',
    senderRole: 'manager',
    messageType: 'text',
    content: 'God morgon alla! Kom ihåg att checka in vid varje jobb.',
    attachments: [],
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min sedan
    readBy: ['staff-001', 'staff-003'],
    edited: false,
    deleted: false,
    replyTo: null
  }
])

mockMessages.set('dispatch', [
  {
    id: 'msg-003',
    channelId: 'dispatch',
    senderId: 'customer_service-001',
    senderName: 'Emma Nilsson',
    senderRole: 'customer_service',
    messageType: 'urgent',
    content: 'Kund på Volvo-jobbet ringer och undrar när ni kommer. Kan någon svara?',
    attachments: [],
    timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min sedan
    readBy: [],
    edited: false,
    deleted: false,
    replyTo: null
  }
])

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Ingen token tillhandahållen' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Ogiltig eller utgången token' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const channelId = searchParams.get('channel') || 'general'
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // För paginering
    const unreadOnly = searchParams.get('unread') === 'true'

    const staffId = payload.staffId as string
    const userRole = payload.role as string

    // Kontrollera åtkomst till kanal
    const channel = CHAT_CHANNELS[channelId as keyof typeof CHAT_CHANNELS]
    if (!channel) {
      return NextResponse.json(
        { error: 'Kanal hittades inte' },
        { status: 404 }
      )
    }

    // Kontrollera behörigheter
    const hasAccess = channel.members.includes('all') || 
                     channel.members.includes(userRole) ||
                     channel.members.includes(staffId)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Ingen åtkomst till denna kanal' },
        { status: 403 }
      )
    }

    // Hämta meddelanden för kanalen
    let messages = mockMessages.get(channelId) || []

    // Filtrera bort borttagna meddelanden
    messages = messages.filter(msg => !msg.deleted)

    // Filtrera efter endast olästa om begärt
    if (unreadOnly) {
      messages = messages.filter(msg => !msg.readBy.includes(staffId))
    }

    // Sortera efter tid (senaste först)
    messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Begränsa antal meddelanden
    if (before) {
      const beforeIndex = messages.findIndex(msg => msg.timestamp < before)
      if (beforeIndex > -1) {
        messages = messages.slice(beforeIndex, beforeIndex + limit)
      }
    } else {
      messages = messages.slice(0, limit)
    }

    // Markera meddelanden som lästa
    const channelMessages = mockMessages.get(channelId) || []
    channelMessages.forEach(msg => {
      if (!msg.readBy.includes(staffId)) {
        msg.readBy.push(staffId)
      }
    })
    mockMessages.set(channelId, channelMessages)

    // Beräkna antal olästa meddelanden per kanal
    const unreadCounts = {}
    for (const [channelKey, channelMessages] of mockMessages.entries()) {
      const channelInfo = CHAT_CHANNELS[channelKey as keyof typeof CHAT_CHANNELS]
      if (channelInfo && (channelInfo.members.includes('all') || channelInfo.members.includes(userRole))) {
        (unreadCounts as any)[channelKey] = channelMessages.filter(msg => 
          !msg.deleted && !msg.readBy.includes(staffId)
        ).length
      }
    }

    return NextResponse.json({
      channel: {
        ...channel,
        id: channelId
      },
      messages,
      unreadCounts,
      hasMore: messages.length === limit,
      totalMessages: (mockMessages.get(channelId) || []).filter(msg => !msg.deleted).length
    })

  } catch (error) {
    console.error('Chat GET error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta meddelanden' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Ingen token tillhandahållen' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Ogiltig eller utgången token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      channelId,
      messageType,
      content,
      attachments,
      replyTo,
      urgent
    } = body

    // Validera input
    if (!channelId || !content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Kanal ID och innehåll krävs' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Meddelandet är för långt (max 2000 tecken)' },
        { status: 400 }
      )
    }

    const staffId = payload.staffId as string
    const userRole = payload.role as string

    // Kontrollera åtkomst till kanal
    const channel = CHAT_CHANNELS[channelId as keyof typeof CHAT_CHANNELS]
    if (!channel) {
      return NextResponse.json(
        { error: 'Kanal hittades inte' },
        { status: 404 }
      )
    }

    const hasAccess = channel.members.includes('all') || 
                     channel.members.includes(userRole) ||
                     channel.members.includes(staffId)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Ingen åtkomst till denna kanal' },
        { status: 403 }
      )
    }

    const messageId = `msg-${String(messageCounter++).padStart(6, '0')}`
    const timestamp = new Date().toISOString()

    // Skapa meddelande
    const message = {
      id: messageId,
      channelId,
      senderId: staffId,
      senderName: payload.name as string,
      senderRole: userRole,
      messageType: urgent ? 'urgent' : (messageType || 'text'),
      content: content.trim(),
      attachments: attachments || [],
      timestamp,
      readBy: [staffId], // Avsändaren har "läst" meddelandet
      edited: false,
      deleted: false,
      replyTo: replyTo || null
    }

    // Lägg till meddelandet i kanalen
    const channelMessages = mockMessages.get(channelId) || []
    channelMessages.push(message)
    mockMessages.set(channelId, channelMessages)

    // Hantera brådskande meddelanden
    if (urgent || messageType === 'urgent') {
      // Skicka push-notifieringar till alla i kanalen
      console.log(`URGENT MESSAGE: ${payload.name} in ${channel.name}: ${content}`)
      
      // I produktion: Skicka push-notifieringar via Supabase eller WebSocket
      // await sendPushNotification({
      //   channel: channelId,
      //   sender: payload.name,
      //   message: content,
      //   urgent: true
      // })
    }

    // Hantera systemmeddelanden för automatiska uppdateringar
    if (messageType === 'system') {
      // Bara admin kan skicka systemmeddelanden
      if (userRole !== 'admin') {
        return NextResponse.json(
          { error: 'Endast administratörer kan skicka systemmeddelanden' },
          { status: 403 }
        )
      }
    }

    // I produktion: Spara till Supabase och skicka real-time uppdatering
    // const supabase = createClient()
    // const { data, error } = await supabase
    //   .from('staff_messages')
    //   .insert([message])
    //   .select()
    //   .single()

    // Real-time broadcast till alla i kanalen
    // await supabase.channel(`chat-${channelId}`)
    //   .send({
    //     type: 'broadcast',
    //     event: 'new_message',
    //     payload: message
    //   })

    return NextResponse.json({
      success: true,
      message: {
        id: messageId,
        channelId,
        timestamp,
        urgent: urgent || messageType === 'urgent'
      },
      channelInfo: {
        name: channel.name,
        totalMessages: channelMessages.length
      }
    })

  } catch (error) {
    console.error('Chat POST error:', error)
    return NextResponse.json(
      { error: 'Kunde inte skicka meddelande' },
      { status: 500 }
    )
  }
}

// PUT för att redigera meddelande
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Ingen token tillhandahållen' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Ogiltig eller utgången token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { messageId, content, action } = body // action: 'edit' eller 'delete'

    if (!messageId || !action) {
      return NextResponse.json(
        { error: 'Message ID och action krävs' },
        { status: 400 }
      )
    }

    const staffId = payload.staffId as string
    const userRole = payload.role as string

    // Hitta meddelandet
    let targetMessage = null
    let targetChannel = null

    for (const [channelId, messages] of mockMessages.entries()) {
      const message = messages.find(msg => msg.id === messageId)
      if (message) {
        targetMessage = message
        targetChannel = channelId
        break
      }
    }

    if (!targetMessage) {
      return NextResponse.json(
        { error: 'Meddelande hittades inte' },
        { status: 404 }
      )
    }

    // Kontrollera behörigheter (endast avsändare eller admin kan redigera/ta bort)
    if (targetMessage.senderId !== staffId && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Du kan endast redigera dina egna meddelanden' },
        { status: 403 }
      )
    }

    if (action === 'edit') {
      if (!content || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'Innehåll krävs för redigering' },
          { status: 400 }
        )
      }

      targetMessage.content = content.trim()
      targetMessage.edited = true
      targetMessage.editedAt = new Date().toISOString()

    } else if (action === 'delete') {
      targetMessage.deleted = true
      targetMessage.deletedAt = new Date().toISOString()
      targetMessage.deletedBy = staffId
    }

    return NextResponse.json({
      success: true,
      action,
      messageId,
      message: action === 'edit' ? 'Meddelande redigerat' : 'Meddelande borttaget'
    })

  } catch (error) {
    console.error('Chat PUT error:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera meddelande' },
      { status: 500 }
    )
  }
}

// DELETE för att rensa chat-historik (admin endast)
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Ingen token tillhandahållen' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Ogiltig eller utgången token' },
        { status: 401 }
      )
    }

    // Endast admin kan rensa chat
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Endast administratörer kan rensa chat-historik' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const channelId = searchParams.get('channel')
    const olderThan = searchParams.get('olderThan') // ISO date string

    if (!channelId) {
      return NextResponse.json(
        { error: 'Kanal ID krävs' },
        { status: 400 }
      )
    }

    const channelMessages = mockMessages.get(channelId) || []
    let deletedCount = 0

    if (olderThan) {
      const cutoffDate = new Date(olderThan)
      const filteredMessages = channelMessages.filter(msg => {
        const messageDate = new Date(msg.timestamp)
        if (messageDate < cutoffDate) {
          deletedCount++
          return false
        }
        return true
      })
      mockMessages.set(channelId, filteredMessages)
    } else {
      // Rensa alla meddelanden
      deletedCount = channelMessages.length
      mockMessages.set(channelId, [])
    }

    return NextResponse.json({
      success: true,
      channelId,
      deletedCount,
      message: `${deletedCount} meddelanden rensade från ${channelId}`
    })

  } catch (error) {
    console.error('Chat DELETE error:', error)
    return NextResponse.json(
      { error: 'Kunde inte rensa chat-historik' },
      { status: 500 }
    )
  }
}