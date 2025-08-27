// =====================================================
// REAL-TIME RANKING TRACKING SYSTEM
// Production-ready SERP position monitoring
// =====================================================

import { supabase } from '@/lib/supabase';
import { googleSearchConsole } from './google-search-console';

// Configuration
const RANKING_CONFIG = {
  updateInterval: 24 * 60 * 60 * 1000, // 24 hours
  batchSize: 50,
  searchEngines: ['google.se', 'google.com'],
  devices: ['desktop', 'mobile'],
  locations: ['Stockholm', 'Sweden'],
  userAgent: {
    desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  }
};

// Types
export interface RankingTarget {
  id: string;
  keyword: string;
  url?: string;
  searchEngine: string;
  location: string;
  device: 'desktop' | 'mobile';
  trackingEnabled: boolean;
  aiAdvantage?: boolean;
  competitorDomains?: string[];
}

export interface RankingResult {
  keyword: string;
  position: number | null;
  url: string | null;
  title: string | null;
  description: string | null;
  featuredSnippet?: boolean;
  peopleAlsoAsk?: boolean;
  localPack?: boolean;
  knowledgePanel?: boolean;
  imageCarousel?: boolean;
  videoCarousel?: boolean;
  competitors: CompetitorRanking[];
  timestamp: Date;
}

export interface CompetitorRanking {
  domain: string;
  position: number;
  url: string;
  title: string;
  aiMentioned: boolean;
  mlMentioned: boolean;
}

export interface RankingChange {
  keyword: string;
  previousPosition: number | null;
  currentPosition: number | null;
  change: number;
  trend: 'up' | 'down' | 'stable' | 'new' | 'lost';
  competitorMovements: CompetitorMovement[];
}

export interface CompetitorMovement {
  domain: string;
  previousPosition: number | null;
  currentPosition: number | null;
  change: number;
}

// Ranking Tracker Service
export class RankingTracker {
  private trackingQueue: RankingTarget[] = [];
  private isTracking: boolean = false;
  private lastUpdate: Date | null = null;

  // Priority AI keywords for Nordflytt
  private priorityKeywords = [
    // AI-focused keywords (low competition, high value)
    { keyword: 'ai flyttfirma stockholm', aiAdvantage: true },
    { keyword: 'smart flyttfirma', aiAdvantage: true },
    { keyword: 'flyttfirma med ai', aiAdvantage: true },
    { keyword: 'instant flyttpris', aiAdvantage: true },
    { keyword: 'automatisk flyttoffert', aiAdvantage: true },
    { keyword: 'ml flyttplanering', aiAdvantage: true },
    { keyword: '87% accuracy moving', aiAdvantage: true },
    { keyword: 'ai moving company stockholm', aiAdvantage: true },
    { keyword: 'machine learning flyttfirma', aiAdvantage: true },
    
    // Traditional keywords (for comparison)
    { keyword: 'flyttfirma stockholm', aiAdvantage: false },
    { keyword: 'billig flyttfirma stockholm', aiAdvantage: false },
    { keyword: 'kontorsflytt stockholm', aiAdvantage: false },
    { keyword: 'flytthjälp stockholm', aiAdvantage: false },
    { keyword: 'flyttstädning stockholm', aiAdvantage: false },
    
    // Local keywords
    { keyword: 'flyttfirma östermalm', aiAdvantage: false },
    { keyword: 'flyttfirma södermalm', aiAdvantage: false },
    { keyword: 'flyttfirma vasastan', aiAdvantage: false },
    
    // Long-tail AI keywords
    { keyword: 'flyttfirma som använder ai stockholm', aiAdvantage: true },
    { keyword: 'få flyttpris direkt online', aiAdvantage: true },
    { keyword: 'automatisk flyttkalkyl stockholm', aiAdvantage: true }
  ];

  // Competitor domains to track
  private competitorDomains = [
    'stockholmflyttbyra.se',
    'flyttochtransport.se',
    'flyttfirmaistockholm.nu',
    'stadhem.se',
    'flyttgubben.se',
    'flyttkarlen.se',
    'alfa-quality.se',
    'stockholmsstadsmission.se/flytt'
  ];

