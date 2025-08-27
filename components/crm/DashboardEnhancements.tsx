'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  AlertTriangle,
  Clock,
  Users,
  Target,
  Activity,
  Mail,
  MessageSquare,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Enhanced Metric Card with trend and additional info
export function EnhancedMetricCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color = "bg-gradient-to-r from-blue-500 to-blue-600",
  additionalInfo,
  onClick
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  color?: string;
  additionalInfo?: Record<string, string>;
  onClick?: () => void;
}) {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden cursor-pointer transition-all hover:shadow-lg",
        onClick && "hover:scale-105"
      )}
      onClick={onClick}
    >
      <div className={cn("absolute inset-0 opacity-10", color)} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-gray-600">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        
        {trend && trendValue && (
          <div className="flex items-center mt-2">
            {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600 mr-1" />}
            {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600 mr-1" />}
            <span className={cn(
              "text-sm font-medium",
              trend === 'up' && "text-green-600",
              trend === 'down' && "text-red-600",
              trend === 'neutral' && "text-gray-600"
            )}>
              {trendValue}
            </span>
          </div>
        )}
        
        {additionalInfo && (
          <div className="mt-3 space-y-1 border-t pt-3">
            {Object.entries(additionalInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{key}:</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// AI Performance Section
export function AIPerformanceSection({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <EnhancedMetricCard
        title="AI Kundtjänst"
        value={data?.conversations?.today || 47}
        subtitle="Maja konversationer idag"
        trend="up"
        trendValue="+23%"
        icon={<Bot className="h-4 w-4" />}
        color="bg-gradient-to-r from-purple-500 to-pink-500"
      />
      
      <EnhancedMetricCard
        title="Email Automation"
        value={`${data?.emailAutomation || 94}%`}
        subtitle="Auto-hanterade"
        trend="up"
        trendValue="+8%"
        icon={<Mail className="h-4 w-4" />}
        color="bg-gradient-to-r from-blue-500 to-cyan-500"
      />
      
      <EnhancedMetricCard
        title="Ärenden Skapade"
        value={data?.ticketsCreated || 12}
        subtitle="Av Maja idag"
        trend="up"
        trendValue="+15%"
        icon={<MessageSquare className="h-4 w-4" />}
        color="bg-gradient-to-r from-green-500 to-teal-500"
      />
      
      <EnhancedMetricCard
        title="AI Conversion"
        value={`${data?.aiConversion || 73}%`}
        subtitle="Chat → Bokning"
        trend="up"
        trendValue="+5%"
        icon={<Target className="h-4 w-4" />}
        color="bg-gradient-to-r from-orange-500 to-red-500"
      />
    </div>
  );
}

// Enhanced Financial Section
export function EnhancedFinancialSection({ data }: { data: any }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  return (
    <Card className="mt-6">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Finansiell Översikt
          </CardTitle>
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Betald denna månad</span>
                <CreditCard className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {data?.paidThisMonth || "2,722,000"} kr
              </p>
              <p className="text-xs text-green-600 mt-1">98% av fakturerat</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-700">Utestående fakturor</span>
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-900 mt-2">
                {data?.outstanding || "125,000"} kr
              </p>
              <p className="text-xs text-orange-600 mt-1">8 fakturor</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-700">Försenade betalningar</span>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-900 mt-2">
                {data?.overdue || "23,000"} kr
              </p>
              <p className="text-xs text-red-600 mt-1">2 fakturor (30+ dagar)</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-700">RUT-besparingar genererade</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {data?.rutSavings || "340,000"} kr
                </p>
              </div>
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={68} className="mt-2" />
            <p className="text-xs text-blue-600 mt-1">68% av månatlig målsättning</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Team & Operations Section
export function TeamOperationsSection({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Tillgängliga</span>
                <span className="font-bold">{data?.available || 5} personer</span>
              </div>
              <Progress value={62} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Upptagna</span>
                <span className="font-bold">{data?.busy || 3} personer</span>
              </div>
              <Progress value={38} className="h-2" />
            </div>
            
            <div className="pt-3 border-t">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Effektivitet</span>
                <span className="text-lg font-bold text-green-600">
                  {data?.efficiency || "87%"}
                </span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-muted-foreground">Dagens jobb</span>
                <span className="text-lg font-bold">{data?.todayJobs || 12}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Job Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Genomsnittlig tid</span>
              <span className="text-lg font-bold">{data?.avgDuration || "3.2h"}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">AI Estimat</span>
              <span className="text-lg font-bold">{data?.aiEstimated || "3.1h"}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Träffsäkerhet</span>
              <span className="text-lg font-bold text-green-600">
                {data?.accuracy || "97%"}
              </span>
            </div>
            
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">I tid</span>
                <div className="flex items-center">
                  <span className="text-lg font-bold text-blue-600 mr-2">
                    {data?.onTimeRate || "94%"}
                  </span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Live Status Indicator
export function LiveStatusIndicator({ status = 'operational' }: { status?: 'operational' | 'warning' | 'critical' }) {
  const statusConfig = {
    operational: { color: 'bg-green-500', text: 'Alla system operativa', pulse: true },
    warning: { color: 'bg-yellow-500', text: 'Vissa förseningar', pulse: true },
    critical: { color: 'bg-red-500', text: 'Kritiska problem', pulse: true }
  };
  
  const config = statusConfig[status];
  
  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <div className={cn("w-3 h-3 rounded-full", config.color)} />
        {config.pulse && (
          <div className={cn("absolute inset-0 w-3 h-3 rounded-full animate-ping", config.color)} />
        )}
      </div>
      <span className="text-sm text-muted-foreground">{config.text}</span>
    </div>
  );
}