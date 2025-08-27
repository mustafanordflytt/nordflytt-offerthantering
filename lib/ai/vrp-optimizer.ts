// Vehicle Routing Problem (VRP) Optimizer
// Uses OR-Tools inspired algorithms for multi-team route optimization

interface Job {
  id: string
  latitude: number
  longitude: number
  estimated_duration_minutes: number
  estimated_volume_m3: number
  time_window_start?: string
  time_window_end?: string
  priority?: number
}

interface Team {
  id: string
  name: string
  capacity_m3: number
  available_hours: number
  skill_level: number
  current_location_lat?: number
  current_location_lng?: number
  vehicle_type: 'small' | 'medium' | 'large'
}

interface JobCluster {
  id: string
  center_lat: number
  center_lng: number
  jobs: Job[]
}

interface OptimizedRoute {
  team_id: string
  team_name: string
  job_sequence: Job[]
  estimated_total_duration: number
  estimated_travel_time: number
  estimated_work_time: number
  efficiency_score: number
  congestion_tax_cost: number
  route_distance_km: number
}

interface WeatherData {
  moving_difficulty_multiplier: number
  requires_extra_time: boolean
  extra_time_minutes: number
}

interface TrafficData {
  average_speed_factor: number
  congestion_level: number
}

interface CongestionTaxData {
  is_active: boolean
  rate_per_hour: number
  zones: Array<{lat: number, lng: number, radius: number}>
}

export class VRPOptimizer {
  private readonly EARTH_RADIUS_KM = 6371
  private readonly AVERAGE_SPEED_KMH = 30 // Stockholm city average
  private readonly DEPOT_LAT = 59.3293 // Nordflytt HQ coordinates
  private readonly DEPOT_LNG = 18.0686

  async optimizeTeamRoutes(
    jobClusters: JobCluster[],
    availableTeams: Team[],
    date: string
  ): Promise<{
    routes: OptimizedRoute[]
    total_efficiency: number
    total_congestion_tax_cost: number
    total_distance_km: number
    optimization_time_ms: number
  }> {
    const startTime = Date.now()
    
    const [weather, traffic, congestionTax] = await Promise.all([
      this.fetchWeatherData(date),
      this.fetchTrafficData(date),
      this.fetchCongestionTaxData(date)
    ])

    const optimizedRoutes: OptimizedRoute[] = []
    let totalCongestionTaxCost = 0
    let totalDistanceKm = 0

    // Optimize each cluster with available teams
    for (let i = 0; i < jobClusters.length && i < availableTeams.length; i++) {
      const cluster = jobClusters[i]
      const team = availableTeams[i]
      
      const route = await this.solveVRPForCluster(
        cluster, 
        team, 
        weather, 
        traffic, 
        congestionTax
      )
      
      optimizedRoutes.push(route)
      totalCongestionTaxCost += route.congestion_tax_cost
      totalDistanceKm += route.route_distance_km
    }

    const totalEfficiency = this.calculateTotalEfficiency(optimizedRoutes)
    const optimizationTime = Date.now() - startTime

    return {
      routes: optimizedRoutes,
      total_efficiency: totalEfficiency,
      total_congestion_tax_cost: totalCongestionTaxCost,
      total_distance_km: totalDistanceKm,
      optimization_time_ms: optimizationTime
    }
  }

