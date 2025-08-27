'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Eye,
  Activity,
  ArrowUp,
  ArrowDown,
  Shield,
  Swords
} from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  marketShare: number;
  visibility: number;
  trend: 'up' | 'down' | 'stable';
  recentActions: string[];
  threat: 'high' | 'medium' | 'low';
  weaknesses: string[];
}

const LiveCompetitorTracker: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([
    {
      id: '1',
      name: 'Stockholm Flyttar AB',
      marketShare: 18.5,
      visibility: 72,
      trend: 'up',
      recentActions: [
        'Ökade Google Ads budget med 40%',
        'Lanserade ny hemsida',
        'Startade TikTok-kampanj'
      ],
      threat: 'high',
      weaknesses: [
        'Saknar recensioner på Trustpilot',
        'Ingen helgservice',
        'Långsam hemsida (4.2s laddtid)'
      ]
    },
    {
      id: '2',
      name: 'Flytta Enkelt',
      marketShare: 12.3,
      visibility: 58,
      trend: 'down',
      recentActions: [
        'Tappade 5 positioner för "flyttfirma stockholm"',
        'Pausade Facebook-annonsering'
      ],
      threat: 'low',
      weaknesses: [
        'Förlorade 2 nyckelmedarbetare',
        'Dålig mobilanpassning',
        'Få lokala sidor'
      ]
    },
    {
      id: '3',
      name: 'Express Flytt',
      marketShare: 9.8,
      visibility: 45,
      trend: 'stable',
      recentActions: [
        'Fokuserar på Södermalm',
        'Ny priskampanj -15%'
      ],
      threat: 'medium',
      weaknesses: [
        'Begränsad fordonsflotta',
        'Inga företagstjänster',
        'Svag SEO-strategi'
      ]
    }
  ]);

  const [liveActivity, setLiveActivity] = useState<string[]>([
    '14:32 - Stockholm Flyttar AB publicerade nytt blogginlägg',
    '13:45 - Flytta Enkelt sänkte priser med 10%',
    '11:20 - Express Flytt fick negativ recension (2 stjärnor)'
  ]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      const activities = [
        'Ny Google Ads-kampanj upptäckt',
        'Konkurrent uppdaterade priser',
        'Position ändrad för nyckelord',
        'Ny recension publicerad'
      ];
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      const time = new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
      
      setLiveActivity(prev => [`${time} - ${randomActivity}`, ...prev.slice(0, 2)]);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getThreatColor = (threat: string) => {
    switch (threat) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="h-5 w-5" />
          Live konkurrentbevakning
        </CardTitle>
        <CardDescription>
          Realtidsövervakning av era huvudkonkurrenter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live Activity Feed */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-green-500 animate-pulse" />
            <span className="text-sm font-medium">Live-aktivitet</span>
          </div>
          {liveActivity.map((activity, index) => (
            <p key={index} className="text-xs text-gray-600">{activity}</p>
          ))}
        </div>

        {/* Competitor Cards */}
        <div className="space-y-3">
          {competitors.map((competitor) => (
            <div key={competitor.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium">{competitor.name}</h3>
                  <Badge className={getThreatColor(competitor.threat)}>
                    {competitor.threat} hot
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Marknadsandel</p>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">{formatPercentage(competitor.marketShare)}</span>
                    {competitor.trend === 'up' ? (
                      <ArrowUp className="h-4 w-4 text-red-500" />
                    ) : competitor.trend === 'down' ? (
                      <ArrowDown className="h-4 w-4 text-green-500" />
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Visibility Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Synlighet</span>
                  <span>{competitor.visibility}%</span>
                </div>
                <Progress value={competitor.visibility} className="h-2" />
              </div>

              {/* Recent Actions */}
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Senaste åtgärder:</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {competitor.recentActions.slice(0, 2).map((action, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses / Opportunities */}
              <div className="bg-green-50 rounded p-2">
                <p className="text-xs font-medium text-green-700 mb-1">Era möjligheter:</p>
                <ul className="text-xs text-green-600 space-y-0.5">
                  {competitor.weaknesses.slice(0, 2).map((weakness, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <Shield className="h-3 w-3 mt-0.5" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <Button size="sm" variant="outline" className="w-full mt-3">
                Se motstrategier
              </Button>
            </div>
          ))}
        </div>

        {/* Alert Section */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="font-medium text-sm">Viktig insikt</span>
          </div>
          <p className="text-sm text-gray-700">
            Stockholm Flyttar AB ökar aggressivt sin marknadsföring. 
            Rekommendation: Förstärk era USP:ar och svara med riktad kampanj.
          </p>
          <Button size="sm" className="mt-2">
            Visa åtgärdsplan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveCompetitorTracker;