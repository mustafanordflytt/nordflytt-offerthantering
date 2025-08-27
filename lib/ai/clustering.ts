// DBSCAN Clustering for Geographic Optimization
// Optimized for Stockholm's varying density with dynamic epsilon

interface Job {
  id: string
  latitude: number
  longitude: number
  estimated_volume_m3: number
  estimated_duration_minutes: number
  floors_total?: number
  elevator_available?: boolean
  parking_distance_meters?: number
  customer_urgency_level?: number
  customer_flexibility_level?: number
}

interface WeatherData {
  temperature_avg: number
  precipitation_mm: number
  snow_depth_cm: number
  wind_speed_ms: number
  weather_condition: string
  moving_difficulty_multiplier: number
  requires_extra_time: boolean
  recommended_team_size_modifier: number
}

interface TrafficData {
  rush_hour: boolean
  average_speed_factor: number
  congestion_level: number
}

interface CongestionTaxData {
  is_active: boolean
  rate_per_hour: number
  peak_hours: string[]
}

interface JobCluster {
  id: string
  center_lat: number
  center_lng: number
  jobs: Job[]
  estimated_duration: number
  efficiency_score: number
  weather_factor: number
  traffic_factor: number
}

export class GeographicOptimizer {
  private readonly EARTH_RADIUS_KM = 6371
  private readonly BASE_EPSILON = 0.015 // ~1.6km in degrees
  
  async clusterJobsWithDBSCAN(
    jobs: Job[], 
    date: string
  ): Promise<{
    clusters: JobCluster[]
    efficiency_score: number
    weather_impact: WeatherData
    traffic_impact: TrafficData
    algorithm_used: string
  }> {
    const [weather, traffic, congestionTax] = await Promise.all([
      this.fetchSMHIWeather(date),
      this.fetchTrafficData(date),
      this.fetchCongestionTax(date)
    ])

    // Convert jobs to coordinate points with weights
    const coordinates = jobs.map(job => ({
      lat: job.latitude,
      lng: job.longitude,
      weight: this.calculateJobWeight(job, weather, congestionTax),
      jobData: job
    }))

    const epsilon = this.calculateOptimalEpsilon(weather, traffic, congestionTax)
    const minPoints = 2 // Minimum points to form a cluster
    
    // Run DBSCAN algorithm
    const clusters = this.runDBSCAN(coordinates, epsilon, minPoints)
    
    // Format clusters with additional metadata
    const formattedClusters = this.formatClusters(clusters, weather, traffic)
    const efficiencyScore = this.calculateEfficiencyScore(formattedClusters, jobs, weather)

    return {
      clusters: formattedClusters,
      efficiency_score: efficiencyScore,
      weather_impact: weather,
      traffic_impact: traffic,
      algorithm_used: 'DBSCAN-Stockholm-Optimized'
    }
  }

  private calculateOptimalEpsilon(
    weather: WeatherData, 
    traffic: TrafficData, 
    congestionTax: CongestionTaxData
  ): number {
    let epsilon = this.BASE_EPSILON

    // Weather adjustments
    if (weather.snow_depth_cm > 5) {
      epsilon *= 0.7 // Tighter clusters in snow
    }
    if (weather.precipitation_mm > 10) {
      epsilon *= 0.8 // Tighter clusters in heavy rain
    }
    if (weather.wind_speed_ms > 15) {
      epsilon *= 0.85 // Consider wind impact
    }

    // Traffic adjustments
    if (traffic.rush_hour) {
      epsilon *= 0.85 // Tighter clusters during rush hour
    }
    if (traffic.congestion_level > 0.7) {
      epsilon *= 0.9 // Account for high congestion
    }

    // Congestion tax adjustments
    if (congestionTax.is_active) {
      epsilon *= 0.9 // Optimize to minimize tax crossings
    }

    return Math.max(epsilon, 0.008) // Minimum epsilon to prevent over-clustering
  }

