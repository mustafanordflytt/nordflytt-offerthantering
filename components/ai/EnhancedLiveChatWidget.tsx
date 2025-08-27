'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  confidence?: number;
  requiresVerification?: boolean;
  verificationId?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  preferredName: string;
  isVIP: boolean;
}

export default function EnhancedLiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [verificationMode, setVerificationMode] = useState(false);
  const [pendingVerificationId, setPendingVerificationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      identifyCustomer();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const identifyCustomer = async () => {
    try {
      // In production, this would identify the logged-in user
      const mockCustomerId = 'customer-123';
      const response = await fetch(`/api/ai-customer-service/memory/greeting/${mockCustomerId}`);
      const data = await response.json();
      
      if (data.context) {
        setCustomer({
          id: mockCustomerId,
          name: data.context.preferredName,
          email: 'customer@example.com',
          preferredName: data.context.preferredName,
          isVIP: data.context.isVIP
        });
      }
      
      // Add personalized greeting
      const greetingMessage: Message = {
        id: Date.now().toString(),
        sender: 'ai',
        text: data.message,
        timestamp: new Date()
      };
      setMessages([greetingMessage]);
      
    } catch (error) {
      console.error('Failed to identify customer:', error);
      // Fallback greeting
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        sender: 'ai',
        text: 'Hej! 👋 Jag är Maja från Nordflytt!\n\nJag hjälper dig med allt från prisofferter till bokningar och kan svara på frågor om RUT-avdrag, kartonguthyrning och våra tjänster.\n\nVad kan jag hjälpa dig med idag?',
        timestamp: new Date()
      };
      setMessages([fallbackMessage]);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      // Check if in verification mode
      if (verificationMode && pendingVerificationId) {
        const verifyResponse = await fetch('/api/ai-customer-service/security/verify-in-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: customer?.id,
            action: 'verify',
            verificationCode: text,
            verificationId: pendingVerificationId
          })
        });
        
        const verifyResult = await verifyResponse.json();
        
        const verifyMessage: Message = {
          id: Date.now().toString(),
          sender: 'ai',
          text: verifyResult.message,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, verifyMessage]);
        
        if (verifyResult.success) {
          setVerificationMode(false);
          setPendingVerificationId(null);
        }
        
        setIsTyping(false);
        return;
      }
      
      // Normal chat flow - Use new v2 API with smart responses
      const response = await fetch('/api/ai-customer-service/gpt/chat-v2', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: customer?.id || 'anonymous',
          message: text,
          conversationHistory: messages.slice(-5).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        })
      });
      
      const result = await response.json();
      
      // Handle verification requirement
      if (result.requiresVerification) {
        setVerificationMode(true);
        setPendingVerificationId(result.verificationId);
        
        // Initiate verification
        const verifyInitResponse = await fetch('/api/ai-customer-service/security/verify-in-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: customer?.id,
            action: 'initiate'
          })
        });
        
        const verifyInitResult = await verifyInitResponse.json();
        
        const verifyMessage: Message = {
          id: Date.now().toString(),
          sender: 'ai',
          text: verifyInitResult.message,
          timestamp: new Date(),
          requiresVerification: true,
          verificationId: verifyInitResult.verificationId
        };
        
        setMessages(prev => [...prev, verifyMessage]);
      } else {
        const aiMessage: Message = {
          id: Date.now().toString(),
          sender: 'ai',
          text: result.response || 'Jag kan hjälpa dig med flyttfrågor, priser och bokningar.',
          confidence: result.confidence,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Handle special actions
        if (result.action === 'open_custom_gpt' || 
            result.suggestions?.some((s: any) => s.action === 'open_custom_gpt')) {
          // Could add a button or link to open Custom GPT
          console.log('Custom GPT URL:', result.customGptUrl);
        }
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        sender: 'ai',
        text: 'Ursäkta, något gick fel. Kan du försöka igen?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-16 h-16 rounded-full 
                     bg-gradient-to-r from-purple-600 to-blue-600 
                     shadow-lg flex items-center justify-center text-white
                     hover:shadow-xl transition-shadow z-50"
          >
            <Bot className="w-8 h-8" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 15 }}
            className="fixed bottom-6 right-6 w-96 h-[650px] z-50
                     rounded-3xl shadow-2xl backdrop-filter backdrop-blur-lg 
                     bg-white/95 border border-gray-200/50 overflow-hidden flex flex-col"
          >
            {/* Enhanced Header with Gradient */}
            <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xl">📦</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Maja från Nordflytt</h4>
                    <div className="flex items-center space-x-2 text-sm opacity-95">
                      <div className="relative">
                        <div className="w-2 h-2 bg-[#4ADE80] rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-[#4ADE80] rounded-full absolute top-0 animate-ping"></div>
                      </div>
                      <span>Online • Svarar inom 30 sekunder</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {customer?.isVIP && (
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                      <Star className="w-3 h-3 mr-1" />
                      VIP
                    </Badge>
                  )}
                  {verificationMode && (
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                      <Shield className="w-3 h-3 mr-1" />
                      Säker
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Messages Area with Glassmorphism */}
            <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-gray-50/50 to-white/50 backdrop-blur-sm">
              <div className="space-y-4">
                {/* Welcome Message with Quick Actions */}
                {messages.length === 1 && !verificationMode && (
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
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ x: msg.sender === 'ai' ? -20 : 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`flex ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-3`}>
                      {/* Enhanced Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                        msg.sender === 'ai' 
                          ? 'bg-gradient-to-br from-purple-100 to-blue-100' 
                          : 'bg-gradient-to-br from-gray-100 to-gray-200'
                      }`}>
                        {msg.sender === 'ai' ? (
                          <span className="text-lg">📦</span>
                        ) : (
                          <Bot className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      
                      {/* Enhanced Message Bubble */}
                      <div className={`max-w-[85%]`}>
                        <div className={`${
                          msg.sender === 'ai' 
                            ? 'bg-white shadow-md border border-gray-100 rounded-2xl rounded-tl-md' 
                            : 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-2xl rounded-tr-md shadow-lg'
                        } px-5 py-3 transition-all duration-200 hover:shadow-lg`}>
                          <p className={`text-sm leading-relaxed ${msg.sender === 'ai' ? 'text-gray-700' : 'text-white'}`}>
                            {msg.text}
                          </p>
                          {msg.confidence && (
                            <div className="text-xs mt-2 opacity-70">
                              AI Säkerhet: {Math.round(msg.confidence * 100)}%
                            </div>
                          )}
                        </div>
                        {/* Enhanced Timestamp */}
                        <div className={`text-xs text-gray-400 mt-2 ${msg.sender === 'ai' ? 'text-left' : 'text-right'}`}>
                          {msg.timestamp.toLocaleTimeString('sv-SE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Enhanced Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center space-x-3"
                  >
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
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Enhanced Input Area */}
            <div className="p-5 bg-white border-t border-gray-100">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex space-x-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    verificationMode 
                      ? "Ange säkerhetskod..." 
                      : "Skriv ditt meddelande här..."
                  }
                  className="flex-1 h-12 px-5 rounded-2xl border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 transition-all duration-200"
                  style={{ backgroundColor: '#ffffff', color: '#111827' }}
                />
                <Button
                  type="submit"
                  disabled={!input.trim()}
                  className="h-12 px-6 rounded-2xl bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5a67d8] hover:to-[#68428f] text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}