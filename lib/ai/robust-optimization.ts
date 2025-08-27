// Robust AI Optimization Engine
// Combines DBSCAN, VRP, ML with fallback systems and error handling

import { GeographicOptimizer } from './clustering'
import { VRPOptimizer } from './vrp-optimizer'
import { TeamSizingAI } from './team-sizing'
import { StockholmWeatherService } from '../weather/stockholm-weather'

interface Job {
  id: string
  customer_name: string
  address: string
  latitude: number
  longitude: number
  estimated_volume_m3: number
  estimated_duration_minutes: number
  floors_total: number
  elevator_available: boolean
  stairs_flights: number
  piano_count: number
  heavy_appliances_count: number
  fragile_items_count: number
  disassembly_required: boolean
  parking_distance_meters: number
  narrow_staircase: boolean
  customer_urgency_level: number
  customer_flexibility_level: number
  time_window_start?: string
  time_window_end?: string
  priority: number
  difficulty_score: number
}

interface Team {
  id: string
  name: string
  members: Array<{
    id: string
    name: string
    skill_level: number
    experience_years: number
  }>
  capacity_m3: number
  available_hours: number
  skill_level: number
  vehicle_type: 'small' | 'medium' | 'large'
  current_location_lat?: number
  current_location_lng?: number
}

interface OptimizationResult {
  success: boolean
  algorithm_used: string
  efficiency_score: number
  routes: Array<{
    team_id: string
    team_name: string
    recommended_team_size: number
    job_sequence: Job[]
    estimated_total_duration: number
    estimated_travel_time: number
    estimated_work_time: number
    efficiency_score: number
    congestion_tax_cost: number
    route_distance_km: number
  }>
  weather_impact: any
  total_congestion_tax_cost: number
  total_distance_km: number
  total_estimated_duration: number
  optimization_time_ms: number
  fallback_reason?: string
  warnings: string[]
  recommendations: string[]
}

interface OptimizationConfig {
  enable_weather_integration: boolean
  enable_congestion_tax_optimization: boolean
  enable_ml_team_sizing: boolean
  max_optimization_time_ms: number
  fallback_mode: 'simple' | 'manual' | 'hybrid'
  safety_first: boolean
}

export class RobustOptimizationEngine {
  private geographicOptimizer: GeographicOptimizer
  private vrpOptimizer: VRPOptimizer
  private teamSizingAI: TeamSizingAI
  private weatherService: StockholmWeatherService
  
  private optimizationHistory: Map<string, OptimizationResult> = new Map()
  private errorLog: Array<{ timestamp: Date, error: string, context: any }> = []

  constructor() {
    this.geographicOptimizer = new GeographicOptimizer()
    this.vrpOptimizer = new VRPOptimizer()
    this.teamSizingAI = new TeamSizingAI()
    this.weatherService = new StockholmWeatherService()
  }

  async initialize(): Promise<void> {
    try {
      await this.teamSizingAI.initialize()
      console.log('🤖 AI Optimization Engine initialized successfully')
    } catch (error) {
      console.error('Failed to initialize AI components:', error)
      this.logError('Initialization failed', { error: error.message })
    }
  }

  async optimizeSchedule(
    jobs: Job[],
    teams: Team[],
    date: string,
    config: OptimizationConfig = this.getDefaultConfig()
  ): Promise<OptimizationResult> {
    const startTime = Date.now()
    const optimizationId = `optimization_${date}_${startTime}`

    try {
      // Validate inputs
      const validation = this.validateInputs(jobs, teams, date)
      if (!validation.valid) {
        return this.createErrorResult(validation.reason, startTime)
      }

      // Try main optimization algorithm
      const result = await this.runMainOptimization(jobs, teams, date, config, startTime)
      
      // Store successful result
      this.optimizationHistory.set(optimizationId, result)
      
      return result

    } catch (error) {
      this.logError('Main optimization failed', { jobs: jobs.length, teams: teams.length, error: error.message })
      
      // Try fallback optimization
      return await this.runFallbackOptimization(jobs, teams, date, config, startTime, error.message)
    }
  }

