'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell,
  X,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Zap,
  CheckCircle,
  Clock,
  ChevronRight,
  BellOff,
  Settings,
  Filter
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'critical' | 'opportunity' | 'success' | 'info';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
  read: boolean;
  impact?: string;
  autoAction?: {
    enabled: boolean;
    executesIn?: number; // seconds
  };
}

interface Props {
  position?: 'top-right' | 'bottom-right' | 'top-center';
  maxNotifications?: number;
}

const SmartNotifications: React.FC<Props> = ({ 
  position = 'top-right',
  maxNotifications = 3 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'critical',
      title: 'Position tappad för "Flyttfirma Stockholm"',
      description: 'Från #3 till #4. Konkurrent har förbättrat sitt innehåll.',
      action: {
        label: 'Återta position',
        onClick: () => console.log('Taking action')
      },
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      impact: '-125 000 kr/mån',
      autoAction: {
        enabled: true,
        executesIn: 300 // 5 minutes
      }
    },
    {
      id: '2',
      type: 'opportunity',
      title: 'Vårkampanj kan starta nu',
      description: '340% ökning i "vårstädning flytt" sökningar senaste veckan.',
      action: {
        label: 'Aktivera kampanj',
        onClick: () => console.log('Activating campaign')
      },
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: false,
      impact: '+85 000 kr'
    },
    {
      id: '3',
      type: 'success',
      title: 'Recensioner besvarade',
      description: 'AI har svarat på 5 recensioner. Genomsnittlig rating ökad till 4.8.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      impact: '+35 000 kr/mån'
    }
  ]);

  const [showAll, setShowAll] = useState(false);
  const [mutedTypes, setMutedTypes] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<Record<string, number>>({});

  // Auto-action countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => prev.map(notif => {
        if (notif.autoAction?.enabled && notif.autoAction.executesIn && notif.autoAction.executesIn > 0) {
          const newTime = notif.autoAction.executesIn - 1;
          
          if (newTime === 0) {
            // Execute auto action
            handleAutoAction(notif);
            return { ...notif, autoAction: { ...notif.autoAction, executesIn: 0 } };
          }
          
          return { ...notif, autoAction: { ...notif.autoAction, executesIn: newTime } };
        }
        return notif;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAutoAction = (notification: Notification) => {
    console.log(`Auto-executing action for: ${notification.title}`);
    // In real app, this would trigger the actual action
    addNotification({
      type: 'info',
      title: 'AI har agerat automatiskt',
      description: `Åtgärd för "${notification.title}" har genomförts.`,
      timestamp: new Date(),
      read: false
    });
  };

  const addNotification = (notif: Omit<Notification, 'id'>) => {
    setNotifications(prev => [{
      ...notif,
      id: Date.now().toString()
    }, ...prev]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'opportunity': return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'info': default: return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'opportunity': return 'bg-green-50 border-green-200';
      case 'success': return 'bg-blue-50 border-blue-200';
      case 'info': default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return 'Just nu';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m sedan`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h sedan`;
    return `${Math.floor(diff / 86400000)}d sedan`;
  };

  const visibleNotifications = showAll 
    ? notifications 
    : notifications.slice(0, maxNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <>
      {/* Notification Badge */}
      <div className="fixed top-4 right-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Notifications Container */}
      {showAll && (
        <Card className={`fixed ${positionClasses[position]} w-96 max-h-[600px] shadow-2xl z-50 overflow-hidden`}>
          <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Smarta notiser
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMutedTypes([])}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                >
                  <Filter className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(false)}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[500px]">
            {visibleNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellOff className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Inga nya notiser</p>
                <p className="text-sm mt-1">AI övervakar och meddelar dig</p>
              </div>
            ) : (
              <div className="p-2">
                {visibleNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`mb-2 rounded-lg border p-3 transition-all hover:shadow-md ${
                      getTypeColor(notification.type)
                    } ${notification.read ? 'opacity-75' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                            className="h-6 w-6 p-0 -mt-1 -mr-1"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{notification.description}</p>
                        
                        {notification.impact && (
                          <div className="flex items-center gap-2 mt-2">
                            <DollarSign className="h-3 w-3 text-gray-500" />
                            <span className={`text-xs font-medium ${
                              notification.impact.includes('+') ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {notification.impact}
                            </span>
                          </div>
                        )}

                        {notification.autoAction?.enabled && notification.autoAction.executesIn && notification.autoAction.executesIn > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3 w-3 text-orange-500" />
                            <span className="text-xs text-orange-600">
                              AI agerar om {Math.floor(notification.autoAction.executesIn / 60)}:{(notification.autoAction.executesIn % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.timestamp)}
                          </span>
                          {notification.action && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={(e) => {
                                e.stopPropagation();
                                notification.action?.onClick();
                                dismissNotification(notification.id);
                              }}
                              className="h-7 text-xs"
                            >
                              {notification.action.label}
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > maxNotifications && !showAll && (
            <div className="p-3 border-t bg-gray-50 text-center">
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowAll(true)}
                className="text-xs"
              >
                Se alla {notifications.length} notiser
              </Button>
            </div>
          )}
        </Card>
      )}
    </>
  );
};

export default SmartNotifications;