  private async solveVRPForCluster(
    cluster: JobCluster,
    team: Team,
    weather: WeatherData,
    traffic: TrafficData,
    congestionTax: CongestionTaxData
  ): Promise<OptimizedRoute> {
    const jobs = cluster.jobs
    
    // Calculate distance matrix including depot
    const locations = [
      { lat: this.DEPOT_LAT, lng: this.DEPOT_LNG }, // Depot at index 0
      ...jobs.map(job => ({ lat: job.latitude, lng: job.longitude }))
    ]
    
    const distanceMatrix = this.calculateDistanceMatrix(locations, weather, traffic)
    const timeWindows = this.extractTimeWindows(jobs)
    const demands = jobs.map(job => job.estimated_volume_m3 || 15)
    
    // Use nearest neighbor heuristic with 2-opt improvement
    let bestRoute = this.nearestNeighborTSP(distanceMatrix, timeWindows, demands, team.capacity_m3)
    bestRoute = this.improveTwoOpt(bestRoute, distanceMatrix)
    
    // Apply capacity and time window constraints
    bestRoute = this.applyConstraints(bestRoute, jobs, team, timeWindows, demands)
    
    // Calculate route metrics
    const routeMetrics = this.calculateRouteMetrics(
      bestRoute, 
      jobs, 
      distanceMatrix, 
      weather, 
      traffic, 
      congestionTax
    )

    return {
      team_id: team.id,
      team_name: team.name,
      job_sequence: bestRoute.map(index => jobs[index - 1]).filter(Boolean), // -1 because depot is at index 0
      estimated_total_duration: routeMetrics.totalDuration,
      estimated_travel_time: routeMetrics.travelTime,
      estimated_work_time: routeMetrics.workTime,
      efficiency_score: routeMetrics.efficiencyScore,
      congestion_tax_cost: routeMetrics.congestionTaxCost,
      route_distance_km: routeMetrics.totalDistance
    }
  }

  private nearestNeighborTSP(
    distanceMatrix: number[][],
    timeWindows: Array<{start: number, end: number}>,
    demands: number[],
    vehicleCapacity: number
  ): number[] {
    const n = distanceMatrix.length
    const visited = new Array(n).fill(false)
    const route: number[] = [0] // Start at depot
    visited[0] = true
    
    let currentLocation = 0
    let currentCapacity = 0
    
    while (route.length < n) {
      let nearestDistance = Infinity
      let nearestLocation = -1
      
      // Find nearest unvisited location that satisfies constraints
      for (let i = 1; i < n; i++) { // Skip depot (index 0)
        if (visited[i]) continue
        
        const distance = distanceMatrix[currentLocation][i]
        const demand = demands[i - 1] || 0 // -1 because demands array doesn't include depot
        
        // Check capacity constraint
        if (currentCapacity + demand > vehicleCapacity) continue
        
        // Check time window constraint (simplified)
        const jobIndex = i - 1
        if (jobIndex >= 0 && timeWindows[jobIndex]) {
          // Basic time window check - in reality this would be more complex
          const estimatedArrival = Date.now() + (distance / this.AVERAGE_SPEED_KMH) * 60 * 60 * 1000
          const windowStart = timeWindows[jobIndex].start
          const windowEnd = timeWindows[jobIndex].end
          
          if (estimatedArrival < windowStart || estimatedArrival > windowEnd) {
            continue // Skip if outside time window
          }
        }
        
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestLocation = i
        }
      }
      
      if (nearestLocation === -1) {
        // No feasible location found, return to depot if needed
        break
      }
      
      route.push(nearestLocation)
      visited[nearestLocation] = true
      currentLocation = nearestLocation
      
      if (nearestLocation > 0) {
        currentCapacity += demands[nearestLocation - 1] || 0
      }
    }
    
    // Return to depot
    if (route[route.length - 1] !== 0) {
      route.push(0)
    }
    