  private async runMainOptimization(
    jobs: Job[],
    teams: Team[],
    date: string,
    config: OptimizationConfig,
    startTime: number
  ): Promise<OptimizationResult> {
    const warnings: string[] = []
    const recommendations: string[] = []

    // Step 1: Get weather data
    let weatherData = null
    if (config.enable_weather_integration) {
      try {
        weatherData = await this.weatherService.getWeatherForDate(date)
        
        if (weatherData.safety_warnings.length > 0) {
          warnings.push(...weatherData.safety_warnings)
        }
        
        if (weatherData.equipment_recommendations.length > 0) {
          recommendations.push(...weatherData.equipment_recommendations)
        }

        // Safety check
        if (config.safety_first && weatherData.moving_difficulty_multiplier > 2.0) {
          warnings.push('Extrema väderförhållanden - överväg att flytta jobb till annan dag')
        }
      } catch (error) {
        warnings.push('Väderdata kunde inte hämtas - använder standardvärden')
        weatherData = await this.weatherService.getWeatherForDate(date) // Will return fallback data
      }
    }

    // Step 2: Geographic clustering with DBSCAN
    const clusteringResult = await this.geographicOptimizer.clusterJobsWithDBSCAN(jobs, date)
    
    if (clusteringResult.efficiency_score < 60) {
      warnings.push('Låg geografisk effektivitet - överväg att omfördela jobb')
    }

    // Step 3: Enhanced team allocation with ML
    const enhancedTeams = []
    for (let i = 0; i < Math.min(clusteringResult.clusters.length, teams.length); i++) {
      const cluster = clusteringResult.clusters[i]
      const team = teams[i]
      
      let recommendedTeamSize = team.members.length
      
      if (config.enable_ml_team_sizing && cluster.jobs.length > 0) {
        try {
          // Get ML recommendation for the most complex job in cluster
          const mostComplexJob = cluster.jobs.reduce((prev, current) => 
            current.difficulty_score > prev.difficulty_score ? current : prev
          )
          
          const teamAvailability = {
            total_available_people: team.members.length,
            experienced_people: team.members.filter(m => m.experience_years > 2).length,
            new_people: team.members.filter(m => m.experience_years <= 2).length,
            current_workload: 0.8 // 80% current utilization
          }
          
          const mlRecommendation = await this.teamSizingAI.recommendOptimalTeamSize(
            mostComplexJob,
            weatherData,
            teamAvailability
          )
          
          recommendedTeamSize = mlRecommendation.recommended_size
          
          if (mlRecommendation.confidence_score < 70) {
            warnings.push(`Låg konfidensgrad (${mlRecommendation.confidence_score}%) för teamstorlek på ${team.name}`)
          }
          
          recommendations.push(...mlRecommendation.reasoning)
          
        } catch (error) {
          warnings.push(`ML teamstorlek misslyckades för ${team.name} - använder standardstorlek`)
        }
      }
      
      enhancedTeams.push({
        ...team,
        recommended_team_size: recommendedTeamSize
      })
    }

    // Step 4: VRP route optimization
    const vrpResult = await this.vrpOptimizer.optimizeTeamRoutes(
      clusteringResult.clusters,
      teams,
      date
    )

    // Step 5: Combine results and calculate metrics
    const routes = vrpResult.routes.map((route, index) => ({
      ...route,
      recommended_team_size: enhancedTeams[index]?.recommended_team_size || route.team_name.length
    }))

    const totalEfficiency = this.calculateTotalEfficiency(
      clusteringResult.efficiency_score,
      vrpResult.total_efficiency,
      weatherData?.moving_difficulty_multiplier || 1.0
    )

    // Step 6: Generate final recommendations
    if (totalEfficiency > 90) {
      recommendations.push('Utmärkt optimering uppnådd - kör enligt plan')
    } else if (totalEfficiency > 80) {
      recommendations.push('Bra optimering - smärre justeringar kan förbättra effektiviteten')
    } else {
      recommendations.push('Optimering under förväntan - överväg omplanering')
      warnings.push('Låg total effektivitet - kontrollera jobbfördelning och teamtillgänglighet')
    }

    const optimizationTime = Date.now() - startTime

    return {
      success: true,
      algorithm_used: 'DBSCAN+VRP+ML-Enhanced',
      efficiency_score: Math.round(totalEfficiency),
      routes,
      weather_impact: weatherData,
      total_congestion_tax_cost: vrpResult.total_congestion_tax_cost,
      total_distance_km: Math.round(vrpResult.total_distance_km * 10) / 10,
      total_estimated_duration: routes.reduce((sum, route) => sum + route.estimated_total_duration, 0),
      optimization_time_ms: optimizationTime,
      warnings,
      recommendations
    }
  }

