// API endpoint for competitive intelligence system
import { NextResponse } from 'next/server';
import { CompetitiveReportGenerator } from '@/lib/competitive-intelligence/report-generator';
import { CompetitorWebResearch } from '@/lib/competitive-intelligence/web-research';
import { AIDifferentiationStrategy } from '@/lib/competitive-intelligence/ai-differentiation';

export async function GET() {
  try {
    const reportGenerator = new CompetitiveReportGenerator();
    const report = await reportGenerator.generateFullReport();
    
    return NextResponse.json({
      success: true,
      report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating competitive report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { action, competitor, data } = await request.json();
    
    switch (action) {
      case 'analyzeCompetitor': {
        const webResearch = new CompetitorWebResearch();
        const adData = await webResearch.researchCompetitorAds(competitor);
        const landingPageData = await webResearch.analyzeLandingPages(competitor);
        
        return NextResponse.json({
          success: true,
          competitor,
          adData,
          landingPageData
        });
      }
      
      case 'getAIStrategy': {
        const aiStrategy = new AIDifferentiationStrategy();
        const googleCampaigns = aiStrategy.getGoogleAdsCampaigns();
        const metaCampaigns = aiStrategy.getMetaAdsCampaigns();
        const positioning = aiStrategy.generatePositioningStrategy();
        
        return NextResponse.json({
          success: true,
          googleCampaigns,
          metaCampaigns,
          positioning
        });
      }
      
      case 'getKeywordOpportunities': {
        const webResearch = new CompetitorWebResearch();
        const keywords = await webResearch.identifyKeywordOpportunities();
        
        return NextResponse.json({
          success: true,
          keywords
        });
      }
      
      case 'getCampaignRecommendations': {
        const reportGenerator = new CompetitiveReportGenerator();
        const recommendations = reportGenerator.generateCampaignRecommendations();
        
        return NextResponse.json({
          success: true,
          recommendations
        });
      }
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in competitive intelligence API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}