  constructor() {
    this.initializeTracking();
  }

  // Initialize tracking system
  private async initializeTracking() {
    // Load existing tracking targets from database
    await this.loadTrackingTargets();
    
    // Start automated tracking
    this.startAutomatedTracking();
  }

  // Load tracking targets from database
  private async loadTrackingTargets() {
    try {
      const { data, error } = await supabase
        .from('seo_opportunities')
        .select('keyword, ai_advantage_potential')
        .eq('status', 'identified')
        .or('status,eq.in_progress')
        .or('status,eq.monitoring');

      if (error) throw error;

      // Convert to tracking targets
      this.trackingQueue = data?.map(item => ({
        id: `${item.keyword}-google.se-desktop`,
        keyword: item.keyword,
        searchEngine: 'google.se',
        location: 'Stockholm',
        device: 'desktop',
        trackingEnabled: true,
        aiAdvantage: item.ai_advantage_potential,
        competitorDomains: this.competitorDomains
      })) || [];

      // Add priority keywords if not already tracking
      for (const pk of this.priorityKeywords) {
        if (!this.trackingQueue.some(t => t.keyword === pk.keyword)) {
          this.trackingQueue.push({
            id: `${pk.keyword}-google.se-desktop`,
            keyword: pk.keyword,
            searchEngine: 'google.se',
            location: 'Stockholm',
            device: 'desktop',
            trackingEnabled: true,
            aiAdvantage: pk.aiAdvantage,
            competitorDomains: this.competitorDomains
          });
        }
      }
    } catch (error) {
      console.error('Failed to load tracking targets:', error);
    }
  }

  // Start automated tracking
  private startAutomatedTracking() {
    // Initial check
    this.performRankingCheck();

    // Schedule daily checks
    setInterval(() => {
      this.performRankingCheck();
    }, RANKING_CONFIG.updateInterval);
  }

  // Perform ranking check for all keywords
  async performRankingCheck() {
    if (this.isTracking) {
      console.log('Ranking check already in progress');
      return;
    }

    this.isTracking = true;
    console.log(`Starting ranking check for ${this.trackingQueue.length} keywords`);

    try {
      // Process in batches
      for (let i = 0; i < this.trackingQueue.length; i += RANKING_CONFIG.batchSize) {
        const batch = this.trackingQueue.slice(i, i + RANKING_CONFIG.batchSize);
        await this.processBatch(batch);
        
        // Delay between batches to avoid rate limiting
        if (i + RANKING_CONFIG.batchSize < this.trackingQueue.length) {
          await this.delay(5000); // 5 second delay
        }
      }

      this.lastUpdate = new Date();
      
      // Analyze changes and send alerts
      await this.analyzeRankingChanges();
      
    } catch (error) {
      console.error('Ranking check failed:', error);
    } finally {
      this.isTracking = false;
    }
  }

  // Process a batch of keywords
  private async processBatch(batch: RankingTarget[]) {
    const results = await Promise.all(
      batch.map(target => this.checkRanking(target))
    );

    // Save results to database
    await this.saveRankingResults(results);
  }

  // Check ranking for a single keyword
  async checkRanking(target: RankingTarget): Promise<RankingResult> {
    try {
      // First, try to get data from Google Search Console
      const gscData = await this.getGSCRanking(target.keyword);
      
      if (gscData && gscData.position) {
        // We have GSC data, use it as primary source
        return {
          keyword: target.keyword,
          position: Math.round(gscData.position),
          url: gscData.url || null,
          title: null,
          description: null,
          competitors: [], // GSC doesn't provide competitor data
          timestamp: new Date()
        };
      }

      // If no GSC data or need competitor data, use scraping API (when available)
      // For now, return a structure ready for real data
      return {
        keyword: target.keyword,
        position: null,
        url: null,
        title: null,
        description: null,
        competitors: [],
        timestamp: new Date()
      };

    } catch (error) {
      console.error(`Failed to check ranking for ${target.keyword}:`, error);
      return {
        keyword: target.keyword,
        position: null,
        url: null,
        title: null,
        description: null,
        competitors: [],
        timestamp: new Date()
      };
    }
  }