  private async runFallbackOptimization(
    jobs: Job[],
    teams: Team[],
    date: string,
    config: OptimizationConfig,
    startTime: number,
    errorReason: string
  ): Promise<OptimizationResult> {
    console.warn('Running fallback optimization due to:', errorReason)

    try {
      switch (config.fallback_mode) {
        case 'simple':
          return this.runSimpleFallback(jobs, teams, date, startTime, errorReason)
        case 'manual':
          return this.runManualFallback(jobs, teams, date, startTime, errorReason)
        case 'hybrid':
        default:
          return this.runHybridFallback(jobs, teams, date, startTime, errorReason)
      }
    } catch (fallbackError) {
      this.logError('Fallback optimization failed', { 
        originalError: errorReason, 
        fallbackError: fallbackError.message 
      })
      
      return this.runEmergencyFallback(jobs, teams, date, startTime, errorReason)
    }
  }

  private runSimpleFallback(
    jobs: Job[],
    teams: Team[],
    date: string,
    startTime: number,
    errorReason: string
  ): OptimizationResult {
    // Simple round-robin assignment
    const routes = teams.map((team, teamIndex) => {
      const teamJobs = jobs.filter((_, jobIndex) => jobIndex % teams.length === teamIndex)
      
      // Sort jobs by priority and distance from Stockholm center
      teamJobs.sort((a, b) => {
        const priorityDiff = a.priority - b.priority
        if (priorityDiff !== 0) return priorityDiff
        
        // Distance from city center (simplified)
        const distanceA = Math.abs(a.latitude - 59.3293) + Math.abs(a.longitude - 18.0686)
        const distanceB = Math.abs(b.latitude - 59.3293) + Math.abs(b.longitude - 18.0686)
        return distanceA - distanceB
      })
      
      const estimatedDuration = teamJobs.reduce((sum, job) => 
        sum + (job.estimated_duration_minutes || 120), 0
      ) + teamJobs.length * 20 // 20 min travel between jobs
      
      return {
        team_id: team.id,
        team_name: team.name,
        recommended_team_size: Math.min(team.members.length, 3),
        job_sequence: teamJobs,
        estimated_total_duration: estimatedDuration,
        estimated_travel_time: teamJobs.length * 20,
        estimated_work_time: estimatedDuration - teamJobs.length * 20,
        efficiency_score: 70, // Conservative estimate
        congestion_tax_cost: teamJobs.length * 25, // Rough estimate
        route_distance_km: teamJobs.length * 15 // Rough estimate
      }
    })

    return {
      success: true,
      algorithm_used: 'Simple-Fallback',
      efficiency_score: 70,
      routes,
      weather_impact: null,
      total_congestion_tax_cost: routes.reduce((sum, route) => sum + route.congestion_tax_cost, 0),
      total_distance_km: routes.reduce((sum, route) => sum + route.route_distance_km, 0),
      total_estimated_duration: routes.reduce((sum, route) => sum + route.estimated_total_duration, 0),
      optimization_time_ms: Date.now() - startTime,
      fallback_reason: errorReason,
      warnings: ['Använder förenklad optimering på grund av tekniskt fel'],
      recommendations: ['Kontrollera systemstatus och kör ny optimering när möjligt']
    }
  }

