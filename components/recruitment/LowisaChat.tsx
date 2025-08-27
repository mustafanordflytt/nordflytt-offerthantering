'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  CheckCircle2, 
  Circle,
  Car,
  Briefcase,
  Clock,
  MessageSquare
} from 'lucide-react';

interface InformationStatus {
  korkort: boolean | string;
  arbetserfarenhet: boolean | string;
  tillganglighet: boolean | string;
  svenska: boolean | string;
  isComplete: boolean;
  completionRate: number;
}

interface Message {
  id: string;
  content: string;
  sender: 'lowisa' | 'candidate';
  timestamp: Date;
  informationStatus?: InformationStatus;
  isMLPrediction?: boolean;
}

interface LowisaChatProps {
  candidateId: number;
  candidateName: string;
  position: string;
  initialContext?: any;
  onInformationComplete?: (candidateId: number) => void;
}

export default function LowisaChat({ 
  candidateId, 
  candidateName,
  position,
  initialContext,
  onInformationComplete 
}: LowisaChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [informationStatus, setInformationStatus] = useState<InformationStatus>({
    korkort: false,
    arbetserfarenhet: false,
    tillganglighet: false,
    svenska: false,
    isComplete: false,
    completionRate: 0
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversation history on mount
  useEffect(() => {
    loadConversationHistory();
  }, [candidateId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversationHistory = async () => {
    try {
      const response = await fetch(`/api/lowisa/conversation/${candidateId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setInformationStatus(data.informationStatus || informationStatus);
      } else {
        // Start new conversation if no history
        startNewConversation();
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      startNewConversation();
    }
  };

  const startNewConversation = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: `Hej ${candidateName}! 😊 Tack för din ansökan till ${position} – kul att du vill jobba med oss på Nordflytt!
      
Jag heter Lowisa och är rekryteringsassistent här. Jag behöver bara ställa några kompletterande frågor för att kunna gå vidare med din ansökan. Allt du delar hålls konfidentiellt.

Ska vi börja? Har du körkort, och i så fall vilken typ? (B, C, CE, annat)`,
      sender: 'lowisa',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'candidate',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/lowisa/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          message: input,
          context: {
            candidateName,
            position,
            informationStatus,
            conversationHistory: messages.slice(-10) // Last 10 messages for context
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const aiMessage: Message = {
          id: Date.now().toString() + '-ai',
          content: data.response,
          sender: 'lowisa',
          timestamp: new Date(),
          informationStatus: data.informationStatus
        };

        setMessages(prev => [...prev, aiMessage]);
        setInformationStatus(data.informationStatus);
        
        // If we have ML prediction, show it
        if (data.mlPrediction) {
          setTimeout(() => {
            const mlMessage: Message = {
              id: Date.now().toString() + '-ml',
              content: `🤖 **ML-analys klar!**\n\n` +
                `✅ Sannolikhet för framgång: ${(data.mlPrediction.successProbability * 100).toFixed(0)}%\n` +
                `💼 Rekommenderad position: ${data.mlPrediction.recommendedPosition}\n` +
                `⚠️ Riskfaktorer: ${data.mlPrediction.riskFactors} st\n\n` +
                `Detaljerad rapport finns nu i kandidatens profil.`,
              sender: 'lowisa',
              timestamp: new Date(),
              isMLPrediction: true
            };
            setMessages(prev => [...prev, mlMessage]);
          }, 1500);
        }

        // Check if information gathering is complete
        if (data.informationStatus.isComplete && onInformationComplete) {
          onInformationComplete(candidateId);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const getStatusIcon = (status: boolean | string) => {
    if (status === true || (typeof status === 'string' && status.length > 0)) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    return <Circle className="w-4 h-4 text-gray-400" />;
  };

  const getAreaLabel = (area: string) => {
    const labels: { [key: string]: { icon: React.ReactNode, label: string } } = {
      korkort: { icon: <Car className="w-4 h-4" />, label: 'Körkort' },
      arbetserfarenhet: { icon: <Briefcase className="w-4 h-4" />, label: 'Arbetserfarenhet' },
      tillganglighet: { icon: <Clock className="w-4 h-4" />, label: 'Tillgänglighet' },
      svenska: { icon: <MessageSquare className="w-4 h-4" />, label: 'Svenska' }
    };
    return labels[area] || { icon: null, label: area };
  };

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Header with progress */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Lowisa - Rekryteringsassistent</h3>
          </div>
          <Badge variant={informationStatus.isComplete ? "success" : "secondary"}>
            {Math.round(informationStatus.completionRate)}% klart
          </Badge>
        </div>
        
        <Progress value={informationStatus.completionRate} className="h-2 mb-3" />
        
        {/* Information status indicators */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(informationStatus).map(([key, value]) => {
            if (key === 'isComplete' || key === 'completionRate') return null;
            const { icon, label } = getAreaLabel(key);
            return (
              <div key={key} className="flex items-center gap-2">
                {getStatusIcon(value)}
                <span className="flex items-center gap-1">
                  {icon}
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.sender === 'lowisa' ? 'justify-start' : 'justify-end'
              }`}
            >
              {message.sender === 'lowisa' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === 'lowisa'
                    ? message.isMLPrediction 
                      ? 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 text-gray-900' 
                      : 'bg-gray-100 text-gray-900'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString('sv-SE', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              {message.sender === 'candidate' && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t">
        {informationStatus.isComplete ? (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-green-800">
              Tack för dina svar! Nästa steg har skickats till din e-post.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Skriv ditt svar här..."
              disabled={isTyping}
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || isTyping}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        )}
      </div>
    </Card>
  );
}