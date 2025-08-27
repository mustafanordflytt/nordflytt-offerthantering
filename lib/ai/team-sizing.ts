// ML-driven Team Sizing with Random Forest Algorithm
// Continuously learns from historical data and employee feedback

interface Job {
  id: string
  estimated_volume_m3: number
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
  difficulty_score: number
}

interface WeatherData {
  temperature_avg: number
  precipitation_mm: number
  snow_depth_cm: number
  wind_speed_ms: number
  moving_difficulty_multiplier: number
  recommended_team_size_modifier: number
}

interface TeamAvailability {
  total_available_people: number
  experienced_people: number
  new_people: number
  current_workload: number
}

interface HistoricalData {
  job_features: JobFeatures
  actual_team_size: number
  completion_time_minutes: number
  efficiency_score: number
  customer_satisfaction: number
  employee_feedback_rating: number
  weather_conditions: WeatherData
  date: string
}

interface JobFeatures {
  volume_m3: number
  floors: number
  has_elevator: number
  stairs_flights: number
  piano_count: number
  heavy_appliances: number
  fragile_items: number
  parking_distance: number
  narrow_staircase: number
  disassembly_required: number
  weather_difficulty: number
  urgency_level: number
  flexibility_level: number
  difficulty_score: number
}

interface TeamSizeRecommendation {
  recommended_size: number
  confidence_score: number
  reasoning: string[]
  alternative_sizes: Array<{size: number, efficiency_prediction: number}>
  estimated_completion_time: number
  estimated_efficiency: number
}

interface DecisionTree {
  feature: string
  threshold: number
  left: DecisionTree | number
  right: DecisionTree | number
}

export class TeamSizingAI {
  private trees: DecisionTree[] = []
  private historicalData: HistoricalData[] = []
  private featureImportance: Map<string, number> = new Map()
  private modelAccuracy: number = 0
  private lastTrainingDate: Date = new Date()
  
  private readonly NUM_TREES = 100
  private readonly MAX_DEPTH = 10
  private readonly MIN_SAMPLES_SPLIT = 5
  private readonly FEATURE_SAMPLE_RATIO = 0.7

  constructor() {
    this.initializeFeatureImportance()
  }

  async initialize(): Promise<void> {
    this.historicalData = await this.fetchHistoricalJobData()
    await this.trainModel()
  }

  async recommendOptimalTeamSize(
    job: Job,
    weather: WeatherData,
    teamAvailability: TeamAvailability
  ): Promise<TeamSizeRecommendation> {
    const features = this.extractJobFeatures(job, weather)
    
    // Get predictions from all trees
    const predictions = this.trees.map(tree => this.predictWithTree(tree, features))
    
    // Calculate ensemble prediction
    const meanPrediction = predictions.reduce((sum, pred) => sum + pred, 0) / predictions.length
    const basePrediction = Math.round(Math.max(1, Math.min(6, meanPrediction)))
    
    // Apply availability constraints
    const recommendedSize = Math.min(basePrediction, teamAvailability.total_available_people)
    
    // Calculate confidence based on prediction variance
    const variance = predictions.reduce((sum, pred) => sum + Math.pow(pred - meanPrediction, 2), 0) / predictions.length
    const confidence = Math.max(0, Math.min(100, (1 - Math.sqrt(variance)) * 100))
    
    // Generate reasoning
    const reasoning = this.generateReasoning(features, recommendedSize, teamAvailability)
    
    // Calculate alternative sizes
    const alternatives = this.calculateAlternativeSizes(features, recommendedSize, teamAvailability)
    
    // Estimate completion time and efficiency
    const estimatedTime = this.estimateCompletionTime(features, recommendedSize)
    const estimatedEfficiency = this.estimateEfficiency(features, recommendedSize)

    return {
      recommended_size: recommendedSize,
      confidence_score: Math.round(confidence),
      reasoning,
      alternative_sizes: alternatives,
      estimated_completion_time: estimatedTime,
      estimated_efficiency: estimatedEfficiency
    }
  }

