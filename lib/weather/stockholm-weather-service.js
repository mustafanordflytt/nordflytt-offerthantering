import dotenv from 'dotenv';

dotenv.config();

export class StockholmWeatherService {
  constructor() {
    this.apiKey = process.env.SMHI_API_KEY;
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  async getWeatherImpactForDate(date) {
    try {
      const cacheKey = `weather_${date}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }

      const weather = await this.fetchWeatherFromAPI(date);
      const impact = this.calculateMovingImpact(weather);

      const result = { date, weather, impact, extraTimeMinutes: impact.extraTimeMinutes };
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      return result;
    } catch (error) {
      console.error('Weather fetch failed:', error);
      return this.getDefaultWeatherImpact();
    }
  }

  async fetchWeatherFromAPI(date) {
    try {
      // SMHI API för Stockholm
      const url = `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/18.0686/lat/59.3293/data.json`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const targetDate = new Date(date).toISOString().split('T')[0];
      
      // Hitta prognos för måldata
      const forecast = data.timeSeries?.find(t => t.validTime.startsWith(targetDate));
      
      if (!forecast) {
        console.warn(`No forecast data for date ${date}, using current conditions`);
        return this.getCurrentWeatherFallback();
      }

      return {
        temperature_avg: this.getParameterValue(forecast, 't') || 15,
        precipitation_mm: this.getParameterValue(forecast, 'pcp') || 0,
        snow_depth_cm: this.getParameterValue(forecast, 'sd') || 0,
        wind_speed_ms: this.getParameterValue(forecast, 'ws') || 0,
        humidity_percent: this.getParameterValue(forecast, 'r') || 70,
        visibility_km: this.getParameterValue(forecast, 'vis') || 10
      };
    } catch (error) {
      console.error('SMHI API error:', error);
      return this.getCurrentWeatherFallback();
    }
  }

  getParameterValue(forecast, paramName) {
    const param = forecast.parameters?.find(p => p.name === paramName);
    return param?.values?.[0];
  }

  getCurrentWeatherFallback() {
    // Fallback till rimliga stockholmsvärden
    return {
      temperature_avg: 15,
      precipitation_mm: 0,
      snow_depth_cm: 0,
      wind_speed_ms: 3,
      humidity_percent: 70,
      visibility_km: 10
    };
  }

  calculateMovingImpact(weather) {
    let extraTimeMinutes = 0;
    let difficultyMultiplier = 1.0;
    let recommendations = [];

    // Snö påverkan
    if (weather.snow_depth_cm > 10) {
      extraTimeMinutes += 30;
      difficultyMultiplier *= 1.4;
      recommendations.push('Använd vinterdäck och extra salt');
    } else if (weather.snow_depth_cm > 5) {
      extraTimeMinutes += 20;
      difficultyMultiplier *= 1.2;
      recommendations.push('Var försiktig med halka');
    }

    // Regn påverkan
    if (weather.precipitation_mm > 10) {
      extraTimeMinutes += 15;
      difficultyMultiplier *= 1.3;
      recommendations.push('Skydda möbler med presenningar');
    } else if (weather.precipitation_mm > 5) {
      extraTimeMinutes += 10;
      difficultyMultiplier *= 1.1;
      recommendations.push('Ha regnskydd tillgängligt');
    }

    // Vind påverkan
    if (weather.wind_speed_ms > 15) {
      extraTimeMinutes += 15;
      difficultyMultiplier *= 1.2;
      recommendations.push('Extra försiktighet med höga föremål');
    } else if (weather.wind_speed_ms > 10) {
      extraTimeMinutes += 10;
      difficultyMultiplier *= 1.1;
    }

    // Temperatur påverkan
    if (weather.temperature_avg < -5) {
      extraTimeMinutes += 10;
      recommendations.push('Kläd er varmt och ta extra pauser');
    } else if (weather.temperature_avg > 25) {
      extraTimeMinutes += 5;
      recommendations.push('Drick mycket vatten och ta skugga');
    }

    // Sikt påverkan
    if (weather.visibility_km < 1) {
      extraTimeMinutes += 20;
      difficultyMultiplier *= 1.3;
      recommendations.push('Kör försiktigt - dålig sikt');
    }

    return {
      extraTimeMinutes,
      difficultyMultiplier,
      recommendations,
      safetyLevel: this.calculateSafetyLevel(extraTimeMinutes),
      teamSizeModifier: Math.ceil(difficultyMultiplier) - 1
    };
  }

  calculateSafetyLevel(extraTime) {
    if (extraTime > 40) return 'extreme';
    if (extraTime > 20) return 'high';
    if (extraTime > 10) return 'medium';
    return 'low';
  }

  getDefaultWeatherImpact() {
    return {
      date: new Date().toISOString().split('T')[0],
      weather: this.getCurrentWeatherFallback(),
      impact: {
        extraTimeMinutes: 0,
        difficultyMultiplier: 1.0,
        recommendations: [],
        safetyLevel: 'low',
        teamSizeModifier: 0
      },
      extraTimeMinutes: 0
    };
  }

  // Förbättra cache-hantering
  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}