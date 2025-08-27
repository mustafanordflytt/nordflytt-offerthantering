'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic,
  MicOff,
  Volume2,
  Smartphone,
  MessageSquare,
  Zap,
  DollarSign,
  Shield,
  PauseCircle,
  Activity,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Brain,
  Settings,
  Phone
} from 'lucide-react';

interface VoiceCommand {
  swedish: string;
  response: string;
  action: string;
  category: 'profit' | 'protection' | 'control' | 'intelligence';
  icon: React.ReactNode;
}

interface CommandHistory {
  id: string;
  command: string;
  response: string;
  timestamp: Date;
  status: 'success' | 'processing' | 'error';
}

const MobileVoiceCommands: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [isMobileView, setIsMobileView] = useState(false);

  const voiceCommands: VoiceCommand[] = [
    // Profit Queries
    {
      swedish: 'Maja, vad tjänar vi idag?',
      response: '69,150 kronor idag, trend uppåt 23 procent',
      action: 'display_profit_summary',
      category: 'profit',
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      swedish: 'Maja, hur går annonserna?',
      response: 'Google utmärkt, Meta okej, inga hot detekterade',
      action: 'display_platform_status',
      category: 'profit',
      icon: <Activity className="h-5 w-5" />
    },
    // Protection Commands
    {
      swedish: 'Maja, skydda nu',
      response: 'Maximalt skydd aktiverat, övervakar alla hot',
      action: 'activate_max_fraud_protection',
      category: 'protection',
      icon: <Shield className="h-5 w-5" />
    },
    {
      swedish: 'Maja, pausa allt',
      response: 'Alla kampanjer pausade, budget skyddad',
      action: 'emergency_pause_all_campaigns',
      category: 'control',
      icon: <PauseCircle className="h-5 w-5" />
    },
    // Intelligence Commands
    {
      swedish: 'Maja, vad gör konkurrenterna?',
      response: 'MovingStockholm minskade spend, StockholmMove lanserade ny kampanj',
      action: 'display_competitor_intelligence',
      category: 'intelligence',
      icon: <Brain className="h-5 w-5" />
    },
    {
      swedish: 'Maja, optimera nu',
      response: 'Flyttar 15,000 från Meta till Google, förväntar +28,000 profit',
      action: 'execute_optimization',
      category: 'control',
      icon: <Zap className="h-5 w-5" />
    }
  ];

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Request microphone permission
  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setHasPermission(false);
    }
  };

  // Simulate voice recognition
  const startListening = () => {
    if (!hasPermission) {
      requestMicPermission();
      return;
    }

    setIsListening(true);
    
    // Simulate voice command after 2 seconds
    setTimeout(() => {
      const randomCommand = voiceCommands[Math.floor(Math.random() * voiceCommands.length)];
      handleVoiceCommand(randomCommand);
      setIsListening(false);
    }, 2000);
  };

  const handleVoiceCommand = (command: VoiceCommand) => {
    setLastCommand(command.swedish);
    
    const newHistory: CommandHistory = {
      id: Date.now().toString(),
      command: command.swedish,
      response: command.response,
      timestamp: new Date(),
      status: 'processing'
    };
    
    setCommandHistory(prev => [newHistory, ...prev.slice(0, 4)]);
    
    // Simulate processing
    setTimeout(() => {
      setCommandHistory(prev => 
        prev.map(h => h.id === newHistory.id ? { ...h, status: 'success' } : h)
      );
      
      // Speak response
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(command.response);
        utterance.lang = 'sv-SE';
        speechSynthesis.speak(utterance);
      }
    }, 1000);
  };

  const quickCommands = [
    { text: 'Vad tjänar vi?', icon: <DollarSign className="h-4 w-4" /> },
    { text: 'Skydda nu', icon: <Shield className="h-4 w-4" /> },
    { text: 'Pausa allt', icon: <PauseCircle className="h-4 w-4" /> },
    { text: 'Optimera', icon: <Zap className="h-4 w-4" /> }
  ];

  const gestureActions = [
    { gesture: 'Dubbeltryck', action: 'Visa profit stort', icon: '👆👆' },
    { gesture: 'Långtryck', action: 'Nödstoppa kampanjer', icon: '👇' },
    { gesture: 'Skaka', action: 'Aktivera skydd', icon: '📱' },
    { gesture: 'Svep upp', action: 'Skala vinnare', icon: '👆' },
    { gesture: 'Svep ner', action: 'Pausa förlorare', icon: '👇' }
  ];

  return (
    <div className="space-y-6">
      {/* Voice Control Center */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Mic className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Maja - Din AI Röstassistent</CardTitle>
                <CardDescription>
                  Styr PPC med svenska röstkommandon
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {hasPermission ? '🎤 Redo' : '🎤 Behöver tillstånd'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Voice Button */}
          <div className="flex flex-col items-center justify-center py-8">
            <Button
              size="lg"
              className={`rounded-full h-32 w-32 text-2xl transition-all ${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
              onClick={startListening}
            >
              {isListening ? (
                <div className="flex flex-col items-center">
                  <Mic className="h-12 w-12 mb-2" />
                  <span className="text-sm">Lyssnar...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Mic className="h-12 w-12 mb-2" />
                  <span className="text-sm">Tryck & prata</span>
                </div>
              )}
            </Button>
            
            {lastCommand && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">Senaste kommando:</p>
                <p className="text-lg font-semibold mt-1">"{lastCommand}"</p>
              </div>
            )}
          </div>

          {/* Quick Commands */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickCommands.map((cmd, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="h-auto py-3"
                onClick={() => {
                  const command = voiceCommands.find(vc => 
                    vc.swedish.toLowerCase().includes(cmd.text.toLowerCase())
                  );
                  if (command) handleVoiceCommand(command);
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  {cmd.icon}
                  <span className="text-xs">{cmd.text}</span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Command Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Röstkommandon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {voiceCommands.map((cmd, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      cmd.category === 'profit' ? 'bg-green-100' :
                      cmd.category === 'protection' ? 'bg-blue-100' :
                      cmd.category === 'control' ? 'bg-yellow-100' :
                      'bg-purple-100'
                    }`}>
                      {cmd.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">"{cmd.swedish}"</p>
                      <p className="text-xs text-gray-600 mt-1">→ {cmd.response}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Gestkontroller
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gestureActions.map((gesture, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{gesture.icon}</span>
                    <div>
                      <p className="font-medium">{gesture.gesture}</p>
                      <p className="text-sm text-gray-600">{gesture.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Haptic Feedback Info */}
            <Alert className="mt-4 bg-purple-50 border-purple-200">
              <Phone className="h-4 w-4" />
              <AlertDescription>
                <strong>Haptisk feedback:</strong> Känn vibrationer för profit (+), 
                varningar (!) och framgångar (✓)
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Command History */}
      {commandHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Kommandohistorik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {commandHistory.map((history) => (
                <div key={history.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {history.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : history.status === 'processing' ? (
                      <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">"{history.command}"</p>
                      <p className="text-xs text-gray-600">{history.response}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {history.timestamp.toLocaleTimeString('sv-SE')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile CEO Mode Alert */}
      {isMobileView && (
        <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>CEO-läge aktivt!</strong> Optimerat för mobil med stora knappar, 
            röststyrning och gestkontroller. Perfekt för beslut på språng.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default MobileVoiceCommands;