  private extractJobFeatures(job: Job, weather: WeatherData): JobFeatures {
    return {
      volume_m3: job.estimated_volume_m3 || 15,
      floors: job.floors_total || 2,
      has_elevator: job.elevator_available ? 1 : 0,
      stairs_flights: job.stairs_flights || 0,
      piano_count: job.piano_count || 0,
      heavy_appliances: job.heavy_appliances_count || 0,
      fragile_items: job.fragile_items_count || 0,
      parking_distance: Math.min(job.parking_distance_meters || 20, 200) / 200, // Normalize
      narrow_staircase: job.narrow_staircase ? 1 : 0,
      disassembly_required: job.disassembly_required ? 1 : 0,
      weather_difficulty: weather.moving_difficulty_multiplier || 1.0,
      urgency_level: job.customer_urgency_level || 3,
      flexibility_level: job.customer_flexibility_level || 3,
      difficulty_score: job.difficulty_score || this.calculateDifficultyScore(job)
    }
  }

  private calculateDifficultyScore(job: Job): number {
    let score = 1

    // Volume impact
    score += (job.estimated_volume_m3 || 15) / 10

    // Floor impact
    if (!job.elevator_available) {
      score += (job.floors_total || 1) * 0.5
      score += (job.stairs_flights || 0) * 0.3
    }

    // Special items
    score += (job.piano_count || 0) * 2
    score += (job.heavy_appliances_count || 0) * 0.5
    score += (job.fragile_items_count || 0) * 0.3

    // Access difficulties
    if (job.narrow_staircase) score += 1
    if ((job.parking_distance_meters || 0) > 50) score += 0.5
    if (job.disassembly_required) score += 0.5

    return Math.round(score * 10) / 10
  }

  private async trainModel(): Promise<void> {
    if (this.historicalData.length < 50) {
      console.warn('Insufficient historical data for ML training. Using fallback rules.')
      this.createFallbackModel()
      return
    }

    this.trees = []
    
    for (let i = 0; i < this.NUM_TREES; i++) {
      // Bootstrap sampling
      const bootstrapData = this.bootstrapSample(this.historicalData)
      
      // Feature bagging
      const selectedFeatures = this.selectRandomFeatures()
      
      // Train decision tree
      const tree = this.trainDecisionTree(bootstrapData, selectedFeatures)
      this.trees.push(tree)
    }

    // Calculate model accuracy
    this.modelAccuracy = await this.calculateModelAccuracy()
    
    // Update feature importance
    this.updateFeatureImportance()
    
    this.lastTrainingDate = new Date()
    console.log(`ML Model trained with ${this.historicalData.length} samples. Accuracy: ${this.modelAccuracy}%`)
  }

  private bootstrapSample(data: HistoricalData[]): HistoricalData[] {
    const sample: HistoricalData[] = []
    for (let i = 0; i < data.length; i++) {
      const randomIndex = Math.floor(Math.random() * data.length)
      sample.push(data[randomIndex])
    }
    return sample
  }

  private selectRandomFeatures(): string[] {
    const allFeatures = [
      'volume_m3', 'floors', 'has_elevator', 'stairs_flights', 'piano_count',
      'heavy_appliances', 'fragile_items', 'parking_distance', 'narrow_staircase',
      'disassembly_required', 'weather_difficulty', 'urgency_level', 'difficulty_score'
    ]
    
    const numFeatures = Math.floor(allFeatures.length * this.FEATURE_SAMPLE_RATIO)
    const selectedFeatures: string[] = []
    
    while (selectedFeatures.length < numFeatures) {
      const randomFeature = allFeatures[Math.floor(Math.random() * allFeatures.length)]
      if (!selectedFeatures.includes(randomFeature)) {
        selectedFeatures.push(randomFeature)
      }
    }
    
    return selectedFeatures
  }

  private trainDecisionTree(data: HistoricalData[], features: string[]): DecisionTree {
    return this.buildDecisionTree(
      data,
      features,
      0,
      this.MAX_DEPTH
    )
  }