  private runManualFallback(
    jobs: Job[],
    teams: Team[],
    date: string,
    startTime: number,
    errorReason: string
  ): OptimizationResult {
    // Manual assignment based on business rules
    const routes = []
    const assignedJobs = new Set<string>()
    
    // Sort teams by capacity (largest first)
    const sortedTeams = [...teams].sort((a, b) => b.capacity_m3 - a.capacity_m3)
    
    // Sort jobs by difficulty and volume
    const sortedJobs = [...jobs].sort((a, b) => {
      const scoreA = a.difficulty_score + (a.estimated_volume_m3 || 15) / 10
      const scoreB = b.difficulty_score + (b.estimated_volume_m3 || 15) / 10
      return scoreB - scoreA // Hardest jobs first
    })
    
    for (const team of sortedTeams) {
      const teamJobs: Job[] = []
      let currentCapacity = 0
      let currentDuration = 0
      const maxDuration = team.available_hours * 60
      
      for (const job of sortedJobs) {
        if (assignedJobs.has(job.id)) continue
        
        const jobVolume = job.estimated_volume_m3 || 15
        const jobDuration = job.estimated_duration_minutes || 120
        
        // Check capacity and time constraints
        if (currentCapacity + jobVolume <= team.capacity_m3 && 
            currentDuration + jobDuration <= maxDuration) {
          teamJobs.push(job)
          assignedJobs.add(job.id)
          currentCapacity += jobVolume
          currentDuration += jobDuration
        }
      }
      
      if (teamJobs.length > 0) {
        routes.push({
          team_id: team.id,
          team_name: team.name,
          recommended_team_size: Math.min(team.members.length, Math.ceil(currentCapacity / 20)),
          job_sequence: teamJobs,
          estimated_total_duration: currentDuration + teamJobs.length * 15, // Add travel time
          estimated_travel_time: teamJobs.length * 15,
          estimated_work_time: currentDuration,
          efficiency_score: Math.min(90, 60 + (teamJobs.length * 5)), // Bonus for more jobs
          congestion_tax_cost: teamJobs.length * 30,
          route_distance_km: teamJobs.length * 12
        })
      }
    }
    
    return {
      success: true,
      algorithm_used: 'Manual-Business-Rules',
      efficiency_score: 75,
      routes,
      weather_impact: null,
      total_congestion_tax_cost: routes.reduce((sum, route) => sum + route.congestion_tax_cost, 0),
      total_distance_km: routes.reduce((sum, route) => sum + route.route_distance_km, 0),
      total_estimated_duration: routes.reduce((sum, route) => sum + route.estimated_total_duration, 0),
      optimization_time_ms: Date.now() - startTime,
      fallback_reason: errorReason,
      warnings: ['Använder manuella affärsregler för optimering'],
      recommendations: ['Resultatet baseras på kapacitet och svårighetsgrad istället för geografisk optimering']
    }
  }

