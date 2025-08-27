// Stockholm Weather Service - SMHI Integration
// Provides real-time weather data and moving difficulty calculations

interface SMHIWeatherResponse {
  timeSeries: Array<{
    validTime: string
    parameters: Array<{
      name: string
      levelType: string
      level: number
      unit: string
      values: number[]
    }>
  }>
}

interface WeatherData {
  date: string
  temperature_avg: number
  temperature_min: number
  temperature_max: number
  precipitation_mm: number
  snow_depth_cm: number
  wind_speed_ms: number
  wind_direction_deg: number
  visibility_km: number
  humidity_percent: number
  weather_condition: string
  weather_symbol: number
  moving_difficulty_multiplier: number
  requires_extra_time: boolean
  recommended_team_size_modifier: number
  extra_time_minutes: number
  safety_warnings: string[]
  equipment_recommendations: string[]
}

interface WeatherImpact {
  difficulty_multiplier: number
  extra_time_minutes: number
  team_size_modifier: number
  safety_level: 'low' | 'medium' | 'high' | 'extreme'
  specific_impacts: {
    loading_difficulty: number
    stair_climbing_difficulty: number
    outdoor_work_difficulty: number
    vehicle_safety: number
    customer_comfort: number
  }
}

export class StockholmWeatherService {
  private readonly SMHI_BASE_URL = 'https://opendata-download-metfcst.smhi.se/api'
  private readonly STOCKHOLM_LAT = 59.3293
  private readonly STOCKHOLM_LNG = 18.0686
  private weatherCache: Map<string, WeatherData> = new Map()
  private readonly CACHE_DURATION_MS = 30 * 60 * 1000 // 30 minutes

  async getWeatherForDate(date: string): Promise<WeatherData> {
    // Check cache first
    const cacheKey = `weather_${date}`
    const cached = this.weatherCache.get(cacheKey)
    
    if (cached && this.isCacheValid(cached)) {
      return cached
    }

    try {
      // In production, this would make a real SMHI API call
      const weatherData = await this.fetchSMHIWeatherData(date)
      
      // Process and enhance the raw weather data
      const processedWeather = this.processWeatherData(weatherData, date)
      
      // Cache the result
      this.weatherCache.set(cacheKey, processedWeather)
      
      return processedWeather
    } catch (error) {
      console.error('Failed to fetch SMHI weather data:', error)
      return this.getFallbackWeatherData(date)
    }
  }

  async getWeatherImpactForDate(date: string): Promise<WeatherImpact> {
    const weather = await this.getWeatherForDate(date)
    return this.calculateMovingImpact(weather)
  }

  async getExtendedForecast(days: number = 7): Promise<WeatherData[]> {
    const forecasts: WeatherData[] = []
    const today = new Date()
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateString = date.toISOString().split('T')[0]
      
      const weather = await this.getWeatherForDate(dateString)
      forecasts.push(weather)
    }
    