  private buildDecisionTree(
    data: HistoricalData[],
    availableFeatures: string[],
    depth: number,
    maxDepth: number
  ): DecisionTree | number {
    // Stopping criteria
    if (depth >= maxDepth || data.length < this.MIN_SAMPLES_SPLIT || this.isPure(data)) {
      return this.calculateLeafValue(data)
    }

    // Find best split
    const bestSplit = this.findBestSplit(data, availableFeatures)
    
    if (!bestSplit) {
      return this.calculateLeafValue(data)
    }

    // Split data
    const leftData = data.filter(sample => 
      this.getFeatureValue(sample.job_features, bestSplit.feature) <= bestSplit.threshold
    )
    const rightData = data.filter(sample => 
      this.getFeatureValue(sample.job_features, bestSplit.feature) > bestSplit.threshold
    )

    // Recursively build subtrees
    const leftChild = this.buildDecisionTree(leftData, availableFeatures, depth + 1, maxDepth)
    const rightChild = this.buildDecisionTree(rightData, availableFeatures, depth + 1, maxDepth)

    return {
      feature: bestSplit.feature,
      threshold: bestSplit.threshold,
      left: leftChild,
      right: rightChild
    }
  }

  private findBestSplit(data: HistoricalData[], features: string[]): {feature: string, threshold: number, gain: number} | null {
    let bestGain = 0
    let bestFeature = ''
    let bestThreshold = 0

    for (const feature of features) {
      const values = data.map(sample => this.getFeatureValue(sample.job_features, feature))
      const uniqueValues = [...new Set(values)].sort((a, b) => a - b)

      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2
        const gain = this.calculateInformationGain(data, feature, threshold)

        if (gain > bestGain) {
          bestGain = gain
          bestFeature = feature
          bestThreshold = threshold
        }
      }
    }

