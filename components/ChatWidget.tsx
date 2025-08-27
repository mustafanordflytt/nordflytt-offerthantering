'use client';

// =============================================================================
// NORDFLYTT WEBSITE CHAT WIDGET
// Revolutionary AI chatbot with real-time pricing and system integration
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Zap,
  DollarSign,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  Minimize2,
  Maximize2,
  Brain
} from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  confidence?: number;
  revenue_opportunity?: number;
  upsell_suggestions?: any[];
  system_data?: any;
}

interface ChatWidgetProps {
  initialMessage?: string;
  customerInfo?: {
    email?: string;
    phone?: string;
    name?: string;
  };
  position?: 'bottom-right' | 'bottom-left';
  theme?: 'default' | 'nordflytt';
}

export default function ChatWidget({ 
  initialMessage = "Hej! 👋 Välkommen till Nordflytt! Jag är Maja, din personliga flyttassistent. Jag kan hjälpa dig med prisofferter, boka flytthjälp och svara på alla dina frågor. Hur kan jag hjälpa dig idag?",
  customerInfo,
  position = 'bottom-right',
  theme = 'nordflytt'
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [showNotification, setShowNotification] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    ai_online: true,
    response_time: '0.8s',
    systems_connected: 4
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        text: initialMessage,
        sender: 'bot',
        timestamp: new Date(),
        confidence: 1.0,
        system_data: {
          systems_used: ['knowledge_base'],
          integration_health: 'excellent'
        }
      }]);
    }
  }, [initialMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Call Nordflytt AI API - try new v2 endpoint first, fallback to unified
      let response;
      
      // First try the new v2 endpoint that integrates with production GPT-RAG
      try {
        response = await fetch('/api/ai-customer-service/gpt/chat-v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: customerInfo?.email || customerInfo?.phone || null,
            message: text.trim(),
            conversationHistory: messages.filter(m => m.sender === 'user' || m.sender === 'bot').map(m => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text
            }))
          })
        });
        
        if (!response.ok) {
          throw new Error('v2 endpoint failed');
        }
      } catch (v2Error) {
        console.log('Falling back to unified message endpoint');
        // Fallback to original unified endpoint
        response = await fetch('/api/chat/unified/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            message: text.trim(),
            channel: 'website',
            customerInfo: customerInfo || {},
            metadata: {
              widget_version: '1.0',
              page_url: window.location.href,
              user_agent: navigator.userAgent
            }
          })
        });
      }

      const data = await response.json();

      // Simulate realistic typing delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      
      if (data.success) {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          sender: 'bot',
          timestamp: new Date(),
          confidence: data.confidence,
          revenue_opportunity: data.business_context?.revenue_opportunity || data.revenue_opportunity,
          upsell_suggestions: data.business_context?.upsell_suggestions || data.suggestions,
          system_data: {
            systems_used: data.business_context?.systems_integrated || data.api_data ? ['gpt-rag'] : [],
            processing_time: data.system_status?.processing_time_ms,
            integration_health: data.system_status?.integration_health || (data.production_api ? 'excellent' : 'good'),
            production_api: data.production_api
          }
        };

        setMessages(prev => [...prev, botMessage]);
        
        // Update system status
        setSystemStatus({
          ai_online: true,
          response_time: `${data.system_status?.processing_time_ms || 800}ms`,
          systems_connected: data.business_context?.systems_integrated?.length || (data.production_api ? 4 : 3)
        });

        // Handle suggestions if available
        if (data.suggestions && data.suggestions.length > 0) {
          // Could display quick action buttons based on suggestions
          console.log('Suggestions available:', data.suggestions);
        }

      } else {
        // Fallback response
        const fallbackMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: data.response || "Ursäkta, jag har lite tekniska problem. Jag kopplar dig till en av våra experter!",
          sender: 'bot',
          timestamp: new Date(),
          confidence: 0.5
        };
        setMessages(prev => [...prev, fallbackMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Error fallback
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Oj, något gick fel! Jag ska se till att en kollega kontaktar dig inom 5 minuter. Tack för ditt tålamod! 🙏",
        sender: 'bot',
        timestamp: new Date(),
        confidence: 0.3
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  };

  const themeColors = {
    default: {
      primary: 'bg-blue-600',
      secondary: 'bg-blue-50',
      text: 'text-blue-600'
    },
    nordflytt: {
      primary: 'bg-[#002A5C]',
      secondary: 'bg-blue-50',
      text: 'text-[#002A5C]'
    }
  };

  const theme_colors = themeColors[theme];

  // Chat bubble when closed
  if (!isOpen) {
    return (
      <div 
        id="chat-widget-container"
        className={`fixed ${positionClasses[position]} z-50`}
        style={{ overflow: 'visible' }}
      >
        <button
          onClick={() => {
            setIsOpen(true);
            setShowNotification(false);
          }}
          className={`${theme_colors.primary} hover:opacity-90 rounded-full w-16 h-16 shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center relative overflow-hidden`}
          aria-label="Öppna chat med Maja"
        >
          <svg 
            className="h-8 w-8 text-white flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
            />
          </svg>
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold animate-pulse">
            1
          </span>
        </button>
        
        {/* Quick notification popup - Fixed positioning and text wrapping */}
        {showNotification && (
          <div className="absolute bottom-20 right-0 bg-white rounded-lg shadow-xl p-4 w-72" style={{ 
            writingMode: 'horizontal-tb',
            textOrientation: 'mixed',
            overflow: 'hidden',
            animation: 'fadeIn 0.3s ease-in-out'
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNotification(false);
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-sm text-gray-700 leading-relaxed pr-6 whitespace-normal" style={{ 
              writingMode: 'horizontal-tb',
              textOrientation: 'mixed'
            }}>
              💬 Behöver du hjälp med din flytt? Jag kan ge dig pris direkt!
            </p>
            <div className="absolute bottom-0 right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
          </div>
        )}
      </div>
    );
  }

  // Mobile detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  
  return (
    <div 
      id="chat-widget-container"
      className={`fixed ${isMobile ? 'inset-0' : positionClasses[position]} z-50 transition-all duration-300`}
    >
      <Card className={`${isMobile ? 'w-full h-full rounded-none' : 'w-96'} ${
        !isMobile && isMinimized ? 'h-16' : isMobile ? 'h-full' : 'h-[650px]'
      } transition-all duration-300 ${!isMobile ? 'rounded-3xl' : ''} shadow-2xl backdrop-filter backdrop-blur-lg bg-white/95 border border-gray-200/50 overflow-hidden flex flex-col`}>
        {/* Enhanced Header with Gradient */}
        <CardHeader className={`p-0 ${isMinimized ? 'h-16' : ''}`}>
          <div className={`bg-gradient-to-r from-[#667eea] to-[#764ba2] ${isMinimized ? 'p-3' : 'p-5'} text-white h-full`}>
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center space-x-3">
                <div className={`${isMinimized ? 'w-8 h-8' : 'w-10 h-10'} bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg`}>
                  <span className={`${isMinimized ? 'text-lg' : 'text-xl'}`}>📦</span>
                </div>
                {!isMinimized && (
                  <div>
                    <CardTitle className="text-lg font-semibold">Maja från Nordflytt</CardTitle>
                    <div className="flex items-center space-x-2 text-sm opacity-95">
                      <div className="relative">
                        <div className="w-2 h-2 bg-[#4ADE80] rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-[#4ADE80] rounded-full absolute top-0 animate-ping"></div>
                      </div>
                      <span>Online • Svarar inom 30 sekunder</span>
                    </div>
                  </div>
                )}
                {isMinimized && (
                  <div className="ml-2">
                    <p className="text-sm font-medium">Maja från Nordflytt</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Enhanced Messages Area with Glassmorphism */}
            <CardContent className="flex-1 overflow-y-auto p-6 h-[440px] bg-gradient-to-b from-gray-50/50 to-white/50 backdrop-blur-sm chat-scrollbar">
              <div className="space-y-4">
                {/* Welcome Message with Quick Actions */}
                {messages.length === 1 && (
                  <div className="mb-6 animate-fade-in">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-5 shadow-sm border border-purple-100/50">
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        Hej! 👋 Jag är Maja från Nordflytt!
                        <br /><br />
                        Jag hjälper dig med allt från prisofferter till bokningar och kan svara på frågor om RUT-avdrag, kartonguthyrning och våra tjänster. Vad kan jag hjälpa dig med idag?
                      </p>
                      
                      {/* Quick Action Buttons Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => sendMessage("Jag vill ha en prisoffert")}
                          className="group bg-white hover:bg-gradient-to-r hover:from-[#667eea] hover:to-[#764ba2] hover:text-white rounded-xl p-4 text-left transition-all duration-300 shadow-sm hover:shadow-lg border border-gray-200 hover:border-transparent"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">💰</span>
                            <div>
                              <p className="font-medium text-gray-800 group-hover:text-white">Prisoffert</p>
                              <p className="text-xs text-gray-500 group-hover:text-white/80">Få pris direkt</p>
                            </div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => sendMessage("Jag behöver kartonger")}
                          className="group bg-white hover:bg-gradient-to-r hover:from-[#667eea] hover:to-[#764ba2] hover:text-white rounded-xl p-4 text-left transition-all duration-300 shadow-sm hover:shadow-lg border border-gray-200 hover:border-transparent"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">📦</span>
                            <div>
                              <p className="font-medium text-gray-800 group-hover:text-white">Kartonger</p>
                              <p className="text-xs text-gray-500 group-hover:text-white/80">Hyr eller köp</p>
                            </div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => sendMessage("Berätta om RUT-avdrag")}
                          className="group bg-white hover:bg-gradient-to-r hover:from-[#667eea] hover:to-[#764ba2] hover:text-white rounded-xl p-4 text-left transition-all duration-300 shadow-sm hover:shadow-lg border border-gray-200 hover:border-transparent"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">🧾</span>
                            <div>
                              <p className="font-medium text-gray-800 group-hover:text-white">RUT-avdrag</p>
                              <p className="text-xs text-gray-500 group-hover:text-white/80">50% rabatt</p>
                            </div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => sendMessage("Jag vill ha städning")}
                          className="group bg-white hover:bg-gradient-to-r hover:from-[#667eea] hover:to-[#764ba2] hover:text-white rounded-xl p-4 text-left transition-all duration-300 shadow-sm hover:shadow-lg border border-gray-200 hover:border-transparent"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">✨</span>
                            <div>
                              <p className="font-medium text-gray-800 group-hover:text-white">Städning</p>
                              <p className="text-xs text-gray-500 group-hover:text-white/80">Flyttstäd</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Message List */}
                {messages.map((message) => (
                  <ChatMessageComponent 
                    key={message.id} 
                    message={message} 
                    themeColors={theme_colors}
                  />
                ))}
                
                {/* Enhanced Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-lg">📦</span>
                    </div>
                    <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100">
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>

            {/* Enhanced Input Area */}
            <div className="p-5 bg-white border-t border-gray-100">
              <form onSubmit={handleSubmit} className="flex space-x-3">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Skriv ditt meddelande här..."
                  className="flex-1 h-12 px-5 rounded-2xl border-gray-200 focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 transition-all duration-200 text-gray-700 placeholder-gray-400"
                  disabled={isTyping}
                />
                <Button 
                  type="submit" 
                  className="h-12 px-6 rounded-2xl bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5a67d8] hover:to-[#68428f] text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isTyping || !inputValue.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
              
              {/* Enhanced Quick Actions */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-500">Snabbval:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => sendMessage("Vad kostar en flytt?")}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gradient-to-r hover:from-[#667eea] hover:to-[#764ba2] hover:text-white text-gray-600 transition-all duration-200"
                  >
                    💰 Priser
                  </button>
                  <button
                    onClick={() => sendMessage("Boka en flytt")}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gradient-to-r hover:from-[#667eea] hover:to-[#764ba2] hover:text-white text-gray-600 transition-all duration-200"
                  >
                    📅 Boka
                  </button>
                  <button
                    onClick={() => sendMessage("Var är mitt team?")}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gradient-to-r hover:from-[#667eea] hover:to-[#764ba2] hover:text-white text-gray-600 transition-all duration-200"
                  >
                    📍 Spåra
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

// =============================================================================
// CHAT MESSAGE COMPONENT
// =============================================================================

interface ChatMessageProps {
  message: ChatMessage;
  themeColors: any;
}

const ChatMessageComponent = ({ message, themeColors }: ChatMessageProps) => {
  const isBot = message.sender === 'bot';
  
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}>
      <div className={`max-w-[80%] ${isBot ? 'order-2' : 'order-1'}`}>
        {/* Enhanced Message Bubble */}
        <div className={`${
          isBot 
            ? 'bg-white shadow-md border border-gray-100 rounded-2xl rounded-tl-md' 
            : 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-2xl rounded-tr-md shadow-lg'
        } px-5 py-3 transition-all duration-200 hover:shadow-lg`}>
          <p className={`text-sm leading-relaxed ${isBot ? 'text-gray-700' : 'text-white'}`}>{message.text}</p>
          
          {/* Bot message enhancements */}
          {isBot && (
            <div className="mt-2 space-y-2">
              {/* AI Confidence */}
              {message.confidence && (
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Brain className="h-3 w-3" />
                  <span>AI Confidence: {Math.round(message.confidence * 100)}%</span>
                  {message.confidence > 0.9 && <CheckCircle className="h-3 w-3 text-green-600" />}
                  {message.confidence < 0.7 && <AlertCircle className="h-3 w-3 text-yellow-600" />}
                </div>
              )}
              
              {/* Revenue Opportunity */}
              {message.revenue_opportunity && message.revenue_opportunity > 0 && (
                <div className="flex items-center space-x-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  <DollarSign className="h-3 w-3" />
                  <span>Revenue opportunity: {message.revenue_opportunity.toLocaleString()} kr</span>
                </div>
              )}
              
              {/* Upsell Suggestions */}
              {message.upsell_suggestions && message.upsell_suggestions.length > 0 && (
                <div className="space-y-1">
                  {message.upsell_suggestions.slice(0, 2).map((suggestion, index) => (
                    <div key={index} className="text-xs bg-blue-50 px-2 py-1 rounded flex items-center space-x-2">
                      <Zap className="h-3 w-3 text-blue-600" />
                      <span className="text-blue-700">{suggestion.message}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* System Integration Status */}
              {message.system_data?.systems_used && message.system_data.systems_used.length > 0 && (
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>{message.system_data.systems_used.length} systems integrated</span>
                  </div>
                  {message.system_data.processing_time && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{message.system_data.processing_time}ms</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Enhanced Timestamp */}
        <div className={`text-xs text-gray-400 mt-2 ${isBot ? 'text-left' : 'text-right'}`}>
          {message.timestamp.toLocaleTimeString('sv-SE', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
      
      {/* Enhanced Avatar */}
      <div className={`${isBot ? 'order-1 mr-3' : 'order-2 ml-3'}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
          isBot 
            ? 'bg-gradient-to-br from-purple-100 to-blue-100' 
            : 'bg-gradient-to-br from-gray-100 to-gray-200'
        }`}>
          {isBot ? (
            <span className="text-lg">📦</span>
          ) : (
            <User className="h-5 w-5 text-gray-600" />
          )}
        </div>
      </div>
    </div>
  );
};