'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Sparkles,
  FileText
} from 'lucide-react';
import { LowisaAssistant } from '@/lib/recruitment/LowisaAssistant';
import { useToast } from '@/hooks/use-toast';

interface LowisaChatModalProps {
  applicationId: number;
  candidateName: string;
  isOpen: boolean;
  onClose: () => void;
  onInfoComplete: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface InfoStatus {
  körkort: boolean;
  arbetserfarenhet: boolean;
  tillgänglighet: boolean;
  svenska: boolean;
}

export default function LowisaChatModal({
  applicationId,
  candidateName,
  isOpen,
  onClose,
  onInfoComplete
}: LowisaChatModalProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [completionStatus, setCompletionStatus] = useState({
    isComplete: false,
    completedAreas: 0,
    totalAreas: 4,
    completionRate: 0,
    missing: [] as string[]
  });
  const [infoStatus, setInfoStatus] = useState<InfoStatus>({
    körkort: false,
    arbetserfarenhet: false,
    tillgänglighet: false,
    svenska: false
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      initializeChat();
    }
  }, [isOpen, applicationId]);

  const initializeChat = async () => {
    try {
      const welcomeMessage = await LowisaAssistant.initializeConversation(applicationId);
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const lowisaResponse = await LowisaAssistant.handleCandidateMessage(
        applicationId, 
        inputMessage
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: lowisaResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Analyze completion status
      const status = await LowisaAssistant.analyzeInformationCompleteness(applicationId);
      setCompletionStatus(status);
      
      // Update info status indicators
      const newInfoStatus = {
        körkort: !status.missing.includes('körkort'),
        arbetserfarenhet: !status.missing.includes('arbetserfarenhet'),
        tillgänglighet: !status.missing.includes('tillgänglighet'),
        svenska: !status.missing.includes('svenska')
      };
      setInfoStatus(newInfoStatus);

      if (status.isComplete) {
        onInfoComplete();
        toast({
          title: '✅ Information Complete!',
          description: 'Candidate has been sent the Typeform link',
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Message failed',
        description: 'Could not send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getInfoStatusIcon = (completed: boolean) => {
    return completed ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <Clock className="h-4 w-4 text-gray-400" />
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <div className="flex h-full">
          {/* Chat Section */}
          <div className="flex-1 flex flex-col">
            <DialogHeader className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">Lowisa AI Assistant</DialogTitle>
                    <p className="text-sm text-gray-600">Chat with {candidateName}</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              </div>
            </DialogHeader>

            {/* Messages Area */}
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-5 w-5 text-purple-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-[#002A5C] text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="px-6 py-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-[#002A5C] hover:bg-[#001a3d]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="w-80 bg-gray-50 p-6 border-l">
            <h3 className="font-semibold mb-4">Information Gathering</h3>
            
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Completion Progress</span>
                <span className="font-medium">{completionStatus.completionRate}%</span>
              </div>
              <Progress value={completionStatus.completionRate} className="h-2" />
              <p className="text-xs text-gray-600 mt-1">
                {completionStatus.completedAreas} of {completionStatus.totalAreas} areas complete
              </p>
            </div>

            {/* Info Status */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-2">
                  {getInfoStatusIcon(infoStatus.körkort)}
                  <span className="text-sm">Körkort</span>
                </div>
                {infoStatus.körkort && (
                  <Badge variant="secondary" className="text-xs">Collected</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-2">
                  {getInfoStatusIcon(infoStatus.arbetserfarenhet)}
                  <span className="text-sm">Arbetserfarenhet</span>
                </div>
                {infoStatus.arbetserfarenhet && (
                  <Badge variant="secondary" className="text-xs">Collected</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-2">
                  {getInfoStatusIcon(infoStatus.tillgänglighet)}
                  <span className="text-sm">Tillgänglighet</span>
                </div>
                {infoStatus.tillgänglighet && (
                  <Badge variant="secondary" className="text-xs">Collected</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-2">
                  {getInfoStatusIcon(infoStatus.svenska)}
                  <span className="text-sm">Svenska språkkunskaper</span>
                </div>
                {infoStatus.svenska && (
                  <Badge variant="secondary" className="text-xs">Collected</Badge>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <Card className="p-4">
              <h4 className="text-sm font-medium mb-2">Next Steps</h4>
              {completionStatus.isComplete ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">All information collected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Typeform link sent</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Lowisa is collecting information about:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {completionStatus.missing.map((item) => (
                      <li key={item} className="text-xs">
                        {item === 'körkort' && 'Driver\'s license status'}
                        {item === 'arbetserfarenhet' && 'Work experience'}
                        {item === 'tillgänglighet' && 'Availability'}
                        {item === 'svenska' && 'Swedish language skills'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {/* AI Tips */}
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">AI Assistant Tips</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Lowisa adapts to the candidate's language level</li>
                <li>• Conversations are analyzed in real-time</li>
                <li>• Typeform link sent automatically when complete</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}