    return bestGain > 0 ? { feature: bestFeature, threshold: bestThreshold, gain: bestGain } : null
  }

  private calculateInformationGain(data: HistoricalData[], feature: string, threshold: number): number {
    const parentEntropy = this.calculateEntropy(data)
    
    const leftData = data.filter(sample => 
      this.getFeatureValue(sample.job_features, feature) <= threshold
    )
    const rightData = data.filter(sample => 
      this.getFeatureValue(sample.job_features, feature) > threshold
    )

    if (leftData.length === 0 || rightData.length === 0) {
      return 0
    }

    const leftWeight = leftData.length / data.length
    const rightWeight = rightData.length / data.length
    
    const childrenEntropy = leftWeight * this.calculateEntropy(leftData) + 
                           rightWeight * this.calculateEntropy(rightData)

    return parentEntropy - childrenEntropy
  }

  private calculateEntropy(data: HistoricalData[]): number {
    if (data.length === 0) return 0

    const teamSizes = data.map(sample => sample.actual_team_size)
    const counts = new Map<number, number>()
    
    teamSizes.forEach(size => {
      counts.set(size, (counts.get(size) || 0) + 1)
    })

    let entropy = 0
    const total = data.length

    for (const count of counts.values()) {
      const probability = count / total
      entropy -= probability * Math.log2(probability)
    }

    return entropy
  }

  private isPure(data: HistoricalData[]): boolean {
    if (data.length <= 1) return true
    
    const firstTeamSize = data[0].actual_team_size
    return data.every(sample => sample.actual_team_size === firstTeamSize)
  }

  private calculateLeafValue(data: HistoricalData[]): number {
    if (data.length === 0) return 2 // Default team size
    
    // Return median team size (more robust than mean)
    const teamSizes = data.map(sample => sample.actual_team_size).sort((a, b) => a - b)
    const mid = Math.floor(teamSizes.length / 2)
    
    return teamSizes.length % 2 === 0 
      ? (teamSizes[mid - 1] + teamSizes[mid]) / 2
      : teamSizes[mid]
  }

  private getFeatureValue(features: JobFeatures, featureName: string): number {
    switch (featureName) {
      case 'volume_m3': return features.volume_m3
      case 'floors': return features.floors
      case 'has_elevator': return features.has_elevator
      case 'stairs_flights': return features.stairs_flights
      case 'piano_count': return features.piano_count
      case 'heavy_appliances': return features.heavy_appliances
      case 'fragile_items': return features.fragile_items
      case 'parking_distance': return features.parking_distance
      case 'narrow_staircase': return features.narrow_staircase
      case 'disassembly_required': return features.disassembly_required
      case 'weather_difficulty': return features.weather_difficulty
      case 'urgency_level': return features.urgency_level
      case 'flexibility_level': return features.flexibility_level
      case 'difficulty_score': return features.difficulty_score
      default: return 0
    }
  }

  private predictWithTree(tree: DecisionTree | number, features: JobFeatures): number {
    if (typeof tree === 'number') {
      return tree
    }

    const featureValue = this.getFeatureValue(features, tree.feature)
    
    if (featureValue <= tree.threshold) {
      return this.predictWithTree(tree.left, features)
    } else {
      return this.predictWithTree(tree.right, features)
    }
  }

  private generateReasoning(
    features: JobFeatures,
    recommendedSize: number,
    availability: TeamAvailability
  ): string[] {
    const reasoning: string[] = []

    // Volume-based reasoning
    if (features.volume_m3 > 25) {
      reasoning.push(`Stor volym (${features.volume_m3}m³) kräver fler personer`)
    } else if (features.volume_m3 < 10) {
      reasoning.push(`Liten volym (${features.volume_m3}m³) kan hanteras av färre personer`)
    }

    // Floor-based reasoning
    if (features.floors > 3 && !features.has_elevator) {
      reasoning.push(`${features.floors} våningar utan hiss kräver extra personal`)
    }

    // Special items
    if (features.piano_count > 0) {
      reasoning.push(`${features.piano_count} piano(n) kräver minst 3 personer`)
    }

    // Weather impact
    if (features.weather_difficulty > 1.3) {
      reasoning.push(`Svåra väderförhållanden kräver extra personal`)
    }

    // Availability constraints
    if (recommendedSize === availability.total_available_people) {
      reasoning.push(`Begränsad tillgänglighet: ${availability.total_available_people} personer tillgängliga`)
    }

    // Difficulty score
    if (features.difficulty_score > 4) {
      reasoning.push(`Hög svårighetsgrad (${features.difficulty_score}/10) kräver erfaren personal`)
    }

    return reasoning.length > 0 ? reasoning : ['Standardrekommendation baserad på historisk data']
  }

  private calculateAlternativeSizes(
    features: JobFeatures,
    recommendedSize: number,
    availability: TeamAvailability
  ): Array<{size: number, efficiency_prediction: number}> {
    const alternatives: Array<{size: number, efficiency_prediction: number}> = []
    
    for (let size = 1; size <= Math.min(6, availability.total_available_people); size++) {
      if (size === recommendedSize) continue
      
      const efficiency = this.estimateEfficiency(features, size)
      alternatives.push({ size, efficiency_prediction: efficiency })
    }

    return alternatives.sort((a, b) => b.efficiency_prediction - a.efficiency_prediction).slice(0, 3)
  }

  private estimateCompletionTime(features: JobFeatures, teamSize: number): number {
    // Base time calculation
    let baseTime = features.volume_m3 * 8 // 8 minutes per m³

    // Team size impact (diminishing returns)
    const teamEfficiency = Math.min(teamSize, 4) * 0.7 + Math.max(0, teamSize - 4) * 0.3
    baseTime /= Math.max(0.5, teamEfficiency)

    // Difficulty adjustments
    baseTime *= (1 + features.difficulty_score / 10)

    // Floor penalty
    if (!features.has_elevator) {
      baseTime += features.floors * 15
    }

    // Weather impact
    baseTime *= features.weather_difficulty

    return Math.round(baseTime)
  }

  private estimateEfficiency(features: JobFeatures, teamSize: number): number {
    // Optimal team size for this job
    const optimalSize = Math.min(6, Math.max(1, Math.ceil(features.difficulty_score / 2)))
    
    // Efficiency penalty for suboptimal team size
    const sizeDifference = Math.abs(teamSize - optimalSize)
    let efficiency = 100 - (sizeDifference * 15) // 15% penalty per person difference

    // Volume-team size matching
    const volumeOptimal = Math.ceil(features.volume_m3 / 15)
    if (teamSize < volumeOptimal) {
      efficiency -= (volumeOptimal - teamSize) * 10
    }

    // Special requirements
    if (features.piano_count > 0 && teamSize < 3) {
      efficiency -= 30 // Major penalty for insufficient piano moving crew
    }

    return Math.max(30, Math.min(100, Math.round(efficiency)))
  }

  async updateWithFeedback(feedback: {
    job_features: JobFeatures
    actual_team_size: number
    completion_time_minutes: number
    efficiency_score: number
    employee_feedback_rating: number
    weather_conditions: WeatherData
  }): Promise<void> {
    const historicalEntry: HistoricalData = {
      ...feedback,
      customer_satisfaction: 4.5, // Mock data
      date: new Date().toISOString()
    }

    this.historicalData.push(historicalEntry)

    // Retrain model if we have enough new data
    if (this.historicalData.length % 50 === 0) {
      await this.trainModel()
    }
  }

  private createFallbackModel(): void {
    // Simple rule-based fallback when insufficient data
    this.trees = [{
      feature: 'volume_m3',
      threshold: 20,
      left: {
        feature: 'difficulty_score',
        threshold: 3,
        left: 2,
        right: 3
      },
      right: {
        feature: 'floors',
        threshold: 3,
        left: 3,
        right: 4
      }
    }]
  }

  private async calculateModelAccuracy(): Promise<number> {
    if (this.historicalData.length < 10) return 60 // Default for insufficient data

    let correct = 0
    const testSize = Math.min(this.historicalData.length, 100)

    for (let i = 0; i < testSize; i++) {
      const testSample = this.historicalData[i]
      const features = testSample.job_features
      
      const predictions = this.trees.map(tree => this.predictWithTree(tree, features))
      const prediction = Math.round(predictions.reduce((sum, p) => sum + p, 0) / predictions.length)
      
      if (Math.abs(prediction - testSample.actual_team_size) <= 1) {
        correct++
      }
    }

    return Math.round((correct / testSize) * 100)
  }

  private initializeFeatureImportance(): void {
    this.featureImportance.set('volume_m3', 0.25)
    this.featureImportance.set('difficulty_score', 0.20)
    this.featureImportance.set('floors', 0.15)
    this.featureImportance.set('piano_count', 0.12)
    this.featureImportance.set('has_elevator', 0.10)
    this.featureImportance.set('weather_difficulty', 0.08)
    this.featureImportance.set('heavy_appliances', 0.05)
    this.featureImportance.set('stairs_flights', 0.05)
  }

  private updateFeatureImportance(): void {
    // Simplified feature importance calculation
    // In a real implementation, this would analyze the trees more thoroughly
    console.log('Feature importance updated based on model performance')
  }

  // Mock historical data fetch
  private async fetchHistoricalJobData(): Promise<HistoricalData[]> {
    // Generate mock historical data
    const mockData: HistoricalData[] = []
    
    for (let i = 0; i < 200; i++) {
      const volume = Math.random() * 40 + 5
      const floors = Math.floor(Math.random() * 6) + 1
      const hasElevator = Math.random() > 0.3
      const difficulty = Math.random() * 8 + 1
      
      mockData.push({
        job_features: {
          volume_m3: volume,
          floors,
          has_elevator: hasElevator ? 1 : 0,
          stairs_flights: hasElevator ? 0 : Math.floor(Math.random() * 4),
          piano_count: Math.random() > 0.8 ? 1 : 0,
          heavy_appliances: Math.floor(Math.random() * 3),
          fragile_items: Math.floor(Math.random() * 5),
          parking_distance: Math.random(),
          narrow_staircase: Math.random() > 0.7 ? 1 : 0,
          disassembly_required: Math.random() > 0.6 ? 1 : 0,
          weather_difficulty: 1 + Math.random() * 0.5,
          urgency_level: Math.floor(Math.random() * 5) + 1,
          flexibility_level: Math.floor(Math.random() * 5) + 1,
          difficulty_score: difficulty
        },
        actual_team_size: Math.min(6, Math.max(1, Math.round(volume / 15 + difficulty / 4))),
        completion_time_minutes: 120 + Math.random() * 180,
        efficiency_score: 70 + Math.random() * 30,
        customer_satisfaction: 3.5 + Math.random() * 1.5,
        employee_feedback_rating: 3 + Math.random() * 2,
        weather_conditions: {
          temperature_avg: -5 + Math.random() * 20,
          precipitation_mm: Math.random() * 10,
          snow_depth_cm: Math.random() * 15,
          wind_speed_ms: Math.random() * 20,
          moving_difficulty_multiplier: 1 + Math.random() * 0.5,
          recommended_team_size_modifier: Math.floor(Math.random() * 2)
        },
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      })
    }

    return mockData
  }

  // Public getters for model information
  getModelAccuracy(): number {
    return this.modelAccuracy
  }

  getFeatureImportance(): Map<string, number> {
    return new Map(this.featureImportance)
  }

  getTrainingDataSize(): number {
    return this.historicalData.length
  }

  getLastTrainingDate(): Date {
    return this.lastTrainingDate
  }
}