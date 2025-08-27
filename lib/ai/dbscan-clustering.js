import pool from '../database/connection.js';
import { StockholmWeatherService } from '../weather/stockholm-weather-service.js';

export class StockholmDBSCANOptimizer {
  constructor() {
    this.defaultEpsilon = 0.008;
    this.minSamples = 2;
    this.weatherService = new StockholmWeatherService();
  }

  async optimizeJobClustering(jobs, date) {
    try {
      const weather = await this.getWeatherImpact(date);
      const jobData = await this.prepareJobData(jobs);
      const epsilon = this.calculateAdjustedEpsilon(weather, jobData);
      const { clusters, noise } = this.executeDBSCAN(
        jobData.map(j => [j.lat, j.lng]),
        epsilon,
        this.minSamples
      );
      return {
        clusters: this.formatClusters(clusters, jobData),
        noise: noise.map(i => jobData[i]),
        efficiency_gain: this.estimateEfficiencyGain(clusters.length, jobs.length),
        weather_impact: weather,
        optimization_score: this.calculateOptimizationScore(clusters, noise, jobs.length)
      };
    } catch (error) {
      console.error('DBSCAN failed:', error);
      return this.fallbackGrouping(jobs);
    }
  }

  // FIX: Implementera formatClusters metod
  formatClusters(clusters, jobData) {
    return clusters.map((cluster, index) => ({
      cluster_id: index + 1,
      center: this.calculateClusterCenter(cluster, jobData),
      jobs: cluster.map(jobIndex => jobData[jobIndex]),
      estimated_duration: this.estimateClusterDuration(cluster, jobData),
      recommended_team_size: this.recommendTeamSize(cluster, jobData)
    }));
  }

  calculateClusterCenter(cluster, jobData) {
    const latSum = cluster.reduce((sum, i) => sum + jobData[i].lat, 0);
    const lngSum = cluster.reduce((sum, i) => sum + jobData[i].lng, 0);
    return {
      lat: latSum / cluster.length,
      lng: lngSum / cluster.length
    };
  }

  estimateClusterDuration(cluster, jobData) {
    return cluster.reduce((sum, i) => sum + (jobData[i].estimated_duration_minutes || 120), 0);
  }

  recommendTeamSize(cluster, jobData) {
    const totalVolume = cluster.reduce((sum, i) => sum + (jobData[i].volume || 15), 0);
    const complexJobs = cluster.filter(i => jobData[i].floors > 3 || jobData[i].heavy_items).length;
    
    if (totalVolume > 80 || complexJobs > 2) return 4;
    if (totalVolume > 50 || complexJobs > 1) return 3;
    return 2;
  }

  async getWeatherImpact(date) {
    try {
      return await this.weatherService.getWeatherImpactForDate(date);
    } catch (error) {
      console.error('Weather service failed:', error);
      return { extraTimeMinutes: 0 };
    }
  }

  async prepareJobData(jobs) {
    if (!Array.isArray(jobs)) {
      throw new Error('Jobs must be an array');
    }

    return jobs.map(job => ({
      id: job.id,
      lat: job.address_lat || job.lat || 59.3293,
      lng: job.address_lng || job.lng || 18.0686,
      estimated_duration_minutes: job.estimated_duration_minutes || 120,
      volume: job.estimated_volume_m3 || 15,
      floors: job.floors_total || 1,
      heavy_items: job.heavy_appliances_count > 0 || job.piano_count > 0,
      customer_name: job.customer_name || 'Okänd kund'
    }));
  }

  calculateAdjustedEpsilon(weather, jobData) {
    let epsilon = this.defaultEpsilon;
    
    // Justera för väder - vid dåligt väder, gör kluster tätare
    if (weather.extraTimeMinutes > 15) {
      epsilon *= 0.8; // Mindre kluster vid dåligt väder
    } else if (weather.extraTimeMinutes > 5) {
      epsilon *= 0.9;
    }

    // Justera för jobbtäthet
    const avgDistance = this.calculateAverageDistance(jobData);
    if (avgDistance > 0.02) {
      epsilon *= 1.2; // Större kluster om jobben är spridda
    }

    return Math.max(0.005, Math.min(0.015, epsilon));
  }

