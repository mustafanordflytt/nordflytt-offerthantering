import { NextRequest, NextResponse } from 'next/server';
import { recruitmentML } from '@/lib/ml/recruitment-ml';
import { RecruitmentMLDashboard, MLInsight } from '@/types/recruitment';

export async function GET(request: NextRequest) {
  try {
    // In production, fetch from database
    // For now, generate mock data with realistic values
    
    const mockInsights: MLInsight[] = [
      {
        insightId: 'insight-001',
        type: 'trend',
        category: 'recruitment',
        title: 'Högt kandidatengagemang i Stockholm',
        description: '15 högkvalitativa kandidater har visat exceptionellt engagemang i Lowisa-konversationer denna vecka',
        impact: 'high',
        actionable: true,
        suggestedActions: [
          {
            action: 'Schemalägg grupputvärdering för topkandidater',
            expectedOutcome: 'Snabbare rekrytering av högpresterande kandidater',
            effort: 'medium',
            priority: 1
          },
          {
            action: 'Öka rekryteringskapaciteten tillfälligt',
            expectedOutcome: 'Undvik att förlora kvalificerade kandidater',
            effort: 'high',
            priority: 2
          }
        ],
        confidence: 0.92,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        relatedCandidates: [1, 3, 5, 7, 9]
      },
      {
        insightId: 'insight-002',
        type: 'anomaly',
        category: 'performance',
        title: 'Lägre genomsnittlig svenska-nivå senaste veckan',
        description: 'ML-modellen upptäckte att 40% av kandidaterna har svenska nivå under 3/5',
        impact: 'medium',
        actionable: true,
        suggestedActions: [
          {
            action: 'Aktivera språkstöd i onboarding',
            expectedOutcome: 'Förbättrad integration och prestanda',
            effort: 'low',
            priority: 1
          }
        ],
        confidence: 0.87,
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      },
      {
        insightId: 'insight-003',
        type: 'prediction',
        category: 'optimization',
        title: 'Optimal teamsammansättning identifierad',
        description: 'ML-analys föreslår specifik teamkonfiguration för 25% högre produktivitet',
        impact: 'high',
        actionable: true,
        suggestedActions: [
          {
            action: 'Implementera föreslagen teamstruktur',
            expectedOutcome: 'Ökad effektivitet och kundnöjdhet',
            effort: 'medium',
            priority: 1
          }
        ],
        confidence: 0.89,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        insightId: 'insight-004',
        type: 'recommendation',
        category: 'retention',
        title: 'Mentorskapsprogram rekommenderas',
        description: 'ML identifierade 8 nya anställda med hög risk för personalomsättning',
        impact: 'medium',
        actionable: true,
        suggestedActions: [
          {
            action: 'Tilldela erfarna mentorer',
            expectedOutcome: 'Minska personalomsättning med 60%',
            effort: 'low',
            priority: 1
          }
        ],
        confidence: 0.85,
        validUntil: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        relatedCandidates: [2, 4, 6, 8, 10, 12, 14, 16]
      }
    ];

    const dashboard: RecruitmentMLDashboard = {
      overallMetrics: {
        totalPredictions: 342,
        averageAccuracy: 0.92,
        costSavings: 125000,
        timeReduction: 75,
        qualityImprovement: 40
      },
      modelPerformance: {
        modelId: recruitmentML.getModelConfig().modelId,
        metrics: recruitmentML.getModelConfig().performanceMetrics,
        predictionDistribution: [
          { range: '0-20%', count: 12, percentage: 3.5 },
          { range: '20-40%', count: 28, percentage: 8.2 },
          { range: '40-60%', count: 45, percentage: 13.2 },
          { range: '60-80%', count: 142, percentage: 41.5 },
          { range: '80-100%', count: 115, percentage: 33.6 }
        ]
      },
      activeInsights: mockInsights,
      recentPredictions: [
        {
          candidate: {
            id: 1,
            name: 'Erik Andersson',
            position: 'Flyttpersonal'
          },
          prediction: {
            candidateId: 1,
            predictions: {
              successProbability: 0.89,
              confidenceInterval: { lower: 0.82, upper: 0.96 },
              predictedPerformance: {
                customerSatisfaction: 4.5,
                punctuality: 0.92,
                teamFit: 0.88,
                retentionProbability: 0.85,
                promotionPotential: 0.78
              },
              riskFactors: [],
              optimalPlacement: {
                position: 'flyttpersonal',
                location: 'Stockholm',
                team: 'A-Team',
                shift: 'flexible',
                matchScore: 0.91
              },
              developmentPlan: {
                immediateTraining: [],
                longTermDevelopment: ['Ledarskapsutbildning'],
                mentorshipRecommended: false,
                estimatedTimeToProductivity: 7
              }
            },
            modelVersion: '1.0.0',
            modelConfidence: 0.92,
            generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            features: ['responseTime', 'engagementLevel', 'sentimentScore']
          },
          actualOutcome: {
            hired: true,
            performanceScore: 4.6,
            stillEmployed: true
          }
        },
        {
          candidate: {
            id: 3,
            name: 'Anna Svensson',
            position: 'Kundservice'
          },
          prediction: {
            candidateId: 3,
            predictions: {
              successProbability: 0.76,
              confidenceInterval: { lower: 0.68, upper: 0.84 },
              predictedPerformance: {
                customerSatisfaction: 4.2,
                punctuality: 0.88,
                teamFit: 0.75,
                retentionProbability: 0.70,
                promotionPotential: 0.65
              },
              riskFactors: [
                {
                  type: 'turnover',
                  probability: 0.30,
                  description: 'Måttlig risk för personalomsättning',
                  mitigation: 'Regelbunden uppföljning och feedback'
                }
              ],
              optimalPlacement: {
                position: 'kundservice',
                location: 'Stockholm',
                team: 'B-Team',
                shift: 'morning',
                matchScore: 0.78
              },
              developmentPlan: {
                immediateTraining: ['Kundservice excellence'],
                longTermDevelopment: ['Konflikthantering'],
                mentorshipRecommended: true,
                estimatedTimeToProductivity: 14
              }
            },
            modelVersion: '1.0.0',
            modelConfidence: 0.85,
            generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            features: ['responseTime', 'engagementLevel', 'sentimentScore']
          },
          actualOutcome: {
            hired: true,
            performanceScore: 4.0,
            stillEmployed: true
          }
        },
        {
          candidate: {
            id: 5,
            name: 'Mohamed Ali',
            position: 'Chaufför'
          },
          prediction: {
            candidateId: 5,
            predictions: {
              successProbability: 0.42,
              confidenceInterval: { lower: 0.32, upper: 0.52 },
              predictedPerformance: {
                customerSatisfaction: 3.2,
                punctuality: 0.65,
                teamFit: 0.55,
                retentionProbability: 0.45,
                promotionPotential: 0.35
              },
              riskFactors: [
                {
                  type: 'performance',
                  probability: 0.58,
                  description: 'Risk för prestandaproblem',
                  mitigation: 'Intensiv träning första månaden'
                },
                {
                  type: 'skill_gap',
                  probability: 0.70,
                  description: 'Kompetensgap inom körteknik',
                  mitigation: 'Strukturerad körträning'
                }
              ],
              optimalPlacement: {
                position: 'chauffor',
                location: 'Stockholm',
                team: 'Training',
                shift: 'afternoon',
                matchScore: 0.45
              },
              developmentPlan: {
                immediateTraining: ['Säker körning', 'Kundkontakt'],
                longTermDevelopment: [],
                mentorshipRecommended: true,
                estimatedTimeToProductivity: 21
              }
            },
            modelVersion: '1.0.0',
            modelConfidence: 0.78,
            generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            features: ['responseTime', 'engagementLevel', 'sentimentScore']
          },
          actualOutcome: {
            hired: false
          }
        }
      ],
      featureImportance: [
        { feature: 'Engagement Level', importance: 0.92, category: 'conversation' },
        { feature: 'Response Time', importance: 0.87, category: 'conversation' },
        { feature: 'Work Experience', importance: 0.85, category: 'background' },
        { feature: 'Language Skills', importance: 0.82, category: 'skills' },
        { feature: 'Sentiment Score', importance: 0.78, category: 'conversation' },
        { feature: 'Professional Tone', importance: 0.75, category: 'conversation' },
        { feature: 'Availability', importance: 0.72, category: 'logistics' },
        { feature: 'Geographic Location', importance: 0.68, category: 'logistics' },
        { feature: 'Education Level', importance: 0.65, category: 'background' },
        { feature: 'Technical Skills', importance: 0.62, category: 'skills' }
      ]
    };

    return NextResponse.json(dashboard);

  } catch (error) {
    console.error('ML dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ML dashboard' },
      { status: 500 }
    );
  }
}