  // Get ranking data from Google Search Console
  private async getGSCRanking(keyword: string): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days

      const data = await googleSearchConsole.getSearchAnalytics({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['query', 'page'],
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'query',
            expression: keyword,
            operator: 'equals'
          }]
        }],
        rowLimit: 10
      });

      if (data && data.length > 0) {
        // Return the best ranking position
        const bestResult = data.reduce((best, current) => 
          current.position < best.position ? current : best
        );

        return {
          position: bestResult.position,
          url: bestResult.keys[1], // page dimension
          clicks: bestResult.clicks,
          impressions: bestResult.impressions
        };
      }

      return null;
    } catch (error) {
      console.error('GSC ranking check failed:', error);
      return null;
    }
  }

  // Save ranking results to database
  private async saveRankingResults(results: RankingResult[]) {
    try {
      const dataToInsert = results.map(result => ({
        keyword: result.keyword,
        position: result.position,
        url: result.url,
        date_tracked: result.timestamp,
        domain: 'nordflytt.se',
        device_type: 'desktop',
        ai_advantage: this.priorityKeywords.find(k => k.keyword === result.keyword)?.aiAdvantage || false
      }));

      const { error } = await supabase
        .from('seo_rankings')
        .insert(dataToInsert);

      if (error) {
        console.error('Failed to save ranking results:', error);
      }

      // Also save competitor data if available
      for (const result of results) {
        if (result.competitors && result.competitors.length > 0) {
          await this.saveCompetitorRankings(result.keyword, result.competitors);
        }
      }
    } catch (error) {
      console.error('Failed to save ranking data:', error);
    }
  }

  // Save competitor rankings
  private async saveCompetitorRankings(keyword: string, competitors: CompetitorRanking[]) {
    try {
      const dataToInsert = competitors.map(comp => ({
        competitor_domain: comp.domain,
        keyword: keyword,
        position: comp.position,
        content_url: comp.url,
        ai_mentioned: comp.aiMentioned,
        ml_mentioned: comp.mlMentioned,
        date_tracked: new Date()
      }));

      const { error } = await supabase
        .from('seo_competitors')
        .insert(dataToInsert);

      if (error) {
        console.error('Failed to save competitor rankings:', error);
      }
    } catch (error) {
      console.error('Failed to save competitor data:', error);
    }
  }

  // Analyze ranking changes and trigger alerts
  private async analyzeRankingChanges() {
    try {
      // Get current and previous rankings
      const { data: currentRankings } = await supabase
        .from('seo_rankings')
        .select('*')
        .eq('domain', 'nordflytt.se')
        .order('date_tracked', { ascending: false })
        .limit(100);

      if (!currentRankings) return;

      // Group by keyword and analyze changes
      const changes: RankingChange[] = [];

      for (const ranking of currentRankings) {
        // Get previous ranking for this keyword
        const { data: previousData } = await supabase
          .from('seo_rankings')
          .select('position')
          .eq('keyword', ranking.keyword)
          .eq('domain', 'nordflytt.se')
          .lt('date_tracked', ranking.date_tracked)
          .order('date_tracked', { ascending: false })
          .limit(1)
          .single();

        const previousPosition = previousData?.position || null;
        const change = this.calculatePositionChange(previousPosition, ranking.position);

        if (change.trend !== 'stable') {
          changes.push({
            keyword: ranking.keyword,
            previousPosition,
            currentPosition: ranking.position,
            change: change.value,
            trend: change.trend,
            competitorMovements: []
          });
        }
      }

      // Trigger alerts for significant changes
      await this.triggerRankingAlerts(changes);

    } catch (error) {
      console.error('Failed to analyze ranking changes:', error);
    }
  }

  // Calculate position change
  private calculatePositionChange(previous: number | null, current: number | null): { value: number, trend: RankingChange['trend'] } {
    if (previous === null && current !== null) {
      return { value: current, trend: 'new' };
    }
    if (previous !== null && current === null) {
      return { value: -previous, trend: 'lost' };
    }
    if (previous === null || current === null) {
      return { value: 0, trend: 'stable' };
    }

    const change = previous - current; // Lower position number is better
    
    if (change > 0) return { value: change, trend: 'up' };
    if (change < 0) return { value: change, trend: 'down' };
    return { value: 0, trend: 'stable' };
  }

  // Trigger alerts for ranking changes
  private async triggerRankingAlerts(changes: RankingChange[]) {
    // Filter significant changes
    const significantChanges = changes.filter(change => {
      // Alert for AI keywords
      if (this.priorityKeywords.find(k => k.keyword === change.keyword && k.aiAdvantage)) {
        return true;
      }
      
      // Alert for big movements (3+ positions)
      if (Math.abs(change.change) >= 3) {
        return true;
      }
      
      // Alert for top 10 changes
      if (change.currentPosition && change.currentPosition <= 10) {
        return true;
      }
      
      return false;
    });

    // Log alerts (in production, send notifications)
    for (const change of significantChanges) {
      console.log(`RANKING ALERT: ${change.keyword} moved ${change.trend} by ${Math.abs(change.change)} positions (now at #${change.currentPosition})`);
      
      // Save alert to database or send notification
      // await this.sendRankingNotification(change);
    }
  }

  // Add new keyword to tracking
  async addKeyword(keyword: string, options?: Partial<RankingTarget>) {
    const target: RankingTarget = {
      id: `${keyword}-google.se-desktop`,
      keyword,
      searchEngine: 'google.se',
      location: 'Stockholm',
      device: 'desktop',
      trackingEnabled: true,
      competitorDomains: this.competitorDomains,
      ...options
    };

    this.trackingQueue.push(target);
    
    // Track immediately
    const result = await this.checkRanking(target);
    await this.saveRankingResults([result]);
    
    return result;
  }

  // Get ranking history for a keyword
  async getRankingHistory(keyword: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('seo_rankings')
      .select('position, date_tracked')
      .eq('keyword', keyword)
      .eq('domain', 'nordflytt.se')
      .gte('date_tracked', startDate.toISOString())
      .order('date_tracked', { ascending: true });

    if (error) throw error;

    return data;
  }

  // Get AI keyword performance summary
  async getAIKeywordSummary(): Promise<any> {
    const aiKeywords = this.priorityKeywords
      .filter(k => k.aiAdvantage)
      .map(k => k.keyword);

    const { data, error } = await supabase
      .from('seo_rankings')
      .select('keyword, position')
      .in('keyword', aiKeywords)
      .eq('domain', 'nordflytt.se')
      .order('date_tracked', { ascending: false });

    if (error) throw error;

    // Get latest position for each keyword
    const latestPositions = new Map();
    data?.forEach(item => {
      if (!latestPositions.has(item.keyword)) {
        latestPositions.set(item.keyword, item.position);
      }
    });

    // Calculate summary stats
    const summary = {
      totalTracked: aiKeywords.length,
      ranking: {
        top3: 0,
        top10: 0,
        top20: 0,
        notRanking: 0
      },
      keywords: Array.from(latestPositions.entries()).map(([keyword, position]) => ({
        keyword,
        position,
        status: position <= 3 ? 'excellent' : position <= 10 ? 'good' : position <= 20 ? 'improving' : 'needs-work'
      }))
    };

    latestPositions.forEach(position => {
      if (position === null) {
        summary.ranking.notRanking++;
      } else if (position <= 3) {
        summary.ranking.top3++;
      } else if (position <= 10) {
        summary.ranking.top10++;
      } else if (position <= 20) {
        summary.ranking.top20++;
      } else {
        summary.ranking.notRanking++;
      }
    });

    return summary;
  }

  // Utility: delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const rankingTracker = new RankingTracker();