// Training Scheduling API for AI-recommended skill development
// Phase 3 implementation supporting intelligent training management

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skillType, priority, duration, affectedStaff = [], estimatedCost, description } = body;
    
    console.log('📚 Training scheduling request:', { skillType, priority, duration, affectedStaff: affectedStaff.length });

    // Validate required fields
    if (!skillType) {
      return NextResponse.json({ 
        error: 'Skill type is required' 
      }, { status: 400 });
    }

    if (!priority) {
      return NextResponse.json({ 
        error: 'Priority is required' 
      }, { status: 400 });
    }

    const validPriorities = ['high', 'medium', 'low'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ 
        error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` 
      }, { status: 400 });
    }

    const validSkillTypes = [
      'heavy_lifting', 'fragile_items', 'customer_service', 
      'speed', 'leadership', 'problem_solving', 'safety', 'equipment_handling'
    ];
    
    if (!validSkillTypes.includes(skillType)) {
      return NextResponse.json({ 
        error: `Invalid skill type. Must be one of: ${validSkillTypes.join(', ')}` 
      }, { status: 400 });
    }

    try {
      // Calculate optimal scheduling date based on priority
      const scheduledDate = calculateOptimalSchedulingDate(priority, affectedStaff);
      
      // Generate training plan
      const trainingPlan = generateTrainingPlan(skillType, duration, priority);
      
      // Find available trainers
      const availableTrainers = await findAvailableTrainers(skillType, scheduledDate);
      
      // Calculate resource requirements
      const resourceRequirements = calculateResourceRequirements(skillType, affectedStaff.length, duration);
      
      // Create training session
      const trainingSession = {
        id: `training_${Date.now()}`,
        skillType,
        priority,
        duration: duration || trainingPlan.estimatedDuration,
        estimatedCost: estimatedCost || trainingPlan.estimatedCost,
        description: description || trainingPlan.description,
        scheduledDate: scheduledDate.toISOString(),
        participants: affectedStaff,
        trainer: availableTrainers[0] || null,
        location: trainingPlan.recommendedLocation,
        materials: trainingPlan.materials,
        prerequisites: trainingPlan.prerequisites,
        learningObjectives: trainingPlan.learningObjectives,
        assessmentCriteria: trainingPlan.assessmentCriteria,
        followUpRequired: trainingPlan.followUpRequired,
        resourceRequirements,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        createdBy: 'ai_system'
      };
      
      // Store training session (in production, save to database)
      await storeTrainingSession(trainingSession);
      
      // Calculate business impact
      const businessImpact = calculateTrainingBusinessImpact(skillType, affectedStaff.length, priority);
      
      // Generate notifications for affected staff
      const notifications = generateTrainingNotifications(trainingSession);
      
      console.log(`✅ Training session scheduled: ${trainingSession.id} for ${scheduledDate.toDateString()}`);

      return NextResponse.json({
        success: true,
        trainingSession,
        businessImpact,
        notifications,
        message: `Training session scheduled successfully for ${scheduledDate.toDateString()}`,
        nextSteps: [
          'Send invitations to participants',
          'Book training location and equipment',
          'Prepare training materials',
          'Schedule pre-training assessments'
        ]
      }, { 
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-Training-Id': trainingSession.id,
          'X-Scheduled-Date': scheduledDate.toISOString(),
          'X-Participants': affectedStaff.length.toString()
        }
      });

    } catch (schedulingError) {
      console.error('Training scheduling failed:', schedulingError);
      
      return NextResponse.json({ 
        error: 'Training scheduling failed',
        message: schedulingError instanceof Error ? schedulingError.message : 'Scheduling error',
        fallbackOptions: generateFallbackTrainingOptions(skillType, priority)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Training scheduling API failed:', error);
    
    return NextResponse.json({ 
      error: 'Training scheduling request failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const skillType = searchParams.get('skillType');
    const status = searchParams.get('status') || 'all';
    
    console.log('📅 Fetching training schedule:', { startDate, endDate, skillType, status });

    // Generate mock training schedule
    const trainingSchedule = generateMockTrainingSchedule(startDate, endDate, skillType, status);
    
    const summary = {
      total: trainingSchedule.length,
      byStatus: {
        scheduled: trainingSchedule.filter(t => t.status === 'scheduled').length,
        in_progress: trainingSchedule.filter(t => t.status === 'in_progress').length,
        completed: trainingSchedule.filter(t => t.status === 'completed').length,
        cancelled: trainingSchedule.filter(t => t.status === 'cancelled').length
      },
      byPriority: {
        high: trainingSchedule.filter(t => t.priority === 'high').length,
        medium: trainingSchedule.filter(t => t.priority === 'medium').length,
        low: trainingSchedule.filter(t => t.priority === 'low').length
      },
      upcomingThisWeek: trainingSchedule.filter(t => {
        const scheduledDate = new Date(t.scheduledDate);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return scheduledDate <= weekFromNow && t.status === 'scheduled';
      }).length
    };

    return NextResponse.json({
      trainingSessions: trainingSchedule,
      summary,
      filters: { startDate, endDate, skillType, status },
      generatedAt: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('Failed to fetch training schedule:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch training schedule',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function calculateOptimalSchedulingDate(priority: string, affectedStaff: any[]): Date {
  const now = new Date();
  const schedulingDate = new Date(now);
  
  // Calculate days to add based on priority
  let daysToAdd: number;
  switch (priority) {
    case 'high':
      daysToAdd = 3; // 3 days for high priority
      break;
    case 'medium':
      daysToAdd = 7; // 1 week for medium priority
      break;
    case 'low':
      daysToAdd = 14; // 2 weeks for low priority
      break;
    default:
      daysToAdd = 7;
  }
  
  // Adjust for staff availability (more staff = longer lead time)
  if (affectedStaff.length > 5) {
    daysToAdd += 3;
  } else if (affectedStaff.length > 10) {
    daysToAdd += 7;
  }
  
  schedulingDate.setDate(schedulingDate.getDate() + daysToAdd);
  
  // Ensure it's a weekday
  while (schedulingDate.getDay() === 0 || schedulingDate.getDay() === 6) {
    schedulingDate.setDate(schedulingDate.getDate() + 1);
  }
  
  return schedulingDate;
}

function generateTrainingPlan(skillType: string, duration?: string, priority?: string) {
  const trainingPlans: { [key: string]: any } = {
    heavy_lifting: {
      estimatedDuration: duration || '4 hours',
      estimatedCost: 3500,
      description: 'Safe heavy lifting techniques and equipment usage',
      recommendedLocation: 'Training warehouse',
      materials: ['Safety equipment', 'Lifting aids', 'Training mannequins'],
      prerequisites: ['Basic safety certification'],
      learningObjectives: [
        'Proper lifting posture and technique',
        'Use of lifting equipment',
        'Risk assessment and safety protocols'
      ],
      assessmentCriteria: ['Practical demonstration', 'Safety checklist completion'],
      followUpRequired: true
    },
    fragile_items: {
      estimatedDuration: duration || '3 hours',
      estimatedCost: 2800,
      description: 'Specialized handling of fragile and valuable items',
      recommendedLocation: 'Training facility',
      materials: ['Packing materials', 'Sample fragile items', 'Protection equipment'],
      prerequisites: ['Basic handling experience'],
      learningObjectives: [
        'Fragile item identification',
        'Proper packing techniques',
        'Transport safety measures'
      ],
      assessmentCriteria: ['Packing demonstration', 'Knowledge test'],
      followUpRequired: false
    },
    customer_service: {
      estimatedDuration: duration || '6 hours',
      estimatedCost: 4200,
      description: 'Customer communication and service excellence',
      recommendedLocation: 'Conference room',
      materials: ['Communication guides', 'Role-play scenarios', 'Feedback forms'],
      prerequisites: ['Basic communication skills'],
      learningObjectives: [
        'Professional communication',
        'Conflict resolution',
        'Customer satisfaction techniques'
      ],
      assessmentCriteria: ['Role-play assessment', 'Customer scenario test'],
      followUpRequired: true
    },
    leadership: {
      estimatedDuration: duration || '8 hours',
      estimatedCost: 5500,
      description: 'Team leadership and management skills',
      recommendedLocation: 'Training center',
      materials: ['Leadership materials', 'Team building exercises', 'Assessment tools'],
      prerequisites: ['6 months team experience'],
      learningObjectives: [
        'Team motivation techniques',
        'Decision making skills',
        'Performance management'
      ],
      assessmentCriteria: ['Leadership simulation', '360-degree feedback'],
      followUpRequired: true
    },
    speed: {
      estimatedDuration: duration || '2 hours',
      estimatedCost: 1800,
      description: 'Efficiency and speed optimization techniques',
      recommendedLocation: 'Operational area',
      materials: ['Timing equipment', 'Process guides', 'Efficiency tools'],
      prerequisites: ['Basic job competency'],
      learningObjectives: [
        'Time management',
        'Process optimization',
        'Quality maintenance under speed'
      ],
      assessmentCriteria: ['Timed practical test', 'Quality assessment'],
      followUpRequired: false
    },
    problem_solving: {
      estimatedDuration: duration || '5 hours',
      estimatedCost: 3800,
      description: 'Analytical thinking and problem resolution',
      recommendedLocation: 'Training room',
      materials: ['Case studies', 'Problem-solving frameworks', 'Analysis tools'],
      prerequisites: ['Basic job experience'],
      learningObjectives: [
        'Problem identification',
        'Root cause analysis',
        'Solution implementation'
      ],
      assessmentCriteria: ['Case study analysis', 'Problem-solving simulation'],
      followUpRequired: true
    }
  };
  
  return trainingPlans[skillType] || {
    estimatedDuration: duration || '4 hours',
    estimatedCost: 3000,
    description: `Professional development in ${skillType.replace('_', ' ')}`,
    recommendedLocation: 'Training facility',
    materials: ['Training materials', 'Assessment tools'],
    prerequisites: ['Basic competency'],
    learningObjectives: [`Improve ${skillType.replace('_', ' ')} skills`],
    assessmentCriteria: ['Practical assessment'],
    followUpRequired: false
  };
}

async function findAvailableTrainers(skillType: string, scheduledDate: Date) {
  // Mock trainer availability - in production, query trainer database
  const trainers = [
    {
      id: 'trainer_001',
      name: 'Lars Eriksson',
      specializations: ['heavy_lifting', 'safety', 'equipment_handling'],
      certification: 'Advanced Safety Instructor',
      availability: 'available',
      rating: 4.8
    },
    {
      id: 'trainer_002',
      name: 'Emma Johansson',
      specializations: ['customer_service', 'leadership', 'communication'],
      certification: 'Certified Leadership Coach',
      availability: 'available',
      rating: 4.9
    },
    {
      id: 'trainer_003',
      name: 'Andreas Pettersson',
      specializations: ['fragile_items', 'problem_solving', 'quality'],
      certification: 'Quality Management Expert',
      availability: 'busy',
      rating: 4.7
    }
  ];
  
  return trainers.filter(trainer => 
    trainer.specializations.includes(skillType) && 
    trainer.availability === 'available'
  );
}

function calculateResourceRequirements(skillType: string, participantCount: number, duration: string) {
  const baseRequirements = {
    room: participantCount <= 5 ? 'small_training_room' : participantCount <= 10 ? 'medium_training_room' : 'large_training_room',
    equipment: [],
    materials: [],
    estimatedSetupTime: 30 // minutes
  };
  
  switch (skillType) {
    case 'heavy_lifting':
      baseRequirements.equipment.push('lifting_aids', 'safety_equipment', 'weight_training_items');
      baseRequirements.materials.push('safety_manuals', 'technique_guides');
      baseRequirements.estimatedSetupTime = 60;
      break;
    case 'customer_service':
      baseRequirements.equipment.push('audio_visual', 'recording_equipment');
      baseRequirements.materials.push('role_play_scripts', 'communication_guides');
      break;
    case 'leadership':
      baseRequirements.equipment.push('flip_charts', 'projector', 'collaboration_tools');
      baseRequirements.materials.push('leadership_materials', 'assessment_forms');
      baseRequirements.estimatedSetupTime = 45;
      break;
    default:
      baseRequirements.equipment.push('basic_training_equipment');
      baseRequirements.materials.push('training_manuals');
  }
  
  return baseRequirements;
}

function calculateTrainingBusinessImpact(skillType: string, participantCount: number, priority: string) {
  const impactFactors = {
    heavy_lifting: { safety: 0.8, efficiency: 0.6, quality: 0.4 },
    fragile_items: { safety: 0.6, efficiency: 0.5, quality: 0.9 },
    customer_service: { safety: 0.2, efficiency: 0.4, quality: 0.8 },
    leadership: { safety: 0.5, efficiency: 0.8, quality: 0.7 },
    speed: { safety: 0.3, efficiency: 0.9, quality: 0.6 },
    problem_solving: { safety: 0.6, efficiency: 0.7, quality: 0.8 }
  };
  
  const factors = impactFactors[skillType as keyof typeof impactFactors] || { safety: 0.5, efficiency: 0.5, quality: 0.5 };
  const priorityMultiplier = priority === 'high' ? 1.3 : priority === 'medium' ? 1.0 : 0.7;
  const scaleMultiplier = Math.min(2.0, 1.0 + (participantCount - 1) * 0.1);
  
  return {
    expectedSafetyImprovement: Math.round(factors.safety * priorityMultiplier * scaleMultiplier * 100) / 10,
    expectedEfficiencyGain: Math.round(factors.efficiency * priorityMultiplier * scaleMultiplier * 100) / 10,
    expectedQualityImprovement: Math.round(factors.quality * priorityMultiplier * scaleMultiplier * 100) / 10,
    estimatedROI: Math.round((factors.efficiency + factors.quality) * priorityMultiplier * scaleMultiplier * 200),
    riskReduction: Math.round(factors.safety * priorityMultiplier * 100),
    participantImpact: participantCount
  };
}

function generateTrainingNotifications(trainingSession: any) {
  const notifications = [];
  
  // Participant notifications
  for (const participant of trainingSession.participants) {
    notifications.push({
      type: 'training_scheduled',
      recipientId: participant.id || participant,
      message: `Training scheduled: ${trainingSession.skillType.replace('_', ' ')} on ${new Date(trainingSession.scheduledDate).toDateString()}`,
      actionRequired: true,
      dueDate: trainingSession.scheduledDate,
      priority: trainingSession.priority
    });
  }
  
  // Manager notification
  notifications.push({
    type: 'training_scheduled_manager',
    recipientRole: 'team_manager',
    message: `Team training scheduled: ${trainingSession.skillType.replace('_', ' ')} for ${trainingSession.participants.length} staff members`,
    actionRequired: false,
    trainingId: trainingSession.id
  });
  
  // Trainer notification
  if (trainingSession.trainer) {
    notifications.push({
      type: 'training_assignment',
      recipientId: trainingSession.trainer.id,
      message: `Training assignment: ${trainingSession.skillType.replace('_', ' ')} on ${new Date(trainingSession.scheduledDate).toDateString()}`,
      actionRequired: true,
      preparationTime: '2 days',
      trainingId: trainingSession.id
    });
  }
  
  return notifications;
}

async function storeTrainingSession(trainingSession: any) {
  // Mock implementation - in production, save to database
  console.log('💾 Storing training session:', trainingSession.id);
  return true;
}

function generateFallbackTrainingOptions(skillType: string, priority: string) {
  return [
    {
      option: 'self_paced_online',
      description: `Online ${skillType.replace('_', ' ')} training module`,
      duration: '2-4 hours',
      cost: 'Low',
      availability: 'Immediate'
    },
    {
      option: 'peer_mentoring',
      description: `Pair with experienced colleague for ${skillType.replace('_', ' ')} mentoring`,
      duration: '1 week',
      cost: 'Very low',
      availability: 'Within 2 days'
    },
    {
      option: 'external_training',
      description: `External training provider for ${skillType.replace('_', ' ')}`,
      duration: 'Variable',
      cost: 'High',
      availability: '2-4 weeks'
    }
  ];
}

function generateMockTrainingSchedule(startDate?: string, endDate?: string, skillType?: string, status?: string) {
  const trainingSessions = [
    {
      id: 'training_001',
      skillType: 'heavy_lifting',
      priority: 'high',
      duration: '4 hours',
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      participants: [1, 2, 3],
      trainer: { id: 'trainer_001', name: 'Lars Eriksson' },
      status: 'scheduled',
      location: 'Training warehouse'
    },
    {
      id: 'training_002',
      skillType: 'customer_service',
      priority: 'medium',
      duration: '6 hours',
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      participants: [4, 5],
      trainer: { id: 'trainer_002', name: 'Emma Johansson' },
      status: 'scheduled',
      location: 'Conference room'
    },
    {
      id: 'training_003',
      skillType: 'leadership',
      priority: 'low',
      duration: '8 hours',
      scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      participants: [1, 6],
      trainer: { id: 'trainer_002', name: 'Emma Johansson' },
      status: 'completed',
      location: 'Training center'
    }
  ];
  
  // Apply filters
  let filtered = trainingSessions;
  
  if (skillType) {
    filtered = filtered.filter(session => session.skillType === skillType);
  }
  
  if (status && status !== 'all') {
    filtered = filtered.filter(session => session.status === status);
  }
  
  if (startDate) {
    filtered = filtered.filter(session => session.scheduledDate >= startDate);
  }
  
  if (endDate) {
    filtered = filtered.filter(session => session.scheduledDate <= endDate);
  }
  
  return filtered;
}