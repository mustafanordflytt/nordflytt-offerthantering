'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone,
  Fingerprint,
  Zap,
  Activity,
  TrendingUp,
  DollarSign,
  PauseCircle,
  Play,
  RotateCw,
  Move,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Vibrate,
  Eye,
  EyeOff,
  Target,
  Shield,
  Bell,
  Settings,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';

interface Gesture {
  name: string;
  icon: React.ReactNode;
  description: string;
  action: string;
  enabled: boolean;
  sensitivity: number;
  hapticFeedback: 'light' | 'medium' | 'heavy';
  sound: boolean;
}

interface GestureEvent {
  gesture: string;
  timestamp: Date;
  result: string;
  metrics?: {
    before: number;
    after: number;
    change: number;
  };
}

interface QuickAction {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

const AdvancedMobileGestures: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [lastGesture, setLastGesture] = useState<string>('');
  const [gestureHistory, setGestureHistory] = useState<GestureEvent[]>([]);
  
  // Touch tracking
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [gestures] = useState<Gesture[]>([
    {
      name: 'Dubbeltryck',
      icon: <Fingerprint className="h-5 w-5" />,
      description: 'Visa dagens profit i stor vy',
      action: 'show_profit_overlay',
      enabled: true,
      sensitivity: 300, // ms between taps
      hapticFeedback: 'medium',
      sound: true
    },
    {
      name: 'Långtryck',
      icon: <PauseCircle className="h-5 w-5" />,
      description: 'Nödstoppa alla kampanjer',
      action: 'emergency_pause_all',
      enabled: true,
      sensitivity: 1000, // ms hold time
      hapticFeedback: 'heavy',
      sound: true
    },
    {
      name: 'Svep upp',
      icon: <ChevronUp className="h-5 w-5" />,
      description: 'Skala upp vinnande kampanjer',
      action: 'scale_winners',
      enabled: true,
      sensitivity: 50, // pixels
      hapticFeedback: 'light',
      sound: false
    },
    {
      name: 'Svep ner',
      icon: <ChevronDown className="h-5 w-5" />,
      description: 'Pausa förlorande kampanjer',
      action: 'pause_losers',
      enabled: true,
      sensitivity: 50,
      hapticFeedback: 'light',
      sound: false
    },
    {
      name: 'Svep höger',
      icon: <ChevronRight className="h-5 w-5" />,
      description: 'Nästa dashboard-vy',
      action: 'next_view',
      enabled: true,
      sensitivity: 75,
      hapticFeedback: 'light',
      sound: false
    },
    {
      name: 'Svep vänster',
      icon: <ChevronLeft className="h-5 w-5" />,
      description: 'Föregående dashboard-vy',
      action: 'previous_view',
      enabled: true,
      sensitivity: 75,
      hapticFeedback: 'light',
      sound: false
    },
    {
      name: 'Nyp ut',
      icon: <Maximize2 className="h-5 w-5" />,
      description: 'Zooma in på grafer',
      action: 'zoom_in',
      enabled: true,
      sensitivity: 20,
      hapticFeedback: 'light',
      sound: false
    },
    {
      name: 'Nyp in',
      icon: <Minimize2 className="h-5 w-5" />,
      description: 'Zooma ut från grafer',
      action: 'zoom_out',
      enabled: true,
      sensitivity: 20,
      hapticFeedback: 'light',
      sound: false
    },
    {
      name: 'Skaka',
      icon: <Shield className="h-5 w-5" />,
      description: 'Aktivera fraud protection',
      action: 'activate_protection',
      enabled: true,
      sensitivity: 15, // m/s²
      hapticFeedback: 'heavy',
      sound: true
    },
    {
      name: 'Rotera',
      icon: <RotateCw className="h-5 w-5" />,
      description: 'Uppdatera alla data',
      action: 'refresh_all',
      enabled: true,
      sensitivity: 90, // degrees
      hapticFeedback: 'medium',
      sound: false
    }
  ]);

