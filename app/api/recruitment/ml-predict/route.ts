import { NextRequest, NextResponse } from 'next/server';
import { recruitmentML } from '@/lib/ml/recruitment-ml';
import { CandidateMLData } from '@/types/recruitment';

export async function POST(request: NextRequest) {
  try {
    const { candidateId, applicationId, conversationData, candidateInfo } = await request.json();

    if (!candidateId || !applicationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Construct ML data from available information
    const mlData: CandidateMLData = {
      candidateId,
      applicationId,
      timestamp: new Date(),
      geographicLocation: candidateInfo?.location || 'Stockholm',
      yearsOfExperience: candidateInfo?.experience || 0,
      educationLevel: candidateInfo?.education || 'gymnasium',
      ageGroup: candidateInfo?.ageGroup || '26-35',
      skills: {
        technical: candidateInfo?.skills?.technical || [],
        soft: candidateInfo?.skills?.soft || [],
        languages: candidateInfo?.languages || [
          { language: 'svenska', proficiency: 'conversational' }
        ]
      },
      conversationMetrics: {
        responseTime: conversationData?.avgResponseTime || 30,
        messageLength: conversationData?.avgMessageLength || 50,
        sentimentScore: conversationData?.sentimentScore || 0.5,
        engagementLevel: conversationData?.engagementLevel || 0.7,
        clarityScore: conversationData?.clarityScore || 0.8,
        professionalismScore: conversationData?.professionalismScore || 0.85
      },
      assessmentScores: {
        customerServiceOrientation: candidateInfo?.customerServiceScore || 0.75
      }
    };

    // Get ML prediction
    const prediction = await recruitmentML.predict(mlData);

    // Store prediction in database (mock for now)
    console.log('ML Prediction generated:', {
      candidateId,
      successProbability: prediction.predictions.successProbability,
      riskFactors: prediction.predictions.riskFactors.length
    });

    return NextResponse.json({
      success: true,
      prediction
    });

  } catch (error) {
    console.error('ML prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate ML prediction' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Missing candidateId parameter' },
        { status: 400 }
      );
    }

    // In production, fetch from database
    // For now, return mock data
    const mockPrediction = {
      candidateId: parseInt(candidateId),
      predictions: {
        successProbability: 0.85,
        confidenceInterval: { lower: 0.75, upper: 0.95 },
        predictedPerformance: {
          customerSatisfaction: 4.2,
          punctuality: 0.92,
          teamFit: 0.88,
          retentionProbability: 0.80,
          promotionPotential: 0.75
        },
        riskFactors: [],
        optimalPlacement: {
          position: 'flyttpersonal',
          location: 'Stockholm',
          team: 'A-Team',
          shift: 'flexible' as const,
          matchScore: 0.86
        },
        developmentPlan: {
          immediateTraining: ['Grundläggande lyfttekniker'],
          longTermDevelopment: ['Ledarskapsutbildning'],
          mentorshipRecommended: false,
          estimatedTimeToProductivity: 10
        }
      },
      modelVersion: '1.0.0',
      modelConfidence: 0.89,
      generatedAt: new Date(),
      features: ['responseTime', 'engagementLevel', 'sentimentScore']
    };

    return NextResponse.json({
      success: true,
      prediction: mockPrediction
    });

  } catch (error) {
    console.error('Error fetching ML prediction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ML prediction' },
      { status: 500 }
    );
  }
}