  private runHybridFallback(
    jobs: Job[],
    teams: Team[],
    date: string,
    startTime: number,
    errorReason: string
  ): OptimizationResult {
    // Combine simple geographic grouping with manual rules
    try {
      // Simple geographic grouping (without DBSCAN)
      const stockholmCenter = { lat: 59.3293, lng: 18.0686 }
      const zones = [
        { name: 'City', lat: 59.3293, lng: 18.0686, radius: 0.02 },
        { name: 'North', lat: 59.3500, lng: 18.0686, radius: 0.03 },
        { name: 'South', lat: 59.3100, lng: 18.0686, radius: 0.03 },
        { name: 'East', lat: 59.3293, lng: 18.1000, radius: 0.03 },
        { name: 'West', lat: 59.3293, lng: 18.0300, radius: 0.03 }
      ]
      
      const jobsByZone = new Map<string, Job[]>()
      
      // Assign jobs to zones
      for (const job of jobs) {
        let assignedZone = 'Other'
        let minDistance = Infinity
        
        for (const zone of zones) {
          const distance = Math.sqrt(
            Math.pow(job.latitude - zone.lat, 2) + 
            Math.pow(job.longitude - zone.lng, 2)
          )
          
          if (distance <= zone.radius && distance < minDistance) {
            assignedZone = zone.name
            minDistance = distance
          }
        }
        
        if (!jobsByZone.has(assignedZone)) {
          jobsByZone.set(assignedZone, [])
        }
        jobsByZone.get(assignedZone)!.push(job)
      }
      
      // Assign zones to teams
      const routes = []
      const teamIndex = 0
      
      for (const [zoneName, zoneJobs] of jobsByZone.entries()) {
        if (zoneJobs.length === 0 || teamIndex >= teams.length) continue
        
        const team = teams[teamIndex % teams.length]
        
        // Apply manual optimization within zone
        const optimizedJobs = this.optimizeJobsWithinZone(zoneJobs, team)
        
        routes.push({
          team_id: team.id,
          team_name: `${team.name} (${zoneName})`,
          recommended_team_size: Math.min(team.members.length, Math.max(2, Math.ceil(optimizedJobs.length / 2))),
          job_sequence: optimizedJobs,
          estimated_total_duration: optimizedJobs.length * 90 + optimizedJobs.length * 10, // Work + travel
          estimated_travel_time: optimizedJobs.length * 10,
          estimated_work_time: optimizedJobs.length * 90,
          efficiency_score: 80 - Math.max(0, optimizedJobs.length - 4) * 5, // Penalty for too many jobs
          congestion_tax_cost: zoneName === 'City' ? optimizedJobs.length * 35 : optimizedJobs.length * 20,
          route_distance_km: optimizedJobs.length * 8 // Shorter distances within zones
        })
      }
      
      return {
        success: true,
        algorithm_used: 'Hybrid-Geographic-Manual',
        efficiency_score: 80,
        routes,
        weather_impact: null,
        total_congestion_tax_cost: routes.reduce((sum, route) => sum + route.congestion_tax_cost, 0),
        total_distance_km: routes.reduce((sum, route) => sum + route.route_distance_km, 0),
        total_estimated_duration: routes.reduce((sum, route) => sum + route.estimated_total_duration, 0),
        optimization_time_ms: Date.now() - startTime,
        fallback_reason: errorReason,
        warnings: ['Använder hybrid optimering (geografisk + manuell)'],
        recommendations: ['Bättre än enkel fallback men inte lika optimal som full AI-optimering']
      }
      
    } catch (hybridError) {
      // If hybrid fails, fall back to simple
      return this.runSimpleFallback(jobs, teams, date, startTime, errorReason)
    }
  }

