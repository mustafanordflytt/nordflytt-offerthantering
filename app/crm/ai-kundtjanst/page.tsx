'use client';

// =============================================================================
// NORDFLYTT CRM - AI KUNDTJÄNST DASHBOARD
// Revolutionary customer service monitoring with business intelligence
// =============================================================================

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues
const EnhancedLiveChatWidget = dynamic(
  () => import('@/components/ai/EnhancedLiveChatWidget'),
  { ssr: false }
);

const AICustomerServiceDashboard = dynamic(
  () => import('@/components/ai/AICustomerServiceDashboard'),
  { ssr: false, loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded-lg" /> }
);

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  MessageSquare, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap,
  Target,
  Activity,
  Phone,
  Mail,
  MessageCircle,
  BarChart3,
  Eye,
  Settings,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  Globe,
  Shield
} from 'lucide-react';

interface ActiveChat {
  id: number;
  customer_name: string;
  channel: string;
  duration: string;
  messages_count: number;
  ai_confidence: number;
  revenue_potential: number;
  last_message: string;
  is_existing_customer: boolean;
  systems_accessed: string[];
  customer_intelligence: {
    lifetime_value: number;
    churn_risk: number;
    avg_satisfaction: number;
  };
  status: 'active' | 'waiting' | 'escalated';
  escalation_risk: number;
}

interface SystemStatus {
  aiPhasesStatus: string;
  financialStatus: string;
  staffAppStatus: string;
  dailyRevenue: number;
  activeChatCount: number;
  totalConversationsToday: number;
  averageResponseTime: number;
  systemHealth: number;
}

interface RevenueMetrics {
  daily_revenue: number;
  upsells_count: number;
  cost_savings: number;
  conversion_rate: number;
  attribution_by_channel: any[];
  top_conversations: any[];
}