  const [quickActions] = useState<QuickAction[]>([
    {
      id: 'profit',
      name: 'Dagens profit',
      icon: <DollarSign className="h-6 w-6" />,
      color: 'bg-green-500',
      action: () => simulateGesture('Dubbeltryck', 'show_profit_overlay')
    },
    {
      id: 'pause',
      name: 'Pausa allt',
      icon: <PauseCircle className="h-6 w-6" />,
      color: 'bg-red-500',
      action: () => simulateGesture('Långtryck', 'emergency_pause_all')
    },
    {
      id: 'scale',
      name: 'Skala vinnare',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'bg-blue-500',
      action: () => simulateGesture('Svep upp', 'scale_winners')
    },
    {
      id: 'protect',
      name: 'Aktivera skydd',
      icon: <Shield className="h-6 w-6" />,
      color: 'bg-purple-500',
      action: () => simulateGesture('Skaka', 'activate_protection')
    }
  ]);

  const [currentMetrics] = useState({
    profit: 87450,
    campaigns: 23,
    winners: 15,
    losers: 8,
    fraudBlocked: 47,
    roas: 4.2
  });

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Vibration API helper
  const vibrate = (pattern: number | number[]) => {
    if (hapticEnabled && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // Simulate gesture for demo
  const simulateGesture = (gestureName: string, action: string) => {
    setLastGesture(gestureName);
    
    // Simulate haptic feedback
    const gesture = gestures.find(g => g.name === gestureName);
    if (gesture && hapticEnabled) {
      switch (gesture.hapticFeedback) {
        case 'light': vibrate(10); break;
        case 'medium': vibrate([20, 10, 20]); break;
        case 'heavy': vibrate([50, 30, 50, 30, 50]); break;
      }
    }

    // Create event
    const event: GestureEvent = {
      gesture: gestureName,
      timestamp: new Date(),
      result: getGestureResult(action),
      metrics: getGestureMetrics(action)
    };

    setGestureHistory(prev => [event, ...prev.slice(0, 9)]);
  };

  const getGestureResult = (action: string): string => {
    switch (action) {
      case 'show_profit_overlay': return `Visar profit: ${formatCurrency(currentMetrics.profit)}`;
      case 'emergency_pause_all': return `${currentMetrics.campaigns} kampanjer pausade`;
      case 'scale_winners': return `${currentMetrics.winners} vinnare skalade +25%`;
      case 'pause_losers': return `${currentMetrics.losers} förlorare pausade`;
      case 'activate_protection': return 'Fraud protection aktiverad';
      case 'refresh_all': return 'All data uppdaterad';
      default: return 'Åtgärd genomförd';
    }
  };

  const getGestureMetrics = (action: string) => {
    switch (action) {
      case 'scale_winners':
        return { before: 100000, after: 125000, change: 25 };
      case 'pause_losers':
        return { before: 50000, after: 0, change: -100 };
      default:
        return undefined;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleGestureToggle = (gestureName: string) => {
    // In real implementation, this would update gesture settings
    vibrate(10);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Smartphone className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Advanced Mobile Gestures</CardTitle>
                <CardDescription>
                  Kraftfulla gester för CEO-kontroll på språng
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={gesturesEnabled ? 'default' : 'outline'}
                onClick={() => setGesturesEnabled(!gesturesEnabled)}
              >
                {gesturesEnabled ? (
                  <>
                    <Fingerprint className="h-4 w-4 mr-1" />
                    Gester PÅ
                  </>
                ) : (
                  'Gester AV'
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Settings Bar */}
          <div className="flex items-center gap-4 p-3 bg-white rounded-lg">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={hapticEnabled ? 'default' : 'outline'}
                onClick={() => setHapticEnabled(!hapticEnabled)}
              >
                <Vibrate className="h-4 w-4" />
              </Button>
              <span className="text-sm">Haptik</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={soundEnabled ? 'default' : 'outline'}
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <span className="text-sm">Ljud</span>
            </div>
            <div className="flex-1 text-right">
              {lastGesture && (
                <Badge variant="outline" className="animate-pulse">
                  Senaste: {lastGesture}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions (Mobile Optimized) */}
      {isMobile && (
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              className={`h-24 ${action.color} hover:opacity-90 text-white`}
              onClick={action.action}
            >
              <div className="flex flex-col items-center gap-2">
                {action.icon}
                <span className="text-sm font-medium">{action.name}</span>
              </div>
            </Button>
          ))}
        </div>
      )}

      {/* Gesture List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Move className="h-5 w-5" />
            Tillgängliga gester
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {gestures.map((gesture) => (
              <div 
                key={gesture.name}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {gesture.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold">{gesture.name}</h4>
                      <p className="text-sm text-gray-600">{gesture.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={gesture.enabled ? 'default' : 'outline'}
                    onClick={() => handleGestureToggle(gesture.name)}
                  >
                    {gesture.enabled ? <Check className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 ml-12">
                  <span className="flex items-center gap-1">
                    <Vibrate className="h-3 w-3" />
                    {gesture.hapticFeedback}
                  </span>
                  <span className="flex items-center gap-1">
                    {gesture.sound ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                    {gesture.sound ? 'Med ljud' : 'Tyst'}
                  </span>
                  <span>
                    Känslighet: {gesture.sensitivity}
                    {gesture.name.includes('tryck') ? 'ms' : 
                     gesture.name.includes('Svep') || gesture.name.includes('Nyp') ? 'px' :
                     gesture.name === 'Skaka' ? 'm/s²' :
                     gesture.name === 'Rotera' ? '°' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live metrics (gestkontrollen påverkar dessa)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Dagens profit</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(currentMetrics.profit)}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Aktiva kampanjer</p>
              <p className="text-xl font-bold">{currentMetrics.campaigns}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Vinnare/Förlorare</p>
              <p className="text-xl font-bold">
                <span className="text-green-600">{currentMetrics.winners}</span>
                /
                <span className="text-red-600">{currentMetrics.losers}</span>
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Fraud blockerad</p>
              <p className="text-xl font-bold">{currentMetrics.fraudBlocked}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">ROAS</p>
              <p className="text-xl font-bold">{currentMetrics.roas}x</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Status</p>
              <Badge className="bg-green-100 text-green-800">
                <Activity className="h-3 w-3 mr-1" />
                Optimerar
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gesture History */}
      {gestureHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Gest-historik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gestureHistory.map((event, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{event.gesture}</p>
                    <p className="text-sm text-gray-600">{event.result}</p>
                  </div>
                  <div className="text-right">
                    {event.metrics && (
                      <Badge className={event.metrics.change > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {event.metrics.change > 0 ? '+' : ''}{event.metrics.change}%
                      </Badge>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {event.timestamp.toLocaleTimeString('sv-SE')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile-Only Features Alert */}
      {!isMobile && (
        <Alert className="bg-blue-50 border-blue-200">
          <Smartphone className="h-4 w-4" />
          <AlertDescription>
            <strong>Mobil-endast funktioner:</strong> Öppna denna sida på din mobil för att 
            testa alla gester med äkta touch, accelerometer och haptisk feedback.
          </AlertDescription>
        </Alert>
      )}

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Avancerade inställningar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Gest-känslighet (global)
              </label>
              <div className="flex items-center gap-4">
                <span className="text-sm">Låg</span>
                <input type="range" className="flex-1" min="0" max="100" defaultValue="50" />
                <span className="text-sm">Hög</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Haptisk intensitet
              </label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Lätt</Button>
                <Button size="sm">Medium</Button>
                <Button size="sm" variant="outline">Stark</Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="text-sm">Gesture notifications</span>
              </div>
              <Button size="sm" variant="outline">
                Konfigurera
              </Button>
            </div>

            <Alert className="bg-purple-50 border-purple-200">
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>Pro-tips:</strong> Kombinera gester för kraftfulla makron. 
                T.ex. "Dubbeltryck + Svep upp" = Visa profit OCH skala vinnare samtidigt.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedMobileGestures;