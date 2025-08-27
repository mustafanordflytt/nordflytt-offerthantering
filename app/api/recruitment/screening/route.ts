import { NextRequest, NextResponse } from 'next/server';

// Mock screenings storage
let mockScreenings: any[] = [];
let screeningIdCounter = 1000;

export async function POST(request: NextRequest) {
  try {
    const screeningData = await request.json();
    
    // Validate screening data
    const validatedData = validateScreeningData(screeningData);
    
    // Process screening with ML predictions (mock implementation)
    const screeningResult = await processScreening(validatedData);
    
    return NextResponse.json({
      success: true,
      screening_id: screeningResult.id,
      ml_predictions: screeningResult.predictions,
      recommendations: screeningResult.recommendations,
      status: screeningResult.status,
      message: 'Screening completed successfully'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Screening error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process screening',
      details: error.message
    }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidate_id');
    const screeningId = searchParams.get('id');
    
    if (screeningId) {
      const screening = mockScreenings.find(s => s.id === screeningId);
      if (!screening) {
        return NextResponse.json({
          success: false,
          error: 'Screening not found'
        }, { status: 404 });
      }
      return NextResponse.json({ success: true, screening });
    }
    
    if (candidateId) {
      const screenings = mockScreenings.filter(s => s.candidateData.candidate_id === candidateId);
      return NextResponse.json({ 
        success: true, 
        screenings,
        total: screenings.length
      });
    }
    
    // Return all screenings
    return NextResponse.json({ 
      success: true, 
      screenings: mockScreenings,
      total: mockScreenings.length
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve screenings'
    }, { status: 500 });
  }
}

function validateScreeningData(data: any) {
  const required = ['candidate_name', 'position'];
  const missing = [];
  
  for (const field of required) {
    if (!data[field]) {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Ensure conversation_data exists
  if (!data.conversation_data) {
    data.conversation_data = {};
  }
  
  return data;
}

async function processScreening(data: any) {
  // Generate ML predictions based on data
  const predictions = generateMLPredictions(data);
  
  // Generate recommendations based on predictions
  const recommendations = generateRecommendations(predictions);
  
  // Determine overall status
  const status = predictions.hiringSuccess > 0.8 ? 'recommended' : 
                 predictions.hiringSuccess > 0.6 ? 'conditional' : 
                 'not_recommended';
  
  // Create screening result
  const screening = {
    id: `SCR${++screeningIdCounter}`,
    candidateData: data,
    predictions,
    recommendations,
    status,
    processedAt: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  
  // Save to mock database
  mockScreenings.push(screening);
  
  return screening;
}

function generateMLPredictions(data: any) {
  // Sophisticated mock ML predictions based on candidate data
  const hasExperience = data.conversation_data?.experience || 
                       data.candidate_experience || 
                       false;
  
  const hasSwedishSkills = data.conversation_data?.swedish || 
                          data.language_skills?.includes('swedish') || 
                          false;
  
  const hasDriverLicense = data.conversation_data?.driving_license || 
                          data.has_drivers_license || 
                          false;
  
  const isAvailable = data.conversation_data?.availability || 
                     data.available_immediately || 
                     true;
  
  // Base scores
  let hiringSuccessBase = 0.5;
  let retentionBase = 0.6;
  let performanceBase = 0.7;
  let culturalFitBase = 0.7;
  
  // Adjust based on factors
  if (hasExperience) {
    hiringSuccessBase += 0.2;
    performanceBase += 0.15;
  }
  
  if (hasSwedishSkills) {
    hiringSuccessBase += 0.1;
    culturalFitBase += 0.15;
  }
  
  if (hasDriverLicense) {
    hiringSuccessBase += 0.1;
    performanceBase += 0.05;
  }
  
  if (isAvailable) {
    hiringSuccessBase += 0.05;
    retentionBase += 0.1;
  }
  
  // Add some randomness for realism
  const randomFactor = () => (Math.random() - 0.5) * 0.1;
  
  return {
    hiringSuccess: Math.min(1, Math.max(0, hiringSuccessBase + randomFactor())),
    retentionProbability: Math.min(1, Math.max(0, retentionBase + randomFactor())),
    performanceScore: Math.min(1, Math.max(0, performanceBase + randomFactor())),
    culturalFit: Math.min(1, Math.max(0, culturalFitBase + randomFactor())),
    confidence: 0.85 + randomFactor() * 0.1,
    factors: {
      experience: hasExperience,
      language: hasSwedishSkills,
      mobility: hasDriverLicense,
      availability: isAvailable
    }
  };
}

function generateRecommendations(predictions: any) {
  const recommendations = [];
  
  // Overall hiring recommendation
  if (predictions.hiringSuccess > 0.8) {
    recommendations.push('🏆 Stark kandidat - rekommenderas för intervju omgående');
    recommendations.push('✨ Hög sannolikhet för framgångsrik anställning');
  } else if (predictions.hiringSuccess > 0.6) {
    recommendations.push('⚠️ Lovande kandidat - ytterligare screening rekommenderas');
    recommendations.push('📋 Överväg praktisk test eller provarbete');
  } else {
    recommendations.push('❌ Låg matchning - överväg andra kandidater');
    recommendations.push('💡 Kan passa för andra roller eller framtida möjligheter');
  }
  
  // Specific factor recommendations
  if (!predictions.factors.experience) {
    recommendations.push('📚 Saknar direkt erfarenhet - fokusera på potential och inlärningsförmåga');
  }
  
  if (!predictions.factors.language) {
    recommendations.push('🗣️ Språkkunskaper kan behöva utvärderas närmare');
  }
  
  if (!predictions.factors.mobility) {
    recommendations.push('🚗 Saknar körkort - överväg om detta är kritiskt för rollen');
  }
  
  // Performance potential
  if (predictions.performanceScore > 0.85) {
    recommendations.push('⭐ Hög potential för utmärkta prestationer');
  }
  
  // Retention risk
  if (predictions.retentionProbability < 0.7) {
    recommendations.push('🔄 Risk för kort anställningstid - diskutera långsiktiga mål');
  }
  
  // Cultural fit
  if (predictions.culturalFit > 0.85) {
    recommendations.push('🤝 Utmärkt kulturell matchning med företaget');
  }
  
  return recommendations;
}