export default function AIKundtjanstPage() {
  const [showLegacyDashboard, setShowLegacyDashboard] = useState(false);
  const [showChatDemo, setShowChatDemo] = useState(false);
  
  // Legacy state (kept for backward compatibility)
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<ActiveChat | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    aiPhasesStatus: 'Online',
    financialStatus: 'Online', 
    staffAppStatus: 'Online',
    dailyRevenue: 24500,
    activeChatCount: 0,
    totalConversationsToday: 47,
    averageResponseTime: 850,
    systemHealth: 0.97
  });
  const [revenueData, setRevenueData] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    try {
      // Load active conversations
      const chatsResponse = await fetch('/api/chat/active-conversations');
      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json();
        setActiveChats(chatsData.conversations || []);
        setSystemStatus(prev => ({
          ...prev,
          activeChatCount: chatsData.conversations?.length || 0
        }));
      }

      // Load revenue data
      const revenueResponse = await fetch('/api/chat/revenue/attribution');
      if (revenueResponse.ok) {
        const revenue = await revenueResponse.json();
        setRevenueData(revenue);
        setSystemStatus(prev => ({
          ...prev,
          dailyRevenue: revenue.daily_revenue || prev.dailyRevenue
        }));
      }

      // Load system health
      const healthResponse = await fetch('/api/chat/systems/health');
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        setSystemStatus(prev => ({
          ...prev,
          ...health.status
        }));
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const handleChatSelect = (chat: ActiveChat) => {
    setSelectedChat(chat);
  };

  const handleEscalateChat = async (chatId: number) => {
    try {
      await fetch(`/api/chat/escalate/${chatId}`, { method: 'POST' });
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to escalate chat:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            AI Kundtjänst - Maja från Nordflytt
            <Badge variant="default" className="ml-3 bg-green-600">
              <Globe className="h-3 w-3 mr-1" />
              LIVE PRODUCTION
            </Badge>
          </h1>
          <p className="text-gray-600">
            Integrerad med Custom GPT via production API på https://api.nordflytt.se
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowChatDemo(!showChatDemo)}
            className="flex items-center space-x-2"
          >
            <Bot className="h-4 w-4" />
            <span>{showChatDemo ? 'Dölj' : 'Visa'} Chat Demo</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLegacyDashboard(!showLegacyDashboard)}
            className="flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>{showLegacyDashboard ? 'Ny' : 'Legacy'} Dashboard</span>
          </Button>
        </div>
      </div>

      {/* Show either new production dashboard or legacy dashboard */}
      {!showLegacyDashboard ? (
        <AICustomerServiceDashboard />
      ) : (
        <>
          {/* Legacy System Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            {/* System Health */}
            <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center">
                  <Bot className="h-5 w-5 mr-2" />
                  AI System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm opacity-80">Phase 1-5 AI</div>
                    <div className="text-xl font-bold text-green-300">
                      {systemStatus.aiPhasesStatus} ✅
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm opacity-80">Financial Module</div>
                    <div className="text-xl font-bold text-green-300">
                      {systemStatus.financialStatus} ✅
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm opacity-80">Staff App GPS</div>
                    <div className="text-xl font-bold text-green-300">
                      {systemStatus.staffAppStatus} ✅
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

        {/* Active Conversations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Chattar</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {systemStatus.activeChatCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStatus.totalConversationsToday} totalt idag
            </p>
            <div className="mt-2">
              <div className="text-xs text-gray-600">Genomsnittlig svarstid</div>
              <div className="text-sm font-semibold">{systemStatus.averageResponseTime}ms</div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dagens Intäkter</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {systemStatus.dailyRevenue.toLocaleString()} kr
            </div>
            <p className="text-xs text-muted-foreground">
              Genererat av AI-chatbot
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">+18% vs igår</span>
            </div>
          </CardContent>
        </Card>

        {/* AI Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Prestanda</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(systemStatus.systemHealth * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Automatisk hantering
            </p>
            <div className="mt-2">
              <Progress value={systemStatus.systemHealth * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Cost Savings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kostnadsbesparingar</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {revenueData?.cost_savings?.toLocaleString() || '7,850'} kr
            </div>
            <p className="text-xs text-muted-foreground">
              vs mänskliga agenter
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <Zap className="h-3 w-3 text-orange-600" />
              <span className="text-xs text-orange-600">67% effektivare</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="live" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Chattar
            {systemStatus.activeChatCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {systemStatus.activeChatCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue Impact
            <Badge variant="outline" className="ml-1 text-green-600 border-green-600">
              +{systemStatus.dailyRevenue.toLocaleString()}kr
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            AI Performance
            <Badge variant="outline" className="ml-1">
              {Math.round(systemStatus.systemHealth * 100)}%
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Customer Intelligence
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Integration
          </TabsTrigger>
        </TabsList>

        {/* Live Chat Monitor */}
        <TabsContent value="live">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Active Conversations List */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                Aktiva Chattar ({activeChats.length})
                <span className="text-sm text-gray-500 ml-2">
                  Revenue potential: {activeChats.reduce((sum, chat) => sum + (chat.revenue_potential || 0), 0).toLocaleString()} kr
                </span>
              </h3>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {activeChats.length === 0 ? (
                  <Card className="p-6 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-700 mb-2">Inga aktiva chattar</h4>
                    <p className="text-gray-500">Alla kunder är för tillfället nöjda! 🎉</p>
                  </Card>
                ) : (
                  activeChats.map(chat => (
                    <EnhancedChatPreviewCard 
                      key={chat.id}
                      chat={chat}
                      isSelected={selectedChat?.id === chat.id}
                      onClick={() => handleChatSelect(chat)}
                      onEscalate={() => handleEscalateChat(chat.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Selected Conversation Detail */}
            <div className="lg:col-span-2">
              {selectedChat ? (
                <CustomerContextPanel 
                  chat={selectedChat}
                  systemStatus={systemStatus}
                />
              ) : (
                <Card className="p-6 text-center h-[600px] flex items-center justify-center">
                  <div>
                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-700 mb-2">Välj en chatt</h4>
                    <p className="text-gray-500">Klicka på en aktiv chatt för att se detaljer</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Revenue Impact Dashboard */}
        <TabsContent value="revenue">
          <RevenueImpactDashboard revenueData={revenueData} />
        </TabsContent>

        {/* AI Performance Dashboard */}
        <TabsContent value="performance">
          <AIPerformanceDashboard systemStatus={systemStatus} />
        </TabsContent>

        {/* Customer Intelligence Dashboard */}
        <TabsContent value="intelligence">
          <CustomerIntelligenceDashboard />
        </TabsContent>

        {/* System Integration Status */}
        <TabsContent value="integration">
          <SystemIntegrationStatus systemStatus={systemStatus} />
        </TabsContent>
      </Tabs>
        </>
      )}
      
      {/* Enhanced Live Chat Widget Demo */}
      {showChatDemo && <EnhancedLiveChatWidget />}
    </div>
  );
}

// =============================================================================
// ENHANCED CHAT PREVIEW CARD
// =============================================================================

interface ChatPreviewProps {
  chat: ActiveChat;
  isSelected: boolean;
  onClick: () => void;
  onEscalate: () => void;
}

const EnhancedChatPreviewCard = ({ chat, isSelected, onClick, onEscalate }: ChatPreviewProps) => (
  <Card 
    className={`p-4 cursor-pointer transition-all duration-200 ${
      isSelected 
        ? 'border-blue-500 shadow-md bg-blue-50' 
        : 'border-gray-200 hover:shadow-md hover:border-gray-300'
    } ${chat.status === 'escalated' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500'}`}
    onClick={onClick}
  >
    <div className="flex justify-between items-start mb-3">
      <div>
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-gray-900">
            {chat.customer_name || 'Okänd kund'}
          </h4>
          {chat.is_existing_customer && (
            <Badge variant="secondary" className="text-xs">
              Befintlig kund
            </Badge>
          )}
          {chat.status === 'escalated' && (
            <Badge variant="destructive" className="text-xs">
              Eskalerad
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
          <span className="flex items-center">
            {chat.channel === 'whatsapp' && <MessageCircle className="h-3 w-3 mr-1" />}
            {chat.channel === 'email' && <Mail className="h-3 w-3 mr-1" />}
            {chat.channel === 'phone' && <Phone className="h-3 w-3 mr-1" />}
            {chat.channel === 'website' && <MessageSquare className="h-3 w-3 mr-1" />}
            {chat.channel}
          </span>
          <span className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {chat.duration}
          </span>
          <span>{chat.messages_count} meddelanden</span>
        </div>
      </div>
      
      <div className="text-right">
        <div className="flex items-center space-x-2 mb-1">
          <Badge className={`text-xs ${
            chat.ai_confidence > 0.9 ? 'bg-green-100 text-green-800' :
            chat.ai_confidence > 0.7 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            AI: {Math.round(chat.ai_confidence * 100)}%
          </Badge>
          
          {chat.escalation_risk > 0.7 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Risk
            </Badge>
          )}
        </div>
        
        {chat.revenue_potential > 0 && (
          <div className="text-sm font-bold text-green-600">
            💰 {chat.revenue_potential.toLocaleString()} kr
          </div>
        )}
      </div>
    </div>
    
    <p className="text-sm text-gray-700 mb-3 line-clamp-2">{chat.last_message}</p>
    
    {/* System Integration Badges */}
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-1">
        {chat.systems_accessed.includes('phase1-5') && (
          <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
            Phase 1-5
          </Badge>
        )}
        {chat.systems_accessed.includes('financial') && (
          <Badge variant="outline" className="text-xs px-2 py-1 bg-purple-50 text-purple-700 border-purple-200">
            Financial
          </Badge>
        )}
        {chat.systems_accessed.includes('staff_app') && (
          <Badge variant="outline" className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 border-indigo-200">
            Staff App
          </Badge>
        )}
      </div>
      
      {chat.status !== 'escalated' && chat.escalation_risk > 0.7 && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={(e) => {
            e.stopPropagation();
            onEscalate();
          }}
          className="text-xs"
        >
          Eskalera
        </Button>
      )}
    </div>
    
    {/* Customer Intelligence Preview */}
    {chat.customer_intelligence && (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">CLV:</span> {chat.customer_intelligence.lifetime_value.toLocaleString()}kr
          </div>
          <div>
            <span className="font-medium">Churn Risk:</span> {Math.round(chat.customer_intelligence.churn_risk * 100)}%
          </div>
          <div>
            <span className="font-medium">Satisfaction:</span> {chat.customer_intelligence.avg_satisfaction}/5
          </div>
        </div>
      </div>
    )}
  </Card>
);

// =============================================================================
// CUSTOMER CONTEXT PANEL
// =============================================================================

interface CustomerContextProps {
  chat: ActiveChat;
  systemStatus: SystemStatus;
}

const CustomerContextPanel = ({ chat, systemStatus }: CustomerContextProps) => (
  <Card className="h-[600px] overflow-y-auto">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span>{chat.customer_name}</span>
        <Badge className={`${
          chat.ai_confidence > 0.9 ? 'bg-green-100 text-green-800' :
          chat.ai_confidence > 0.7 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          AI Confidence: {Math.round(chat.ai_confidence * 100)}%
        </Badge>
      </CardTitle>
      <CardDescription>
        {chat.channel} • {chat.duration} • {chat.messages_count} meddelanden
      </CardDescription>
    </CardHeader>
    
    <CardContent className="space-y-4">
      {/* Revenue Opportunity */}
      {chat.revenue_potential > 0 && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-800 mb-2">💰 Revenue Opportunity</h4>
          <p className="text-green-700 text-sm">
            {chat.revenue_potential.toLocaleString()} kr potential revenue identified
          </p>
        </div>
      )}

      {/* Customer Intelligence */}
      {chat.customer_intelligence && (
        <div>
          <h4 className="font-medium mb-2">📊 Customer Intelligence</h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm">Customer Lifetime Value</span>
              <span className="font-medium">{chat.customer_intelligence.lifetime_value.toLocaleString()} kr</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm">Churn Risk</span>
              <div className="flex items-center space-x-2">
                <Progress value={chat.customer_intelligence.churn_risk * 100} className="w-16 h-2" />
                <span className="font-medium text-sm">{Math.round(chat.customer_intelligence.churn_risk * 100)}%</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm">Avg Satisfaction</span>
              <span className="font-medium">{chat.customer_intelligence.avg_satisfaction}/5 ⭐</span>
            </div>
          </div>
        </div>
      )}

      {/* System Integration Status */}
      <div>
        <h4 className="font-medium mb-2">🔗 System Integration</h4>
        <div className="space-y-2">
          {['Phase 1-5 AI', 'Financial Module', 'Staff App', 'CRM Core'].map((system, index) => {
            const isAccessed = chat.systems_accessed.includes(system.toLowerCase().replace(/\s+/g, '_'));
            return (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{system}</span>
                {isAccessed ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-gray-300" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Last Message */}
      <div>
        <h4 className="font-medium mb-2">💬 Senaste Meddelande</h4>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{chat.last_message}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="sm" className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            View Full Chat
          </Button>
          <Button variant="default" size="sm" className="w-full">
            <MessageSquare className="h-4 w-4 mr-2" />
            Join Chat
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

// =============================================================================
// SUB-DASHBOARD COMPONENTS (STUBS)
// =============================================================================

const RevenueImpactDashboard = ({ revenueData }: { revenueData: RevenueMetrics | null }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Revenue Impact Dashboard</h2>
    <p className="text-gray-600">Revenue attribution and business impact metrics coming soon...</p>
  </div>
);

const AIPerformanceDashboard = ({ systemStatus }: { systemStatus: SystemStatus }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">AI Performance Dashboard</h2>
    <p className="text-gray-600">AI performance metrics and optimization insights coming soon...</p>
  </div>
);

const CustomerIntelligenceDashboard = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Customer Intelligence Dashboard</h2>
    <p className="text-gray-600">Advanced customer insights and behavioral analytics coming soon...</p>
  </div>
);

const SystemIntegrationStatus = ({ systemStatus }: { systemStatus: SystemStatus }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">System Integration Status</h2>
    <p className="text-gray-600">Real-time system health and integration monitoring coming soon...</p>
  </div>
);