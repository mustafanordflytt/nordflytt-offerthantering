'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare,
  X,
  Send,
  Sparkles,
  HelpCircle,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Mic,
  Volume2
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'suggestion';
  content: string;
  timestamp: Date;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

interface QuickAction {
  id: string;
  question: string;
  icon: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
}

interface Props {
  onClose?: () => void;
  isMinimized?: boolean;
}

const AIAssistant: React.FC<Props> = ({ onClose, isMinimized = false }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hej! Jag är din AI SEO-assistent. Jag ser att du har 3 kritiska åtgärder som kan öka intäkterna med 245,000 kr/mån. Vill du att jag fixar dem åt dig?',
      timestamp: new Date(),
      actions: [
        { label: 'Ja, fixa allt', action: () => handleAutoFix() },
        { label: 'Visa vad du kommer göra', action: () => handleShowDetails() }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isMinimized);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      question: 'Varför tappar vi position?',
      icon: <TrendingUp className="h-4 w-4" />,
      priority: 'high'
    },
    {
      id: '2',
      question: 'Vad är viktigast just nu?',
      icon: <AlertCircle className="h-4 w-4" />,
      priority: 'high'
    },
    {
      id: '3',
      question: 'Hur ligger vi till mot konkurrenter?',
      icon: <Lightbulb className="h-4 w-4" />,
      priority: 'medium'
    },
    {
      id: '4',
      question: 'Förklara vad AI gör',
      icon: <HelpCircle className="h-4 w-4" />,
      priority: 'low'
    }
  ];

  const handleAutoFix = () => {
    addMessage({
      type: 'user',
      content: 'Ja, fixa allt automatiskt'
    });

    setTimeout(() => {
      addMessage({
        type: 'assistant',
        content: 'Perfekt! Jag börjar nu med att:\n\n1. ✅ Svara på 5 recensioner med AI-genererade, personliga svar\n2. ✅ Optimera innehåll för "Flyttfirma Stockholm"\n3. ✅ Skapa vårkampanj med landningssidor\n\nDetta tar cirka 10 minuter. Du får en notis när allt är klart.',
        actions: [
          { label: 'Se live-uppdateringar', action: () => {} }
        ]
      });
    }, 1500);
  };

  const handleShowDetails = () => {
    addMessage({
      type: 'user',
      content: 'Visa vad du kommer göra'
    });

    setTimeout(() => {
      addMessage({
        type: 'assistant',
        content: 'Här är min plan:\n\n**1. Recensioner (+35K/mån)**\n- Analysera ton och sentiment\n- Generera personliga svar\n- Lyfta fram era styrkor\n\n**2. Position #1 (+125K/mån)**\n- Uppdatera meta-beskrivningar\n- Förbättra sidladdning\n- Lägga till schema markup\n\n**3. Vårkampanj (+85K)**\n- Skapa 3 landningssidor\n- Optimera för "vårstädning flytt"\n- Aktivera Google Ads\n\nVill du att jag kör igång?',
        actions: [
          { label: 'Kör igång', action: () => handleAutoFix() },
          { label: 'Anpassa först', action: () => {} }
        ]
      });
    }, 1500);
  };

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }]);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    addMessage({
      type: 'user',
      content: input
    });

    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = generateAIResponse(input);
      addMessage(response);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string): Omit<Message, 'id' | 'timestamp'> => {
    const input = userInput.toLowerCase();

    if (input.includes('position') || input.includes('ranking')) {
      return {
        type: 'assistant',
        content: 'Er position har förbättrats från #5 till #3 senaste veckan! 🎉\n\nAnledningen är att AI har:\n- Optimerat 12 sidor för lokala sökningar\n- Förbättrat laddtider med 40%\n- Lagt till strukturerad data\n\nFör att nå #1 behöver vi få 15 fler recensioner och skapa innehåll om "akut flytt". Ska jag fixa det?',
        actions: [
          { label: 'Ja, gör det', action: () => handleAutoFix() }
        ]
      };
    }

    if (input.includes('konkurrent')) {
      return {
        type: 'assistant',
        content: 'Här är läget mot era huvudkonkurrenter:\n\n**Stockholm Flyttbyrå** (#1)\n- Sårbarhet: Långsam hemsida, dålig mobil\n- Vi kan ta över på: "billig flytt", "helgflytt"\n\n**Flytt & Transport AB** (#2)\n- Sårbarhet: Lite innehåll, svaga lokala sidor\n- Vi leder redan på: "kontorsflytt", "pianoflytt"\n\nVill du se min attackplan för att ta #1?',
        actions: [
          { label: 'Visa attackplan', action: () => {} },
          { label: 'Kör automatisk attack', action: () => handleAutoFix() }
        ]
      };
    }

    return {
      type: 'assistant',
      content: 'Jag förstår din fråga. Baserat på nuvarande data är det viktigaste att fokusera på de 3 kritiska åtgärderna som kan ge 245,000 kr extra per månad. Vill du att jag förklarar mer eller ska vi köra igång direkt?',
      actions: [
        { label: 'Förklara mer', action: () => {} },
        { label: 'Kör igång', action: () => handleAutoFix() }
      ]
    };
  };

  const handleQuickAction = (action: QuickAction) => {
    addMessage({
      type: 'user',
      content: action.question
    });
    
    setIsTyping(true);
    setTimeout(() => {
      const response = generateAIResponse(action.question);
      addMessage(response);
      setIsTyping(false);
    }, 1000);
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white">3</Badge>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h3 className="font-semibold">AI SEO Assistent</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-white/80 mt-1">Alltid redo att hjälpa</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-line">{message.content}</p>
              {message.actions && (
                <div className="flex gap-2 mt-3">
                  {message.actions.map((action, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant={message.type === 'user' ? 'secondary' : 'default'}
                      onClick={action.action}
                      className="text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-t bg-gray-50">
        <p className="text-xs text-gray-600 mb-2">Snabbfrågor:</p>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(action)}
              className="justify-start text-xs"
            >
              {action.icon}
              <span className="ml-2 truncate">{action.question}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsListening(!isListening)}
            className={`h-10 w-10 p-0 ${isListening ? 'bg-red-100' : ''}`}
          >
            <Mic className={`h-4 w-4 ${isListening ? 'text-red-600' : ''}`} />
          </Button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ställ en fråga..."
            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-10 px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          AI läser av situationen och föreslår alltid det bästa
        </p>
      </div>
    </Card>
  );
};

export default AIAssistant;