  private calculateJobWeight(
    job: Job, 
    weather: WeatherData, 
    congestionTax: CongestionTaxData
  ): number {
    let weight = 1.0

    // Volume impact
    weight += (job.estimated_volume_m3 || 15) / 20

    // Building complexity
    if (!job.elevator_available && (job.floors_total || 1) > 2) {
      weight *= 1.3
    }
    
    // Parking difficulty
    if ((job.parking_distance_meters || 20) > 50) {
      weight *= 1.2
    }

    // Weather impact
    if (weather.moving_difficulty_multiplier > 1.5) {
      weight *= 1.2
    }

    // Urgency factor
    weight *= (job.customer_urgency_level || 3) / 3

    // Congestion tax area
    if (congestionTax.is_active) {
      weight *= 1.1
    }

    return weight
  }

  private runDBSCAN(
    coordinates: Array<{lat: number, lng: number, weight: number, jobData: Job}>, 
    epsilon: number, 
    minPoints: number
  ): Array<Array<{lat: number, lng: number, weight: number, jobData: Job}>> {
    const clusters: Array<Array<{lat: number, lng: number, weight: number, jobData: Job}>> = []
    const visited = new Set<number>()
    const clustered = new Set<number>()

    for (let i = 0; i < coordinates.length; i++) {
      if (visited.has(i)) continue

      visited.add(i)
      const neighbors = this.getNeighbors(coordinates, i, epsilon)

      if (neighbors.length < minPoints) {
        // Mark as noise (will be handled separately)
        continue
      }

      // Create new cluster
      const cluster: Array<{lat: number, lng: number, weight: number, jobData: Job}> = []
      this.expandCluster(coordinates, i, neighbors, cluster, epsilon, minPoints, visited, clustered)
      
      if (cluster.length > 0) {
        clusters.push(cluster)
      }
    }

    // Handle noise points by creating single-job clusters
    for (let i = 0; i < coordinates.length; i++) {
      if (!clustered.has(i)) {
        clusters.push([coordinates[i]])
      }
    }

    return clusters
  }

  private getNeighbors(
    coordinates: Array<{lat: number, lng: number, weight: number, jobData: Job}>, 
    pointIndex: number, 
    epsilon: number
  ): number[] {
    const neighbors: number[] = []
    const point = coordinates[pointIndex]

    for (let i = 0; i < coordinates.length; i++) {
      if (i === pointIndex) continue

      const distance = this.calculateDistance(
        point.lat, point.lng,
        coordinates[i].lat, coordinates[i].lng
      )

      // Weight-adjusted distance check
      const adjustedEpsilon = epsilon * Math.sqrt((point.weight + coordinates[i].weight) / 2)

      if (distance <= adjustedEpsilon) {
        neighbors.push(i)
      }
    }

    return neighbors
  }

