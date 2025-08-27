'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bot,
  User,
  Send,
  Loader2,
  MessageSquare,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'
import { getAuthHeaders } from '@/lib/token-helper'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: string
  confidence?: number
  category?: string
  helpful?: boolean | null
}

export function AIChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hej! Jag är Nordflytt AI-assistenten. Jag hjälper dig att analysera kundförfrågningar, generera svar och hantera kundtjänst. Vad kan jag hjälpa dig med idag?',
      timestamp: new Date().toISOString(),
      confidence: 1.0,
      category: 'greeting'
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      // Simulate AI response processing
      const aiResponse = await generateAIResponse(inputMessage.trim())
      
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: aiResponse.response,
        timestamp: new Date().toISOString(),
        confidence: aiResponse.confidence || 0.9,
        category: aiResponse.category
      }

      setMessages(prev => [...prev, aiMessage])

    } catch (error) {
      console.error('AI response error:', error)
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'ai',
        content: 'Ursäkta, jag kunde inte behandla din förfrågan just nu. Försök igen senare.',
        timestamp: new Date().toISOString(),
        confidence: 0,
        category: 'error'
      }
      setMessages(prev => [...prev, errorMessage])
      toast.error('AI-assistenten är inte tillgänglig')
    } finally {
      setIsTyping(false)
    }
  }

  const generateAIResponse = async (userInput: string): Promise<any> => {
    // In a real implementation, this would call the AI API
    // For now, we'll simulate intelligent responses

    const lowerInput = userInput.toLowerCase()

    // Detect inquiry type and generate appropriate response
    if (lowerInput.includes('pris') || lowerInput.includes('kosta') || lowerInput.includes('offert')) {
      return {
        response: `Jag analyserar din prisförfrågan. Baserat på informationen du angett rekommenderar jag följande:\n\n• För flyttjänster: 800-1200 kr/timme med 2-3 personer\n• För städning: 400-600 kr/timme (med 50% RUT-avdrag)\n• För packning: 300-500 kr/timme\n\nVill du att jag skapar en detaljerad prisuppskattning? Berätta mer om volym, avstånd och specialkrav.`,
        confidence: 0.92,
        category: 'pricing'
      }
    }

    if (lowerInput.includes('flytt') || lowerInput.includes('move') || lowerInput.includes('transport')) {
      return {
        response: `Jag ser att du har frågor om flyttjänster. Här är vad jag kan hjälpa dig med:\n\n• **Analysera din flyttning**: Uppskatta volym och tid\n• **Rekommendera team**: Välja rätt personal baserat på behov\n• **Beräkna kostnad**: Inkludera alla faktorer och specialkrav\n• **Planera logistik**: Optimala rutter och tidsscheman\n\nVilken aspekt vill du fokusera på först?`,
        confidence: 0.95,
        category: 'moving'
      }
    }

    if (lowerInput.includes('städ') || lowerInput.includes('clean') || lowerInput.includes('rut')) {
      return {
        response: `Utmärkt! Städtjänster är ett av våra specialområden. Här är vad du bör veta:\n\n• **RUT-avdrag**: 50% rabatt på arbetskostnader\n• **Flyttstädning**: Komplett rengöring för överlämning\n• **Förstädning**: Innan packning och flytt\n• **Specialstädning**: Fönster, vitvaror, djuprengöring\n\nMed RUT-avdrag betalar kunden endast hälften av arbetskostnaden. Vill du att jag beräknar en exakt kostnad?`,
        confidence: 0.94,
        category: 'cleaning'
      }
    }

    if (lowerInput.includes('team') || lowerInput.includes('personal') || lowerInput.includes('bemanning')) {
      return {
        response: `Jag hjälper dig optimera teamsammansättning! Baserat på AI-analys kan jag:\n\n• **Matcha kompetens**: Välja rätt personal för specifika jobb\n• **Optimera scheman**: Minimera restid och maximera effektivitet\n• **Balansera arbetsbelastning**: Förhindra överbelastning\n• **Förutsäga prestanda**: Baserat på tidigare resultat\n\nBerätta mer om jobbet så genererar jag en teamrekommendation.`,
        confidence: 0.88,
        category: 'team_optimization'
      }
    }

    // Default intelligent response
    return {
      response: `Tack för din fråga! Jag är här för att hjälpa dig med:\n\n• **Kundanalys**: Analysera förfrågningar och identifiera behov\n• **Prisberäkning**: Generera intelligenta offertförslag\n• **Teamoptimering**: Föreslå bästa personalsammansättning\n• **Processoptimering**: Förbättra arbetsflöden och effektivitet\n\nKan du berätta mer specifikt vad du behöver hjälp med? Ju mer information du ger, desto bättre kan jag assistera dig.`,
      confidence: 0.85,
      category: 'general'
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Meddelande kopierat!')
  }

  const rateMessage = (messageId: string, helpful: boolean) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, helpful } : msg
    ))
    toast.success(helpful ? 'Tack för din positiva feedback!' : 'Tack för din feedback, vi förbättrar oss!')
  }

  const clearChat = () => {
    setMessages([{
      id: '1',
      type: 'ai',
      content: 'Hej! Jag är Nordflytt AI-assistenten. Jag hjälper dig att analysera kundförfrågningar, generera svar och hantera kundtjänst. Vad kan jag hjälpa dig med idag?',
      timestamp: new Date().toISOString(),
      confidence: 1.0,
      category: 'greeting'
    }])
    toast.success('Chatt rensad!')
  }

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null
    
    if (confidence >= 0.9) return <Badge className="bg-green-100 text-green-800 text-xs">Hög tillförlitlighet</Badge>
    if (confidence >= 0.7) return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Medel tillförlitlighet</Badge>
    return <Badge className="bg-red-100 text-red-800 text-xs">Låg tillförlitlighet</Badge>
  }

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'pricing': return '💰'
      case 'moving': return '🚚'
      case 'cleaning': return '🧹'
      case 'team_optimization': return '👥'
      case 'greeting': return '👋'
      case 'error': return '❌'
      default: return '🤖'
    }
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              AI Customer Service Assistant
            </CardTitle>
            <CardDescription>
              Intelligent kundtjänstassistent med naturlig språkförståelse
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={clearChat}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Rensa
            </Button>
            <Badge className="bg-purple-100 text-purple-800">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                } rounded-lg p-3`}>
                  <div className="flex items-center gap-2 mb-2">
                    {message.type === 'ai' ? (
                      <Bot className="h-4 w-4 text-purple-600" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="text-xs font-medium">
                      {message.type === 'ai' ? 'AI Assistant' : 'Du'}
                    </span>
                    {message.category && (
                      <span className="text-xs">
                        {getCategoryIcon(message.category)}
                      </span>
                    )}
                  </div>

                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>

                  {message.type === 'ai' && (
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        {getConfidenceBadge(message.confidence)}
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString('sv-SE', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => copyMessage(message.content)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => rateMessage(message.id, true)}
                        >
                          <ThumbsUp className={`h-3 w-3 ${
                            message.helpful === true ? 'text-green-600' : ''
                          }`} />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => rateMessage(message.id, false)}
                        >
                          <ThumbsDown className={`h-3 w-3 ${
                            message.helpful === false ? 'text-red-600' : ''
                          }`} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-medium">AI Assistant skriver...</span>
                  </div>
                  <div className="flex space-x-1 mt-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex items-center gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Skriv din fråga här... (t.ex. 'Analysera denna kundförfrågan: Vi ska flytta från Stockholm till Göteborg')"
            disabled={isTyping}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isTyping}
            size="sm"
          >
            {isTyping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            'Analysera kundförfrågan',
            'Beräkna flyttkostnad',
            'Rekommendera team',
            'Generera offert',
            'Optimera rutt'
          ].map((action) => (
            <Button
              key={action}
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => setInputMessage(action)}
              disabled={isTyping}
            >
              {action}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}