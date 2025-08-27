'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  Globe, 
  Users, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Briefcase,
  Eye,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobPosting {
  id: string;
  title: string;
  location: string;
  type: string;
  urgency: 'immediate' | 'high' | 'medium';
  trigger_reason: string;
  posted_at: string;
  views: number;
  applications: number;
  auto_posted: boolean;
  platforms: string[];
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  enabled: boolean;
  last_triggered?: string;
  times_triggered: number;
}

export default function AutoJobPoster() {
  const { toast } = useToast();
  const [isSystemEnabled, setIsSystemEnabled] = useState(true);
  const [recentPostings, setRecentPostings] = useState<JobPosting[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'High Capacity Alert',
      trigger: 'capacity_utilization > 85%',
      condition: 'available_staff < needed_staff',
      action: 'Post urgent hiring for Stockholm',
      enabled: true,
      times_triggered: 3
    },
    {
      id: '2',
      name: 'Geographic Expansion',
      trigger: 'new_city_jobs > 5/month',
      condition: 'no_local_staff',
      action: 'Post local recruitment ad',
      enabled: true,
      times_triggered: 2
    },
    {
      id: '3',
      name: 'Sick Leave Coverage',
      trigger: 'sick_leave_rate > 20%',
      condition: 'immediate_coverage_needed',
      action: 'Post temporary staff positions',
      enabled: true,
      times_triggered: 1
    },
    {
      id: '4',
      name: 'Seasonal Demand',
      trigger: 'booking_increase > 30%',
      condition: 'summer_season OR december',
      action: 'Post seasonal staff positions',
      enabled: true,
      times_triggered: 5
    },
    {
      id: '5',
      name: 'Churn Prevention',
      trigger: 'staff_turnover > 15%',
      condition: 'exit_interviews_negative',
      action: 'Post better compensation packages',
      enabled: false,
      times_triggered: 0
    }
  ]);
  const [stats, setStats] = useState({
    totalAutoPosted: 24,
    activePostings: 8,
    applicationsReceived: 156,
    avgTimeToHire: 5.2,
    costSavings: 45600
  });

  useEffect(() => {
    fetchRecentPostings();
    // Simulate real-time updates
    const interval = setInterval(checkForTriggers, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchRecentPostings = async () => {
    try {
      const response = await fetch('/api/recruitment/auto-posted-jobs');
      if (response.ok) {
        const data = await response.json();
        setRecentPostings(data.postings || mockRecentPostings);
      }
    } catch (error) {
      console.error('Error fetching postings:', error);
      // Use mock data for demo
      setRecentPostings(mockRecentPostings);
    }
  };

  const mockRecentPostings: JobPosting[] = [
    {
      id: '1',
      title: 'Urgent: Flyttpersonal Stockholm',
      location: 'Stockholm',
      type: 'flyttpersonal',
      urgency: 'immediate',
      trigger_reason: 'Capacity at 92% - urgent staffing needed',
      posted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      views: 234,
      applications: 12,
      auto_posted: true,
      platforms: ['LinkedIn', 'Arbetsförmedlingen', 'Indeed', 'Facebook']
    },
    {
      id: '2',
      title: 'Local Team - Göteborg',
      location: 'Göteborg',
      type: 'team',
      urgency: 'high',
      trigger_reason: 'Geographic optimization - 8 jobs/month in Göteborg',
      posted_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      views: 156,
      applications: 8,
      auto_posted: true,
      platforms: ['LinkedIn', 'Local job boards', 'Blocket Jobb']
    },
    {
      id: '3',
      title: 'Temporary Coverage - Immediate Start',
      location: 'Stockholm',
      type: 'temporary',
      urgency: 'immediate',
      trigger_reason: 'High sick leave rate (24%) - coverage needed',
      posted_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      views: 189,
      applications: 6,
      auto_posted: true,
      platforms: ['Gigstr', 'StudentJob', 'Indeed']
    }
  ];

  const checkForTriggers = async () => {
    if (!isSystemEnabled) return;

    try {
      const response = await fetch('/api/recruitment/check-automation-triggers');
      if (response.ok) {
        const { triggered } = await response.json();
        if (triggered && triggered.length > 0) {
          triggered.forEach((trigger: any) => {
            toast({
              title: `🤖 Auto-posting triggered!`,
              description: trigger.reason,
            });
          });
          fetchRecentPostings();
        }
      }
    } catch (error) {
      console.error('Error checking triggers:', error);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    setAutomationRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled } : rule
    ));

    toast({
      title: enabled ? 'Rule activated' : 'Rule deactivated',
      description: `Automation rule has been ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  const triggerManualPost = async (rule: AutomationRule) => {
    toast({
      title: '🚀 Manual trigger activated',
      description: `Running "${rule.name}" automation...`,
    });

    // Simulate API call
    setTimeout(() => {
      toast({
        title: '✅ Job posted successfully',
        description: 'New position has been posted to all platforms',
      });
      fetchRecentPostings();
    }, 2000);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return '💼';
      case 'indeed': return '🔍';
      case 'facebook': return '📘';
      case 'arbetsförmedlingen': return '🇸🇪';
      default: return '🌐';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Auto Job Poster System
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">System</span>
              <Switch
                checked={isSystemEnabled}
                onCheckedChange={setIsSystemEnabled}
              />
              <Badge className={isSystemEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {isSystemEnabled ? 'Active' : 'Paused'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Auto-Posted</p>
              <p className="text-2xl font-bold">{stats.totalAutoPosted}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Active Now</p>
              <p className="text-2xl font-bold text-green-600">{stats.activePostings}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Applications</p>
              <p className="text-2xl font-bold text-blue-600">{stats.applicationsReceived}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Avg Days to Hire</p>
              <p className="text-2xl font-bold">{stats.avgTimeToHire}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Cost Saved</p>
              <p className="text-2xl font-bold text-green-600">{stats.costSavings.toLocaleString()} kr</p>
            </div>
          </div>

          {/* Recent Auto-Posted Jobs */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Recent Auto-Posted Jobs</h3>
            {recentPostings.map((posting) => (
              <div key={posting.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{posting.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{posting.location}</span>
                      <Badge className={getUrgencyColor(posting.urgency)}>
                        {posting.urgency}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(posting.posted_at).toLocaleDateString('sv-SE')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(posting.posted_at).toLocaleTimeString('sv-SE')}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {posting.trigger_reason}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {posting.platforms.map((platform, idx) => (
                      <span key={idx} className="text-lg" title={platform}>
                        {getPlatformIcon(platform)}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {posting.views}
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      <Users className="h-4 w-4" />
                      {posting.applications}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Automation Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automationRules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{rule.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        Triggered {rule.times_triggered}x
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Trigger:</span> {rule.trigger}</p>
                      <p><span className="font-medium">Condition:</span> {rule.condition}</p>
                      <p><span className="font-medium">Action:</span> {rule.action}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => triggerManualPost(rule)}
                      disabled={!rule.enabled}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                    />
                  </div>
                </div>
                {rule.last_triggered && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last triggered: {new Date(rule.last_triggered).toLocaleString('sv-SE')}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* AI Insights */}
          <Alert className="mt-6">
            <AlertDescription>
              <strong>AI Insights:</strong> Based on current patterns, expect increased 
              automation triggers during summer months (June-August) and December. 
              Consider adjusting compensation packages to reduce turnover-based triggers.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}