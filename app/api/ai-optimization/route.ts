import { NextRequest, NextResponse } from 'next/server'
import { RobustOptimizationEngine } from '../../../lib/ai/robust-optimization'

// Global optimization engine instance
let optimizationEngine: RobustOptimizationEngine | null = null

// Initialize the optimization engine
async function getOptimizationEngine(): Promise<RobustOptimizationEngine> {
  if (!optimizationEngine) {
    optimizationEngine = new RobustOptimizationEngine()
    await optimizationEngine.initialize()
  }
  return optimizationEngine
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobs, teams, date, config } = body

    // Validate request
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json(
        { error: 'Inga jobb att optimera' },
        { status: 400 }
      )
    }

    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return NextResponse.json(
        { error: 'Inga team tillgängliga' },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Datum krävs' },
        { status: 400 }
      )
    }

    // Get optimization engine
    const engine = await getOptimizationEngine()

    // Run optimization
    const result = await engine.optimizeSchedule(jobs, teams, date, config)

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Optimization API error:', error)
    return NextResponse.json(
      { 
        error: 'Optimering misslyckades',
        details: error instanceof Error ? error.message : 'Okänt fel'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const engine = await getOptimizationEngine()

    switch (action) {
      case 'status':
        const status = engine.getSystemStatus()
        return NextResponse.json({
          success: true,
          data: status,
          timestamp: new Date().toISOString()
        })

      case 'history':
        const history = Array.from(engine.getOptimizationHistory().entries()).map(([id, result]) => ({
          id,
          date: result.weather_impact?.date || 'unknown',
          efficiency_score: result.efficiency_score,
          algorithm_used: result.algorithm_used,
          success: result.success
        }))
        
        return NextResponse.json({
          success: true,
          data: history,
          timestamp: new Date().toISOString()
        })

      case 'errors':
        const errors = engine.getErrorLog().slice(-10) // Last 10 errors
        return NextResponse.json({
          success: true,
          data: errors,
          timestamp: new Date().toISOString()
        })

      default:
        // Return mock optimization data for demo
        return NextResponse.json({
          success: true,
          data: {
            geographic_efficiency: 92,
            team_efficiency: 88,
            route_efficiency: 90,
            congestion_tax_cost: 15980,
            weather_impact: 'Snöjustering +10 min per jobb',
            total_jobs: 24,
            total_teams: 6,
            estimated_completion_time: '17:30',
            optimization_score: 89,
            algorithm_used: 'DBSCAN+VRP+ML-Enhanced'
          },
          timestamp: new Date().toISOString()
        })
    }

  } catch (error) {
    console.error('AI Optimization GET error:', error)
    return NextResponse.json(
      { 
        error: 'Kunde inte hämta optimeringsdata',
        details: error instanceof Error ? error.message : 'Okänt fel'
      },
      { status: 500 }
    )
  }
}

// Real-time reoptimization endpoint
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { optimizationId, delayedTeamId, delayMinutes, originalOptimization } = body

    if (!originalOptimization || !delayedTeamId || delayMinutes === undefined) {
      return NextResponse.json(
        { error: 'Ofullständig data för reoptimering' },
        { status: 400 }
      )
    }

    const engine = await getOptimizationEngine()
    
    const reoptimizedResult = await engine.reoptimizeForDelay(
      originalOptimization,
      delayedTeamId,
      delayMinutes
    )

    return NextResponse.json({
      success: true,
      data: reoptimizedResult,
      message: `Team ${delayedTeamId} reoptimerad efter ${delayMinutes} min försening`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Real-time reoptimization error:', error)
    return NextResponse.json(
      { 
        error: 'Reoptimering misslyckades',
        details: error instanceof Error ? error.message : 'Okänt fel'
      },
      { status: 500 }
    )
  }
}