  calculateAverageDistance(jobData) {
    if (jobData.length < 2) return 0;
    
    let totalDistance = 0;
    let count = 0;
    
    for (let i = 0; i < jobData.length; i++) {
      for (let j = i + 1; j < jobData.length; j++) {
        totalDistance += this.euclideanDistance(
          [jobData[i].lat, jobData[i].lng],
          [jobData[j].lat, jobData[j].lng]
        );
        count++;
      }
    }
    
    return count > 0 ? totalDistance / count : 0;
  }

  executeDBSCAN(points, epsilon, minSamples) {
    const clusters = [];
    const noise = [];
    const visited = new Set();
    const processed = new Set();

    for (let i = 0; i < points.length; i++) {
      if (visited.has(i)) continue;
      
      visited.add(i);
      const neighbors = this.regionQuery(points, i, epsilon);
      
      if (neighbors.length < minSamples) {
        noise.push(i);
      } else {
        const cluster = [];
        this.expandCluster(points, i, neighbors, cluster, visited, processed, epsilon, minSamples);
        if (cluster.length > 0) {
          clusters.push(cluster);
        }
      }
    }

    return { clusters, noise };
  }

  expandCluster(points, pointIndex, neighbors, cluster, visited, processed, epsilon, minSamples) {
    cluster.push(pointIndex);
    processed.add(pointIndex);

    for (let i = 0; i < neighbors.length; i++) {
      const neighborIndex = neighbors[i];
      
      if (!visited.has(neighborIndex)) {
        visited.add(neighborIndex);
        const newNeighbors = this.regionQuery(points, neighborIndex, epsilon);
        
        if (newNeighbors.length >= minSamples) {
          neighbors.push(...newNeighbors.filter(n => !neighbors.includes(n)));
        }
      }
      
      if (!processed.has(neighborIndex)) {
        cluster.push(neighborIndex);
        processed.add(neighborIndex);
      }
    }
  }

  regionQuery(points, pointIndex, epsilon) {
    const neighbors = [];
    const point = points[pointIndex];
    
    for (let i = 0; i < points.length; i++) {
      if (i !== pointIndex && this.euclideanDistance(point, points[i]) <= epsilon) {
        neighbors.push(i);
      }
    }
    
    return neighbors;
  }

  euclideanDistance(point1, point2) {
    const dx = point1[0] - point2[0];
    const dy = point1[1] - point2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  estimateEfficiencyGain(clusterCount, totalJobs) {
    if (totalJobs === 0) return 0;
    
    // Teoretisk optimal: 1 kluster per team (6 team)
    const optimalClusters = Math.min(6, Math.ceil(totalJobs / 4));
    const efficiency = Math.min(95, 60 + (optimalClusters / clusterCount) * 35);
    
    return Math.round(efficiency);
  }

  calculateOptimizationScore(clusters, noise, totalJobs) {
    const clusterEfficiency = clusters.length > 0 ? (totalJobs - noise.length) / totalJobs : 0;
    const sizeBalance = this.calculateClusterBalance(clusters);
    
    return Math.round((clusterEfficiency * 0.7 + sizeBalance * 0.3) * 100);
  }

  calculateClusterBalance(clusters) {
    if (clusters.length === 0) return 0;
    
    const sizes = clusters.map(c => c.jobs ? c.jobs.length : c.length);
    const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;
    
    // Lägre varians = bättre balans
    return Math.max(0, 1 - (variance / (avgSize * avgSize)));
  }

  fallbackGrouping(jobs) {
    console.warn('Using fallback geographic grouping');
    
    // Enkel geografisk gruppering baserat på Stockholm-områden
    const areas = {
      'City': { lat: 59.3293, lng: 18.0686 },
      'North': { lat: 59.3500, lng: 18.0686 },
      'South': { lat: 59.3100, lng: 18.0686 },
      'East': { lat: 59.3293, lng: 18.1000 },
      'West': { lat: 59.3293, lng: 18.0300 }
    };

    const clusters = Object.entries(areas).map(([name, center], index) => ({
      cluster_id: index + 1,
      center,
      jobs: jobs.filter(job => {
        const distance = this.euclideanDistance(
          [job.lat || 59.3293, job.lng || 18.0686],
          [center.lat, center.lng]
        );
        return distance < 0.02;
      }),
      estimated_duration: 240,
      recommended_team_size: 2
    })).filter(cluster => cluster.jobs.length > 0);

    return {
      clusters,
      noise: [],
      efficiency_gain: 70,
      weather_impact: { extraTimeMinutes: 0 },
      optimization_score: 70,
      fallback: true
    };
  }
}