    return route
  }

  private improveTwoOpt(route: number[], distanceMatrix: number[][]): number[] {
    let improved = true
    let bestRoute = [...route]
    
    while (improved) {
      improved = false
      const currentDistance = this.calculateRouteDistance(bestRoute, distanceMatrix)
      
      for (let i = 1; i < bestRoute.length - 2; i++) {
        for (let j = i + 1; j < bestRoute.length - 1; j++) {
          // Create new route by reversing segment between i and j
          const newRoute = [
            ...bestRoute.slice(0, i),
            ...bestRoute.slice(i, j + 1).reverse(),
            ...bestRoute.slice(j + 1)
          ]
          
          const newDistance = this.calculateRouteDistance(newRoute, distanceMatrix)
          
          if (newDistance < currentDistance) {
            bestRoute = newRoute
            improved = true
            break
          }
        }
        if (improved) break
      }
    }
    
    return bestRoute
  }

  private applyConstraints(
    route: number[],
    jobs: Job[],
    team: Team,
    timeWindows: Array<{start: number, end: number}>,
    demands: number[]
  ): number[] {
    // Check total capacity
    const totalDemand = route
      .filter(index => index > 0) // Exclude depot
      .reduce((sum, index) => sum + (demands[index - 1] || 0), 0)
    
    if (totalDemand > team.capacity_m3) {
      // Remove lowest priority jobs until under capacity
      return this.reduceRouteToCapacity(route, jobs, demands, team.capacity_m3)
    }
    
    // Check total time
    const totalTime = route
      .filter(index => index > 0)
      .reduce((sum, index) => sum + (jobs[index - 1]?.estimated_duration_minutes || 0), 0)
    
    if (totalTime > team.available_hours * 60) {
      // Remove jobs to fit within available hours
      return this.reduceRouteToTime(route, jobs, team.available_hours * 60)
    }
    
    return route
  }

  private reduceRouteToCapacity(
    route: number[],
    jobs: Job[],
    demands: number[],
    maxCapacity: number
  ): number[] {
    const jobRoutes = route.filter(index => index > 0)
    jobRoutes.sort((a, b) => {
      const priorityA = jobs[a - 1]?.priority || 3
      const priorityB = jobs[b - 1]?.priority || 3
      return priorityA - priorityB // Lower priority value = higher priority
    })
    
    const reducedRoute = [0] // Start with depot
    let currentCapacity = 0
    
    for (const jobIndex of jobRoutes) {
      const demand = demands[jobIndex - 1] || 0
      if (currentCapacity + demand <= maxCapacity) {
        reducedRoute.push(jobIndex)
        currentCapacity += demand
      }
    }
    
    reducedRoute.push(0) // End at depot
    return reducedRoute
  }

  private reduceRouteToTime(
    route: number[],
    jobs: Job[],
    maxTimeMinutes: number
  ): number[] {
    const jobRoutes = route.filter(index => index > 0)
    jobRoutes.sort((a, b) => {
      const priorityA = jobs[a - 1]?.priority || 3
      const priorityB = jobs[b - 1]?.priority || 3
      return priorityA - priorityB
    })
    
    const reducedRoute = [0]
    let currentTime = 0
    
    for (const jobIndex of jobRoutes) {
      const duration = jobs[jobIndex - 1]?.estimated_duration_minutes || 120
      if (currentTime + duration <= maxTimeMinutes) {
        reducedRoute.push(jobIndex)
        currentTime += duration
      }
    }
    
    reducedRoute.push(0)
    return reducedRoute
  }

  private calculateDistanceMatrix(
    locations: Array<{lat: number, lng: number}>,
    weather: WeatherData,
    traffic: TrafficData
  ): number[][] {
    const matrix: number[][] = []
    
    for (let i = 0; i < locations.length; i++) {
      matrix[i] = []
      for (let j = 0; j < locations.length; j++) {
        if (i === j) {
          matrix[i][j] = 0
        } else {
          let distance = this.calculateDistance(
            locations[i].lat, locations[i].lng,
            locations[j].lat, locations[j].lng
          )
          
          // Apply weather and traffic factors
          distance *= weather.moving_difficulty_multiplier
          distance /= traffic.average_speed_factor
          
          matrix[i][j] = distance
        }
      }
    }
    
    return matrix
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return this.EARTH_RADIUS_KM * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private extractTimeWindows(jobs: Job[]): Array<{start: number, end: number}> {
    return jobs.map(job => {
      const defaultStart = 8 * 60 * 60 * 1000 // 8 AM
      const defaultEnd = 17 * 60 * 60 * 1000 // 5 PM
      
      return {
        start: job.time_window_start ? 
          new Date(`2024-01-01T${job.time_window_start}`).getTime() : defaultStart,
        end: job.time_window_end ?
          new Date(`2024-01-01T${job.time_window_end}`).getTime() : defaultEnd
      }
    })
  }

  private calculateRouteDistance(route: number[], distanceMatrix: number[][]): number {
    let totalDistance = 0
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += distanceMatrix[route[i]][route[i + 1]]
    }
    return totalDistance
  }

  private calculateRouteMetrics(
    route: number[],
    jobs: Job[],
    distanceMatrix: number[][],
    weather: WeatherData,
    traffic: TrafficData,
    congestionTax: CongestionTaxData
  ) {
    const totalDistance = this.calculateRouteDistance(route, distanceMatrix)
    const travelTime = (totalDistance / this.AVERAGE_SPEED_KMH) * 60 // minutes
    
    const workTime = route
      .filter(index => index > 0)
      .reduce((sum, index) => {
        const job = jobs[index - 1]
        return sum + (job?.estimated_duration_minutes || 120)
      }, 0)
    
    const totalDuration = travelTime + workTime + (weather.extra_time_minutes * route.length)
    
    // Calculate congestion tax cost
    const congestionTaxCost = this.calculateCongestionTaxCost(route, jobs, congestionTax)
    
    // Calculate efficiency score
    const idealTime = workTime * 1.2 // 20% overhead is ideal
    const efficiencyScore = Math.min(100, Math.max(0, (idealTime / totalDuration) * 100))
    
    return {
      totalDistance,
      travelTime,
      workTime,
      totalDuration,
      congestionTaxCost,
      efficiencyScore
    }
  }

  private calculateCongestionTaxCost(
    route: number[],
    jobs: Job[],
    congestionTax: CongestionTaxData
  ): number {
    if (!congestionTax.is_active) return 0
    
    let totalCost = 0
    const uniqueZonesCrossed = new Set<string>()
    
    for (const jobIndex of route) {
      if (jobIndex === 0) continue // Skip depot
      
      const job = jobs[jobIndex - 1]
      if (!job) continue
      
      // Check if job is in congestion tax zone
      for (const zone of congestionTax.zones) {
        const distance = this.calculateDistance(
          job.latitude, job.longitude,
          zone.lat, zone.lng
        )
        
        if (distance <= zone.radius) {
          const zoneKey = `${zone.lat}-${zone.lng}`
          if (!uniqueZonesCrossed.has(zoneKey)) {
            uniqueZonesCrossed.add(zoneKey)
            totalCost += congestionTax.rate_per_hour
          }
        }
      }
    }
    
    return totalCost
  }

  private calculateTotalEfficiency(routes: OptimizedRoute[]): number {
    if (routes.length === 0) return 0
    
    const totalEfficiency = routes.reduce((sum, route) => sum + route.efficiency_score, 0)
    return Math.round(totalEfficiency / routes.length)
  }

  // Real-time re-optimization for delays
  async reoptimizeForDelay(
    currentRoute: OptimizedRoute,
    currentJobIndex: number,
    delayMinutes: number
  ): Promise<OptimizedRoute> {
    const remainingJobs = currentRoute.job_sequence.slice(currentJobIndex + 1)
    
    if (remainingJobs.length === 0) {
      return currentRoute // No jobs left to optimize
    }
    
    // Create a new cluster with remaining jobs
    const cluster: JobCluster = {
      id: 'reoptimized',
      center_lat: remainingJobs[0].latitude,
      center_lng: remainingJobs[0].longitude,
      jobs: remainingJobs
    }
    
    // Mock team data for re-optimization
    const team: Team = {
      id: currentRoute.team_id,
      name: currentRoute.team_name,
      capacity_m3: 40, // Assume remaining capacity
      available_hours: 8, // Assume remaining hours
      skill_level: 5,
      vehicle_type: 'medium'
    }
    
    const weather = await this.fetchWeatherData(new Date().toISOString().split('T')[0])
    const traffic = await this.fetchTrafficData(new Date().toISOString().split('T')[0])
    const congestionTax = await this.fetchCongestionTaxData(new Date().toISOString().split('T')[0])
    
    return this.solveVRPForCluster(cluster, team, weather, traffic, congestionTax)
  }

  // Mock API functions
  private async fetchWeatherData(date: string): Promise<WeatherData> {
    return {
      moving_difficulty_multiplier: 1.2,
      requires_extra_time: true,
      extra_time_minutes: 10
    }
  }

  private async fetchTrafficData(date: string): Promise<TrafficData> {
    return {
      average_speed_factor: 0.8,
      congestion_level: 0.6
    }
  }

  private async fetchCongestionTaxData(date: string): Promise<CongestionTaxData> {
    return {
      is_active: true,
      rate_per_hour: 25,
      zones: [
        { lat: 59.3293, lng: 18.0686, radius: 2.0 }, // Stockholm city center
        { lat: 59.3326, lng: 18.0649, radius: 1.5 }  // Östermalm
      ]
    }
  }
}