    return forecasts
  }

  calculateMovingImpact(weather: WeatherData): WeatherImpact {
    let difficultyMultiplier = 1.0
    let extraTimeMinutes = 0
    let teamSizeModifier = 0
    let safetyLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low'

    // Temperature impact
    if (weather.temperature_avg < -10) {
      difficultyMultiplier += 0.4
      extraTimeMinutes += 20
      teamSizeModifier += 1
      safetyLevel = 'high'
    } else if (weather.temperature_avg < 0) {
      difficultyMultiplier += 0.2
      extraTimeMinutes += 10
    }

    if (weather.temperature_avg > 30) {
      difficultyMultiplier += 0.3
      extraTimeMinutes += 15
      safetyLevel = 'medium'
    }

    // Precipitation impact
    if (weather.precipitation_mm > 10) {
      difficultyMultiplier += 0.4
      extraTimeMinutes += 25
      if (weather.temperature_avg < 0) {
        safetyLevel = 'extreme' // Ice risk
        difficultyMultiplier += 0.6
        extraTimeMinutes += 40
        teamSizeModifier += 1
      }
    } else if (weather.precipitation_mm > 2) {
      difficultyMultiplier += 0.2
      extraTimeMinutes += 10
    }

    // Snow impact
    if (weather.snow_depth_cm > 10) {
      difficultyMultiplier += 0.6
      extraTimeMinutes += 30
      teamSizeModifier += 1
      safetyLevel = 'high'
    } else if (weather.snow_depth_cm > 5) {
      difficultyMultiplier += 0.3
      extraTimeMinutes += 15
    }

    // Wind impact
    if (weather.wind_speed_ms > 15) {
      difficultyMultiplier += 0.3
      extraTimeMinutes += 20
      safetyLevel = Math.max(safetyLevel, 'medium') as any
    } else if (weather.wind_speed_ms > 10) {
      difficultyMultiplier += 0.1
      extraTimeMinutes += 10
    }

    // Visibility impact
    if (weather.visibility_km < 1) {
      difficultyMultiplier += 0.5
      extraTimeMinutes += 30
      safetyLevel = 'extreme'
    } else if (weather.visibility_km < 5) {
      difficultyMultiplier += 0.2
      extraTimeMinutes += 15
      safetyLevel = Math.max(safetyLevel, 'medium') as any
    }

    // Calculate specific impacts
    const specificImpacts = {
      loading_difficulty: this.calculateLoadingDifficulty(weather),
      stair_climbing_difficulty: this.calculateStairDifficulty(weather),
      outdoor_work_difficulty: this.calculateOutdoorWorkDifficulty(weather),
      vehicle_safety: this.calculateVehicleSafety(weather),
      customer_comfort: this.calculateCustomerComfort(weather)
    }

    return {
      difficulty_multiplier: Math.round(difficultyMultiplier * 100) / 100,
      extra_time_minutes: Math.round(extraTimeMinutes),
      team_size_modifier: teamSizeModifier,
      safety_level: safetyLevel,
      specific_impacts: specificImpacts
    }
  }

  private calculateLoadingDifficulty(weather: WeatherData): number {
    let difficulty = 1.0

    // Rain makes loading slippery
    if (weather.precipitation_mm > 5) difficulty += 0.3
    
    // Snow makes everything slower
    if (weather.snow_depth_cm > 5) difficulty += 0.4
    
    // Wind affects large items
    if (weather.wind_speed_ms > 10) difficulty += 0.2
    
    // Cold makes hands less dexterous
    if (weather.temperature_avg < -5) difficulty += 0.3

    return Math.min(2.0, difficulty)
  }

  private calculateStairDifficulty(weather: WeatherData): number {
    let difficulty = 1.0

    // Ice on stairs is extremely dangerous
    if (weather.temperature_avg < 2 && weather.precipitation_mm > 0) {
      difficulty += 0.8
    }
    
    // Snow on stairs
    if (weather.snow_depth_cm > 2) difficulty += 0.5
    
    // Cold affects grip and stamina
    if (weather.temperature_avg < -5) difficulty += 0.3

    return Math.min(2.0, difficulty)
  }

  private calculateOutdoorWorkDifficulty(weather: WeatherData): number {
    let difficulty = 1.0

    // Extreme temperatures
    if (weather.temperature_avg < -10 || weather.temperature_avg > 30) {
      difficulty += 0.6
    } else if (weather.temperature_avg < 0 || weather.temperature_avg > 25) {
      difficulty += 0.3
    }

    // Wind chill effect
    if (weather.wind_speed_ms > 8 && weather.temperature_avg < 5) {
      difficulty += 0.4
    }

    // Precipitation
    if (weather.precipitation_mm > 2) difficulty += 0.3

    return Math.min(2.0, difficulty)
  }

  private calculateVehicleSafety(weather: WeatherData): number {
    let safety = 1.0 // Higher number = less safe

    // Snow and ice conditions
    if (weather.snow_depth_cm > 5) safety += 0.5
    if (weather.temperature_avg < 0 && weather.precipitation_mm > 0) safety += 0.6

    // Visibility
    if (weather.visibility_km < 5) safety += 0.4
    if (weather.visibility_km < 1) safety += 0.8

    // Wind affecting large vehicles
    if (weather.wind_speed_ms > 15) safety += 0.3

    return Math.min(2.0, safety)
  }

  private calculateCustomerComfort(weather: WeatherData): number {
    let comfort = 1.0 // Higher number = less comfortable

    // Temperature comfort
    if (weather.temperature_avg < -5 || weather.temperature_avg > 28) {
      comfort += 0.4
    }

    // Precipitation affects comfort
    if (weather.precipitation_mm > 5) comfort += 0.3

    // Wind affects perceived temperature
    if (weather.wind_speed_ms > 12) comfort += 0.2

    return Math.min(2.0, comfort)
  }

  private async fetchSMHIWeatherData(date: string): Promise<SMHIWeatherResponse> {
    // Mock SMHI API response - in production this would be a real API call
    // SMHI API: GET /api/category/pmp3g/version/2/geotype/point/lon/{lon}/lat/{lat}/data.json
    
    const mockResponse: SMHIWeatherResponse = {
      timeSeries: [{
        validTime: `${date}T12:00:00Z`,
        parameters: [
          { name: 't', levelType: 'hl', level: 2, unit: 'Cel', values: [this.generateMockTemperature()] },
          { name: 'pmean', levelType: 'hl', level: 0, unit: 'mm/h', values: [this.generateMockPrecipitation()] },
          { name: 'ws', levelType: 'hl', level: 10, unit: 'm/s', values: [this.generateMockWindSpeed()] },
          { name: 'wd', levelType: 'hl', level: 10, unit: 'degree', values: [Math.random() * 360] },
          { name: 'vis', levelType: 'hl', level: 0, unit: 'km', values: [5 + Math.random() * 15] },
          { name: 'r', levelType: 'hl', level: 2, unit: 'percent', values: [40 + Math.random() * 40] },
          { name: 'Wsymb2', levelType: 'hl', level: 0, unit: 'category', values: [this.generateMockWeatherSymbol()] }
        ]
      }]
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return mockResponse
  }

  private processWeatherData(smhiData: SMHIWeatherResponse, date: string): WeatherData {
    const timeSeries = smhiData.timeSeries[0]
    const params = timeSeries.parameters

    const temperature = this.getParameterValue(params, 't') || 5
    const precipitation = this.getParameterValue(params, 'pmean') || 0
    const windSpeed = this.getParameterValue(params, 'ws') || 5
    const windDirection = this.getParameterValue(params, 'wd') || 180
    const visibility = this.getParameterValue(params, 'vis') || 10
    const humidity = this.getParameterValue(params, 'r') || 60
    const weatherSymbol = this.getParameterValue(params, 'Wsymb2') || 1

    // Calculate snow depth based on temperature and precipitation
    const snowDepth = this.calculateSnowDepth(temperature, precipitation, date)
    
    // Determine weather condition from symbol
    const weatherCondition = this.interpretWeatherSymbol(weatherSymbol)
    
    // Calculate moving impact
    const impact = this.calculateMovingImpact({
      date,
      temperature_avg: temperature,
      temperature_min: temperature - 2,
      temperature_max: temperature + 2,
      precipitation_mm: precipitation,
      snow_depth_cm: snowDepth,
      wind_speed_ms: windSpeed,
      wind_direction_deg: windDirection,
      visibility_km: visibility,
      humidity_percent: humidity,
      weather_condition: weatherCondition,
      weather_symbol: weatherSymbol,
      moving_difficulty_multiplier: 1,
      requires_extra_time: false,
      recommended_team_size_modifier: 0,
      extra_time_minutes: 0,
      safety_warnings: [],
      equipment_recommendations: []
    })

    // Generate safety warnings and equipment recommendations
    const safetyWarnings = this.generateSafetyWarnings(temperature, precipitation, windSpeed, visibility, snowDepth)
    const equipmentRecommendations = this.generateEquipmentRecommendations(temperature, precipitation, windSpeed, snowDepth)

    return {
      date,
      temperature_avg: Math.round(temperature * 10) / 10,
      temperature_min: Math.round((temperature - 2) * 10) / 10,
      temperature_max: Math.round((temperature + 2) * 10) / 10,
      precipitation_mm: Math.round(precipitation * 10) / 10,
      snow_depth_cm: Math.round(snowDepth * 10) / 10,
      wind_speed_ms: Math.round(windSpeed * 10) / 10,
      wind_direction_deg: Math.round(windDirection),
      visibility_km: Math.round(visibility * 10) / 10,
      humidity_percent: Math.round(humidity),
      weather_condition: weatherCondition,
      weather_symbol: weatherSymbol,
      moving_difficulty_multiplier: impact.difficulty_multiplier,
      requires_extra_time: impact.extra_time_minutes > 0,
      recommended_team_size_modifier: impact.team_size_modifier,
      extra_time_minutes: impact.extra_time_minutes,
      safety_warnings: safetyWarnings,
      equipment_recommendations: equipmentRecommendations
    }
  }

  private getParameterValue(parameters: any[], name: string): number | null {
    const param = parameters.find(p => p.name === name)
    return param ? param.values[0] : null
  }

  private calculateSnowDepth(temperature: number, precipitation: number, date: string): number {
    // Simple snow accumulation model
    const month = new Date(date).getMonth()
    const isWinter = month >= 10 || month <= 2
    
    if (!isWinter || temperature > 2) return 0
    
    // Base snow depth for winter months
    let baseDepth = isWinter ? Math.random() * 10 : 0
    
    // Add snow from precipitation
    if (temperature < 0 && precipitation > 0) {
      baseDepth += precipitation * 2 // Rough conversion
    }

    return Math.max(0, baseDepth)
  }

  private interpretWeatherSymbol(symbol: number): string {
    // SMHI weather symbols interpretation
    const symbols: { [key: number]: string } = {
      1: 'Klart',
      2: 'Lätt molnighet',
      3: 'Halvklart',
      4: 'Molnigt',
      5: 'Mycket molnigt',
      6: 'Mulet',
      7: 'Dimma',
      8: 'Lätt regnskur',
      9: 'Måttlig regnskur',
      10: 'Kraftig regnskur',
      11: 'Åska',
      15: 'Lätt snöfall',
      16: 'Måttligt snöfall',
      17: 'Kraftigt snöfall',
      18: 'Lätt snöblandat regn',
      19: 'Måttligt snöblandat regn',
      20: 'Kraftigt snöblandat regn'
    }
    
    return symbols[symbol] || 'Okänt väder'
  }

  private generateSafetyWarnings(
    temperature: number,
    precipitation: number,
    windSpeed: number,
    visibility: number,
    snowDepth: number
  ): string[] {
    const warnings: string[] = []

    if (temperature < -10) {
      warnings.push('Extrem kyla - risk för förfrysningar')
    }

    if (temperature < 2 && precipitation > 0) {
      warnings.push('Halkrisk - var extra försiktig vid trappor och lastning')
    }

    if (snowDepth > 10) {
      warnings.push('Djup snö - extra tid krävs för all förflyttning')
    }

    if (windSpeed > 15) {
      warnings.push('Kraftig vind - var försiktig med stora föremål')
    }

    if (visibility < 5) {
      warnings.push('Dålig sikt - kör försiktigt och använd varselljus')
    }

    if (precipitation > 10) {
      warnings.push('Kraftigt regn - skydda känsliga föremål extra noga')
    }

    return warnings
  }

  private generateEquipmentRecommendations(
    temperature: number,
    precipitation: number,
    windSpeed: number,
    snowDepth: number
  ): string[] {
    const recommendations: string[] = []

    if (temperature < 0) {
      recommendations.push('Extra vinterkläder och handskar')
      recommendations.push('Varma drycker för personalen')
    }

    if (precipitation > 2) {
      recommendations.push('Regnskydd för möbler och kartonger')
      recommendations.push('Extra plastrullar och presenningar')
    }

    if (snowDepth > 5) {
      recommendations.push('Snöskyffel för fordon och entréer')
      recommendations.push('Sandsäck för halt underlag')
      recommendations.push('Vinterdäck och snökedjor kontrollerade')
    }

    if (windSpeed > 10) {
      recommendations.push('Extra tejp och förpackningsmaterial')
      recommendations.push('Skydda lätta föremål från vind')
    }

    return recommendations
  }

  private generateMockTemperature(): number {
    const month = new Date().getMonth()
    const seasonalTemp = month >= 4 && month <= 9 ? 15 : 0 // Summer vs winter
    return seasonalTemp + (Math.random() - 0.5) * 20
  }

  private generateMockPrecipitation(): number {
    return Math.random() > 0.7 ? Math.random() * 15 : 0
  }

  private generateMockWindSpeed(): number {
    return Math.random() * 20
  }

  private generateMockWeatherSymbol(): number {
    const symbols = [1, 2, 3, 4, 5, 6, 8, 9, 15, 16, 18]
    return symbols[Math.floor(Math.random() * symbols.length)]
  }

  private getFallbackWeatherData(date: string): WeatherData {
    // Default safe weather conditions when API fails
    return {
      date,
      temperature_avg: 10,
      temperature_min: 8,
      temperature_max: 12,
      precipitation_mm: 0,
      snow_depth_cm: 0,
      wind_speed_ms: 5,
      wind_direction_deg: 180,
      visibility_km: 15,
      humidity_percent: 60,
      weather_condition: 'Delvis molnigt',
      weather_symbol: 3,
      moving_difficulty_multiplier: 1.0,
      requires_extra_time: false,
      recommended_team_size_modifier: 0,
      extra_time_minutes: 0,
      safety_warnings: [],
      equipment_recommendations: []
    }
  }

  private isCacheValid(weather: WeatherData): boolean {
    // Simple cache validation - in production this would be more sophisticated
    return Date.now() - new Date(weather.date).getTime() < this.CACHE_DURATION_MS
  }

  // Public methods for getting specific weather aspects
  async getMovingConditionsForDate(date: string): Promise<{
    suitable: boolean
    warnings: string[]
    difficulty_score: number
    recommendations: string[]
  }> {
    const weather = await this.getWeatherForDate(date)
    const impact = this.calculateMovingImpact(weather)
    
    return {
      suitable: impact.safety_level !== 'extreme',
      warnings: weather.safety_warnings,
      difficulty_score: Math.round(impact.difficulty_multiplier * 10),
      recommendations: weather.equipment_recommendations
    }
  }

  async getHourlyForecast(date: string): Promise<WeatherData[]> {
    // Mock hourly data - in production this would fetch actual hourly data
    const hourlyData: WeatherData[] = []
    const baseWeather = await this.getWeatherForDate(date)
    
    for (let hour = 6; hour <= 18; hour++) {
      const hourlyWeather = {
        ...baseWeather,
        date: `${date}T${hour.toString().padStart(2, '0')}:00:00`,
        temperature_avg: baseWeather.temperature_avg + (Math.random() - 0.5) * 3,
        precipitation_mm: baseWeather.precipitation_mm * (0.5 + Math.random()),
        wind_speed_ms: baseWeather.wind_speed_ms * (0.8 + Math.random() * 0.4)
      }
      
      hourlyData.push(hourlyWeather)
    }
    
    return hourlyData
  }
}