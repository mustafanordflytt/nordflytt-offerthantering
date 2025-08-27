'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Minimize2,
  Maximize2,
  Bot
} from 'lucide-react';
import LowisaChat from './LowisaChat';

interface LowisaRecruitmentWidgetProps {
  trigger?: string;
  initialMessage?: string;
  position?: string;
  onApplicationStart?: (data: any) => void;
}

export default function LowisaRecruitmentWidget({
  trigger = '💼 Vill du jobba hos oss? Chatta med Lowisa!',
  initialMessage = 'Hej! Jag heter Lowisa och hjälper dig med jobbansökan på Nordflytt. Vilket jobb är du intresserad av?',
  position = 'flyttpersonal',
  onApplicationStart
}: LowisaRecruitmentWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateId, setCandidateId] = useState<number | null>(null);

  const handleOpen = async () => {
    setIsOpen(true);
    setIsMinimized(false);

    // Create a temporary candidate record
    if (!candidateId) {
      const tempId = Date.now();
      setCandidateId(tempId);
      
      // In production, create actual candidate record
      // const response = await fetch('/api/recruitment/applications', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     source: 'website_widget',
      //     desired_position: position,
      //     current_stage: 'initial_contact'
      //   })
      // });
      // const data = await response.json();
      // setCandidateId(data.id);
      
      if (onApplicationStart) {
        onApplicationStart({
          id: tempId,
          source: 'website_widget',
          timestamp: new Date()
        });
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleOpen}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full py-6 px-8 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-lg font-medium">{trigger}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80' : 'w-96'
    }`}>
      <Card className="shadow-2xl border-0 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Lowisa - Rekryteringsassistent</h3>
              <p className="text-sm text-blue-100">Nordflytt</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMinimize}
              className="text-white hover:bg-white/20"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chat content */}
        {!isMinimized && (
          <div className="h-[600px]">
            <LowisaChat
              candidateId={candidateId || 0}
              candidateName={candidateName || 'Besökare'}
              position={position}
              initialContext={{
                source: 'website_widget',
                timestamp: new Date()
              }}
              onInformationComplete={(id) => {
                // Show success message
                console.log('Information complete for candidate:', id);
              }}
            />
          </div>
        )}

        {/* Minimized state */}
        {isMinimized && (
          <div className="p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600">Lowisa är här för att hjälpa</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Online
              </Badge>
            </div>
          </div>
        )}
      </Card>

      {/* Mobile optimized version */}
      <style jsx>{`
        @media (max-width: 640px) {
          .fixed {
            bottom: 0;
            right: 0;
            left: 0;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}