  private expandCluster(
    coordinates: Array<{lat: number, lng: number, weight: number, jobData: Job}>,
    pointIndex: number,
    neighbors: number[],
    cluster: Array<{lat: number, lng: number, weight: number, jobData: Job}>,
    epsilon: number,
    minPoints: number,
    visited: Set<number>,
    clustered: Set<number>
  ): void {
    cluster.push(coordinates[pointIndex])
    clustered.add(pointIndex)

    for (const neighborIndex of neighbors) {
      if (!visited.has(neighborIndex)) {
        visited.add(neighborIndex)
        const neighborNeighbors = this.getNeighbors(coordinates, neighborIndex, epsilon)

        if (neighborNeighbors.length >= minPoints) {
          neighbors.push(...neighborNeighbors)
        }
      }

      if (!clustered.has(neighborIndex)) {
        cluster.push(coordinates[neighborIndex])
        clustered.add(neighborIndex)
      }
    }
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

  private formatClusters(
    rawClusters: Array<Array<{lat: number, lng: number, weight: number, jobData: Job}>>,
    weather: WeatherData,
    traffic: TrafficData
  ): JobCluster[] {
    return rawClusters.map((cluster, index) => {
      const jobs = cluster.map(point => point.jobData)
      const centerLat = cluster.reduce((sum, point) => sum + point.lat, 0) / cluster.length
      const centerLng = cluster.reduce((sum, point) => sum + point.lng, 0) / cluster.length
      
      const estimatedDuration = this.calculateClusterDuration(jobs, weather)
      const efficiencyScore = this.calculateClusterEfficiency(cluster, weather, traffic)

      return {
        id: `cluster-${index + 1}`,
        center_lat: centerLat,
        center_lng: centerLng,
        jobs,
        estimated_duration: estimatedDuration,
        efficiency_score: efficiencyScore,
        weather_factor: weather.moving_difficulty_multiplier,
        traffic_factor: traffic.average_speed_factor
      }
    })
  }

  private calculateClusterDuration(jobs: Job[], weather: WeatherData): number {
    const baseDuration = jobs.reduce((total, job) => {
      return total + (job.estimated_duration_minutes || 120)
    }, 0)

    // Travel time between jobs (estimated)
    const travelTime = Math.max(0, (jobs.length - 1) * 15) // 15 min average between jobs

    // Weather adjustments
    let weatherMultiplier = weather.moving_difficulty_multiplier || 1.0
    if (weather.requires_extra_time) {
      weatherMultiplier += 0.2
    }

    return Math.round((baseDuration + travelTime) * weatherMultiplier)
  }

  private calculateClusterEfficiency(
    cluster: Array<{lat: number, lng: number, weight: number, jobData: Job}>,
    weather: WeatherData,
    traffic: TrafficData
  ): number {
    if (cluster.length === 0) return 0

    // Calculate geographic compactness
    const center = {
      lat: cluster.reduce((sum, point) => sum + point.lat, 0) / cluster.length,
      lng: cluster.reduce((sum, point) => sum + point.lng, 0) / cluster.length
    }

    const avgDistanceFromCenter = cluster.reduce((sum, point) => {
      return sum + this.calculateDistance(center.lat, center.lng, point.lat, point.lng)
    }, 0) / cluster.length

    // Base efficiency (lower average distance = higher efficiency)
    let efficiency = Math.max(0, 100 - (avgDistanceFromCenter * 20))

    // Weather penalty
    efficiency *= (2 - weather.moving_difficulty_multiplier) * 0.5

    // Traffic penalty
    efficiency *= traffic.average_speed_factor

    // Job count bonus (more jobs per cluster = better)
    if (cluster.length >= 3) {
      efficiency *= 1.1
    }

    return Math.min(100, Math.round(efficiency))
  }

  private calculateEfficiencyScore(
    clusters: JobCluster[], 
    allJobs: Job[], 
    weather: WeatherData
  ): number {
    if (clusters.length === 0 || allJobs.length === 0) return 0

    // Average cluster efficiency weighted by job count
    const totalJobs = allJobs.length
    const weightedEfficiency = clusters.reduce((sum, cluster) => {
      return sum + (cluster.efficiency_score * cluster.jobs.length)
    }, 0) / totalJobs

    // Cluster count penalty (too many small clusters = inefficient)
    const optimalClusters = Math.ceil(totalJobs / 4) // ~4 jobs per cluster optimal
    const clusterPenalty = Math.abs(clusters.length - optimalClusters) / optimalClusters * 10

    const finalEfficiency = Math.max(0, weightedEfficiency - clusterPenalty)

    return Math.round(finalEfficiency)
  }

  // Mock API functions (in production these would be real API calls)
  private async fetchSMHIWeather(date: string): Promise<WeatherData> {
    // Mock SMHI weather data for Stockholm
    return {
      temperature_avg: -2,
      precipitation_mm: 5,
      snow_depth_cm: 8,
      wind_speed_ms: 12,
      weather_condition: 'Snöfall',
      moving_difficulty_multiplier: 1.3,
      requires_extra_time: true,
      recommended_team_size_modifier: 1
    }
  }

  private async fetchTrafficData(date: string): Promise<TrafficData> {
    // Mock traffic data for Stockholm
    const hour = new Date().getHours()
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)
    
    return {
      rush_hour: isRushHour,
      average_speed_factor: isRushHour ? 0.7 : 0.9,
      congestion_level: isRushHour ? 0.8 : 0.4
    }
  }

  private async fetchCongestionTax(date: string): Promise<CongestionTaxData> {
    // Mock congestion tax data for Stockholm
    const hour = new Date().getHours()
    const isWeekday = new Date(date).getDay() >= 1 && new Date(date).getDay() <= 5
    
    return {
      is_active: isWeekday && hour >= 6 && hour <= 18,
      rate_per_hour: hour >= 7 && hour <= 8 ? 35 : 
                     hour >= 8 && hour <= 14 ? 22 :
                     hour >= 15 && hour <= 17 ? 35 : 15,
      peak_hours: ['07:00-08:00', '15:00-17:00']
    }
  }
}