  private optimizeJobsWithinZone(jobs: Job[], team: Team): Job[] {
    // Sort by priority, then by estimated duration
    return jobs.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return (a.estimated_duration_minutes || 120) - (b.estimated_duration_minutes || 120)
    })
  }

  private runEmergencyFallback(
    jobs: Job[],
    teams: Team[],
    date: string,
    startTime: number,
    errorReason: string
  ): OptimizationResult {
    // Absolute minimum fallback - just distribute jobs evenly
    const routes = teams.map((team, index) => ({
      team_id: team.id,
      team_name: team.name,
      recommended_team_size: 2,
      job_sequence: jobs.filter((_, jobIndex) => jobIndex % teams.length === index),
      estimated_total_duration: 480, // 8 hours default
      estimated_travel_time: 120,
      estimated_work_time: 360,
      efficiency_score: 50,
      congestion_tax_cost: 200,
      route_distance_km: 50
    }))

    return {
      success: false,
      algorithm_used: 'Emergency-Fallback',
      efficiency_score: 50,
      routes,
      weather_impact: null,
      total_congestion_tax_cost: routes.length * 200,
      total_distance_km: routes.length * 50,
      total_estimated_duration: routes.length * 480,
      optimization_time_ms: Date.now() - startTime,
      fallback_reason: `Emergency fallback: ${errorReason}`,
      warnings: ['KRITISKT: Nödläge aktiverat - kontakta IT-support omedelbart'],
      recommendations: ['Använd manuell schemaläggning tills systemet är återställt']
    }
  }

  private validateInputs(jobs: Job[], teams: Team[], date: string): { valid: boolean, reason?: string } {
    if (!jobs || jobs.length === 0) {
      return { valid: false, reason: 'Inga jobb att optimera' }
    }
    
    if (!teams || teams.length === 0) {
      return { valid: false, reason: 'Inga team tillgängliga' }
    }
    
    if (!date || isNaN(new Date(date).getTime())) {
      return { valid: false, reason: 'Ogiltigt datum' }
    }
    
    // Check if jobs have required fields
    for (const job of jobs) {
      if (!job.latitude || !job.longitude) {
        return { valid: false, reason: `Jobb ${job.id} saknar koordinater` }
      }
    }
    
    return { valid: true }
  }

  private calculateTotalEfficiency(
    geographicEfficiency: number,
    routeEfficiency: number,
    weatherMultiplier: number
  ): number {
    // Weighted average of different efficiency factors
    const baseEfficiency = (geographicEfficiency * 0.4) + (routeEfficiency * 0.6)
    
    // Apply weather penalty
    const weatherAdjusted = baseEfficiency * (2 - weatherMultiplier) * 0.5
    
    return Math.max(30, Math.min(100, Math.round(weatherAdjusted)))
  }

  private createErrorResult(reason: string, startTime: number): OptimizationResult {
    return {
      success: false,
      algorithm_used: 'None',
      efficiency_score: 0,
      routes: [],
      weather_impact: null,
      total_congestion_tax_cost: 0,
      total_distance_km: 0,
      total_estimated_duration: 0,
      optimization_time_ms: Date.now() - startTime,
      warnings: [reason],
      recommendations: ['Korrigera indata och försök igen']
    }
  }

  private logError(message: string, context: any): void {
    this.errorLog.push({
      timestamp: new Date(),
      error: message,
      context
    })
    
    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog.shift()
    }
  }

  private getDefaultConfig(): OptimizationConfig {
    return {
      enable_weather_integration: true,
      enable_congestion_tax_optimization: true,
      enable_ml_team_sizing: true,
      max_optimization_time_ms: 30000, // 30 seconds
      fallback_mode: 'hybrid',
      safety_first: true
    }
  }

  // Public methods for real-time updates and monitoring
  async reoptimizeForDelay(
    originalOptimization: OptimizationResult,
    delayedTeamId: string,
    delayMinutes: number
  ): Promise<OptimizationResult> {
    try {
      const delayedRoute = originalOptimization.routes.find(r => r.team_id === delayedTeamId)
      if (!delayedRoute) {
        throw new Error('Team not found in original optimization')
      }

      // Re-optimize remaining jobs for the delayed team
      const reoptimizedRoute = await this.vrpOptimizer.reoptimizeForDelay(
        delayedRoute,
        0, // Assume currently at first job
        delayMinutes
      )

      // Update the optimization result
      const updatedRoutes = originalOptimization.routes.map(route => 
        route.team_id === delayedTeamId ? reoptimizedRoute : route
      )

      return {
        ...originalOptimization,
        routes: updatedRoutes,
        algorithm_used: 'Real-time-Reoptimization',
        warnings: [...originalOptimization.warnings, `Team ${delayedTeamId} re-optimized due to ${delayMinutes} min delay`]
      }

    } catch (error) {
      this.logError('Real-time reoptimization failed', { delayedTeamId, delayMinutes, error: error.message })
      return originalOptimization // Return original if reoptimization fails
    }
  }

  getOptimizationHistory(): Map<string, OptimizationResult> {
    return new Map(this.optimizationHistory)
  }

  getErrorLog(): Array<{ timestamp: Date, error: string, context: any }> {
    return [...this.errorLog]
  }

  getSystemStatus(): {
    ai_model_accuracy: number
    weather_service_status: 'online' | 'offline'
    optimization_cache_size: number
    error_count_24h: number
  } {
    const last24h = Date.now() - 24 * 60 * 60 * 1000
    const recent_errors = this.errorLog.filter(e => e.timestamp.getTime() > last24h)

    return {
      ai_model_accuracy: this.teamSizingAI.getModelAccuracy(),
      weather_service_status: 'online', // Would check actual service
      optimization_cache_size: this.optimizationHistory.size,
      error_count_24h: recent_errors.length
    }
  }
}