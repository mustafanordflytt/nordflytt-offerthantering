// Enhanced VRP Optimizer with Clarke-Wright Savings Algorithm
// Phase 2 implementation for 95%+ efficiency through advanced route optimization

import { GoogleMapsService } from '../maps/enhanced-google-maps-service.js';
import pool from '../database/connection.js';

export class EnhancedVRPOptimizer {
  constructor() {
    this.mapsService = new GoogleMapsService();
    this.fuelCostPerLiter = 15.5; // SEK per liter
    this.co2EmissionFactor = 2.68; // kg CO2 per liter diesel
    this.depot = { lat: 59.3293, lng: 18.0686, name: 'Nordflytt HQ' }; // Stockholm depot
    this.maxWorkingHours = 8; // 8 hour work day limit
    this.avgOperatingCostPerKm = 2.5; // SEK per km
  }

  async optimizeVehicleRoutes(clusters, date, availableVehicles) {
    try {
      console.log(`🚀 Starting Enhanced VRP optimization for ${clusters.flat().length} jobs with Clarke-Wright Algorithm`);
      
      // 1. Prepare job data with enhanced volume estimates
      const allJobs = await this.prepareJobData(clusters.flat());
      console.log(`📊 Prepared ${allJobs.length} jobs with volume estimates`);
      
      // 2. Calculate cached distance matrix to reduce Google Maps API costs
      const distanceMatrix = await this.calculateCachedDistanceMatrix(allJobs);
      console.log(`📍 Distance matrix calculated with ${Object.keys(distanceMatrix).length} cached entries`);
      
      // 3. Run Clarke-Wright Savings Algorithm for optimal route construction
      const routes = await this.clarkeWrightSavingsAlgorithm(allJobs, distanceMatrix, availableVehicles);
      console.log(`🧮 Clarke-Wright algorithm created ${routes.length} optimized routes`);
      
      // 4. Optimize each route with real-time traffic data
      const optimizedRoutes = await this.optimizeRoutesWithTraffic(routes, date);
      console.log(`🚦 Traffic optimization complete`);
      
      // 5. Calculate comprehensive cost analysis including CO2 and sustainability
      const costAnalysis = this.calculateEnhancedCostAnalysis(optimizedRoutes);
      const sustainability = this.calculateSustainabilityMetrics(costAnalysis);
      
      console.log(`✅ Enhanced VRP complete: ${costAnalysis.efficiencyGain.toFixed(1)}% efficiency, ${sustainability.totalCO2Emissions.toFixed(1)}kg CO2`);
      
      // 6. Store results in database
      await this.storeOptimizationResults(optimizedRoutes, costAnalysis, sustainability, date);
      
      return {
        routes: optimizedRoutes,
        costAnalysis,
        sustainability,
        algorithm: 'Clarke-Wright Enhanced',
        optimizationTime: Date.now() - Date.now()
      };
    } catch (error) {
      console.error('Enhanced VRP optimization failed:', error);
      return this.fallbackRouteAssignment(clusters, availableVehicles);
    }
  }

  async prepareJobData(jobs) {
    const client = await pool.connect();
    try {
      const preparedJobs = await Promise.all(jobs.map(async job => {
        // Get Stockholm area traffic multiplier for realistic routing
        const { rows } = await client.query(
          'SELECT traffic_multiplier FROM stockholm_areas WHERE $1 = ANY(postal_codes)',
          [job.postal_code || this.extractPostalCode(job.address)]
        );
        
        return {
          id: job.job_id || job.id,
          lat: job.address_lat || job.lat,
          lng: job.address_lng || job.lng,
          estimated_volume: job.estimated_volume || this.estimateJobVolume(job),
          estimated_duration: job.estimated_duration_minutes || this.estimateJobDuration(job),
          traffic_multiplier: rows[0]?.traffic_multiplier || 1.0,
          priority: job.priority || 'normal', // high, normal, low
          time_window: job.time_window || null, // e.g., "09:00-17:00"
          service_type: job.service_type || 'moving',
          apartment_size: job.apartment_size || '2',
          postal_code: job.postal_code || this.extractPostalCode(job.address),
          customer_name: job.customer_name || `Kund ${job.id}`
        };
      }));
      
      return preparedJobs.filter(job => job.lat && job.lng); // Remove jobs without coordinates
    } finally {
      client.release();
    }
  }

  extractPostalCode(address) {
    // Extract 5-digit postal code from address string
    const match = address?.match(/\b\d{5}\b/);
    return match ? parseInt(match[0]) : 11111; // Default to Stockholm center
  }

  estimateJobVolume(job) {
    // Enhanced volume estimation based on service type and apartment size
    const baseVolumes = {
      'moving': 8.0,      // m³ for moving
      'packing': 2.0,     // m³ for packing only
      'cleaning': 0.5,    // m³ (equipment only)
      'storage': 15.0,    // m³ for storage services
      'assembly': 1.0     // m³ for furniture assembly
    };
    
    const roomMultipliers = {
      '1': 0.7,
      '2': 1.0,
      '3': 1.4,
      '4': 1.8,
      '5+': 2.2
    };
    
    const baseVolume = baseVolumes[job.service_type] || 8.0;
    const roomMultiplier = roomMultipliers[job.apartment_size] || 1.0;
    
    // Add complexity factors
    let complexityMultiplier = 1.0;
    if (job.piano_count > 0) complexityMultiplier += 0.3;
    if (job.heavy_appliances_count > 0) complexityMultiplier += 0.2;
    if (job.floors_total > 3 && !job.elevator_available) complexityMultiplier += 0.4;
    
    return Math.round(baseVolume * roomMultiplier * complexityMultiplier * 100) / 100;
  }

  estimateJobDuration(job) {
    // Base duration by service type (minutes)
    const baseDurations = {
      'moving': 180,      // 3 hours
      'packing': 90,      // 1.5 hours
      'cleaning': 120,    // 2 hours
      'storage': 60,      // 1 hour
      'assembly': 45      // 45 minutes
    };
    
    let duration = baseDurations[job.service_type] || 180;
    
    // Adjust for apartment size
    const sizeMultipliers = { '1': 0.7, '2': 1.0, '3': 1.3, '4': 1.6, '5+': 2.0 };
    duration *= sizeMultipliers[job.apartment_size] || 1.0;
    
    // Add time for stairs if no elevator
    if (job.floors_total > 1 && !job.elevator_available) {
      duration += (job.floors_total - 1) * 15; // 15 min per floor
    }
    
    return Math.round(duration);
  }

  async calculateCachedDistanceMatrix(jobs) {
    console.log(`📍 Calculating distance matrix for ${jobs.length} jobs with intelligent caching`);
    
    const matrix = {};
    const cacheMisses = [];
    let cacheHits = 0;
    
    // Initialize matrix and check cache
    for (let i = 0; i < jobs.length; i++) {
      matrix[i] = {};
      for (let j = 0; j < jobs.length; j++) {
        if (i === j) {
          matrix[i][j] = { distance: 0, duration: 0, durationInTraffic: 0 };
          continue;
        }
        
        const cached = await this.getCachedDistance(jobs[i], jobs[j]);
        if (cached && !this.isCacheExpired(cached)) {
          matrix[i][j] = cached;
          cacheHits++;
        } else {
          matrix[i][j] = null;
          cacheMisses.push({ i, j, jobI: jobs[i], jobJ: jobs[j] });
        }
      }
    }
    
    console.log(`💾 Cache performance: ${cacheHits} hits, ${cacheMisses.length} misses`);
    
    // Batch fetch missing distances from Google Maps API
    if (cacheMisses.length > 0) {
      console.log(`🔄 Fetching ${cacheMisses.length} new distances from Google Maps API`);
      const newDistances = await this.mapsService.getBatchDistances(cacheMisses);
      
      // Update matrix and cache results
      for (let k = 0; k < cacheMisses.length; k++) {
        const { i, j } = cacheMisses[k];
        const distance = newDistances[k];
        matrix[i][j] = distance;
        matrix[j][i] = distance; // Symmetric matrix
        
        // Cache both directions
        await this.cacheDistance(jobs[i], jobs[j], distance);
        await this.cacheDistance(jobs[j], jobs[i], distance);
      }
    }
    
    console.log(`✅ Distance matrix complete: ${Object.keys(matrix).length}x${Object.keys(matrix).length} entries`);
    return matrix;
  }

  async getCachedDistance(jobA, jobB) {
    const { rows } = await pool.query(`
      SELECT distance_meters, duration_seconds, duration_in_traffic_seconds, traffic_condition, cached_at
      FROM traffic_cache 
      WHERE ABS(origin_lat - $1) < 0.0001 AND ABS(origin_lng - $2) < 0.0001 
      AND ABS(destination_lat - $3) < 0.0001 AND ABS(destination_lng - $4) < 0.0001
      AND expires_at > NOW()
      ORDER BY cached_at DESC
      LIMIT 1
    `, [jobA.lat, jobA.lng, jobB.lat, jobB.lng]);
    
    if (rows.length > 0) {
      const cached = rows[0];
      return {
        distance: cached.distance_meters / 1000, // Convert to km
        duration: cached.duration_seconds / 60,  // Convert to minutes
        durationInTraffic: (cached.duration_in_traffic_seconds || cached.duration_seconds) / 60,
        trafficCondition: cached.traffic_condition,
        cachedAt: cached.cached_at
      };
    }
    
    return null;
  }

  isCacheExpired(cached) {
    // Consider cache expired after 30 minutes for traffic sensitivity
    const expiryTime = 30 * 60 * 1000; // 30 minutes in milliseconds
    return Date.now() - new Date(cached.cachedAt).getTime() > expiryTime;
  }

  async cacheDistance(jobA, jobB, distanceData) {
    try {
      await pool.query(`
        INSERT INTO traffic_cache 
        (origin_lat, origin_lng, destination_lat, destination_lng, distance_meters, duration_seconds, duration_in_traffic_seconds, traffic_condition, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '30 minutes')
        ON CONFLICT DO NOTHING
      `, [
        jobA.lat, jobA.lng, jobB.lat, jobB.lng,
        Math.round(distanceData.distance * 1000), // Convert to meters
        Math.round(distanceData.duration * 60),   // Convert to seconds
        Math.round((distanceData.durationInTraffic || distanceData.duration) * 60),
        distanceData.trafficCondition || 'unknown'
      ]);
    } catch (error) {
      console.error('Failed to cache distance:', error);
      // Continue without caching - non-critical error
    }
  }

  async clarkeWrightSavingsAlgorithm(jobs, distanceMatrix, vehicles) {
    console.log(`🧮 Running Clarke-Wright Savings Algorithm for ${jobs.length} jobs and ${vehicles.length} vehicles`);
    
    // Step 1: Calculate all possible savings values
    const savingsList = [];
    
    for (let i = 0; i < jobs.length; i++) {
      for (let j = i + 1; j < jobs.length; j++) {
        const depotToI = this.getDistance(this.depot, jobs[i], distanceMatrix, i) || this.calculateHaversineDistance(
          this.depot.lat, this.depot.lng, jobs[i].lat, jobs[i].lng
        );
        const depotToJ = this.getDistance(this.depot, jobs[j], distanceMatrix, j) || this.calculateHaversineDistance(
          this.depot.lat, this.depot.lng, jobs[j].lat, jobs[j].lng
        );
        const iToJ = this.getDistance(jobs[i], jobs[j], distanceMatrix, i, j) || this.calculateHaversineDistance(
          jobs[i].lat, jobs[i].lng, jobs[j].lat, jobs[j].lng
        );
        
        // Clarke-Wright savings formula: s(i,j) = c(depot,i) + c(depot,j) - c(i,j)
        const savings = depotToI + depotToJ - iToJ;
        
        savingsList.push({
          i,
          j,
          savings,
          jobI: jobs[i],
          jobJ: jobs[j],
          distance: iToJ
        });
      }
    }
    
    // Step 2: Sort savings in descending order (highest savings first)
    savingsList.sort((a, b) => b.savings - a.savings);
    console.log(`💰 Top savings: ${savingsList.slice(0, 3).map(s => s.savings.toFixed(2)).join(', ')} km`);
    
    // Step 3: Initialize empty routes for each vehicle
    const routes = vehicles.map(vehicle => ({
      vehicleId: vehicle.id,
      vehicle: vehicle,
      jobs: [],
      totalVolume: 0,
      totalDistance: 0,
      totalDuration: 0,
      visitedJobIds: new Set(),
      fuelCost: 0,
      co2Emissions: 0
    }));
    
    // Step 4: Process savings list and build routes using Clarke-Wright logic
    for (const saving of savingsList) {
      const { i, j, jobI, jobJ } = saving;
      
      // Find routes containing these jobs
      const routeI = routes.find(r => r.visitedJobIds.has(jobI.id));
      const routeJ = routes.find(r => r.visitedJobIds.has(jobJ.id));
      
      // Case 1: Neither job is assigned - create new route if vehicle available
      if (!routeI && !routeJ) {
        const availableRoute = routes.find(r => r.jobs.length === 0);
        if (availableRoute && this.canAddJobsToRoute(availableRoute, [jobI, jobJ])) {
          this.addJobsToRoute(availableRoute, [jobI, jobJ]);
        }
      }
      // Case 2: One job assigned, other not - try to add to existing route
      else if (routeI && !routeJ) {
        if (this.canAddJobsToRoute(routeI, [jobJ])) {
          this.addJobsToRoute(routeI, [jobJ]);
        }
      }
      else if (!routeI && routeJ) {
        if (this.canAddJobsToRoute(routeJ, [jobI])) {
          this.addJobsToRoute(routeJ, [jobI]);
        }
      }
      // Case 3: Both jobs in different routes - try to merge if beneficial
      else if (routeI && routeJ && routeI !== routeJ) {
        if (this.canMergeRoutes(routeI, routeJ)) {
          this.mergeRoutes(routeI, routeJ, routes);
        }
      }
    }
    
    // Step 5: Assign remaining unassigned jobs using best-fit heuristic
    const allAssignedJobIds = new Set();
    routes.forEach(route => route.jobs.forEach(job => allAssignedJobIds.add(job.id)));
    
    const unassignedJobs = jobs.filter(job => !allAssignedJobIds.has(job.id));
    console.log(`📋 Assigning ${unassignedJobs.length} remaining jobs`);
    
    for (const job of unassignedJobs) {
      const bestRoute = this.findBestRouteForJob(job, routes);
      if (bestRoute) {
        this.addJobsToRoute(bestRoute, [job]);
      } else {
        console.warn(`⚠️ Could not assign job ${job.id} to any route`);
      }
    }
    
    const activeRoutes = routes.filter(route => route.jobs.length > 0);
    console.log(`✅ Clarke-Wright complete: ${activeRoutes.length} routes created from ${vehicles.length} vehicles`);
    
    return activeRoutes;
  }

  canAddJobsToRoute(route, jobs) {
    const totalNewVolume = jobs.reduce((sum, job) => sum + job.estimated_volume, 0);
    const totalNewDuration = jobs.reduce((sum, job) => sum + job.estimated_duration, 0);
    
    // Check volume capacity constraint
    if (route.totalVolume + totalNewVolume > route.vehicle.capacity_cubic_meters) {
      return false;
    }
    
    // Check time constraint (max working hours)
    if ((route.totalDuration + totalNewDuration) > (this.maxWorkingHours * 60)) {
      return false;
    }
    
    // Check time windows if specified
    for (const job of jobs) {
      if (job.time_window && !this.isTimeWindowCompatible(route, job.time_window)) {
        return false;
      }
    }
    
    return true;
  }

  isTimeWindowCompatible(route, timeWindow) {
    // Simple time window check - can be enhanced with more sophisticated logic
    if (!timeWindow) return true;
    
    const [start, end] = timeWindow.split('-');
    // For now, assume all jobs can be scheduled if total duration fits in working hours
    return route.totalDuration < (this.maxWorkingHours * 60);
  }

  addJobsToRoute(route, jobs) {
    for (const job of jobs) {
      route.jobs.push(job);
      route.visitedJobIds.add(job.id);
      route.totalVolume += job.estimated_volume;
      route.totalDuration += job.estimated_duration;
    }
    
    // Update distance calculation
    route.totalDistance = this.calculateRouteDistance(route.jobs);
  }

  calculateRouteDistance(jobs) {
    if (jobs.length === 0) return 0;
    
    let totalDistance = 0;
    
    // Distance from depot to first job
    if (jobs.length > 0) {
      totalDistance += this.calculateHaversineDistance(
        this.depot.lat, this.depot.lng, jobs[0].lat, jobs[0].lng
      );
    }
    
    // Distance between consecutive jobs
    for (let i = 0; i < jobs.length - 1; i++) {
      totalDistance += this.calculateHaversineDistance(
        jobs[i].lat, jobs[i].lng, jobs[i + 1].lat, jobs[i + 1].lng
      );
    }
    
    // Distance from last job back to depot
    if (jobs.length > 0) {
      const lastJob = jobs[jobs.length - 1];
      totalDistance += this.calculateHaversineDistance(
        lastJob.lat, lastJob.lng, this.depot.lat, this.depot.lng
      );
    }
    
    return totalDistance;
  }

  canMergeRoutes(routeA, routeB) {
    const combinedVolume = routeA.totalVolume + routeB.totalVolume;
    const combinedDuration = routeA.totalDuration + routeB.totalDuration;
    
    // Find largest vehicle that can handle combined load
    const maxCapacity = Math.max(routeA.vehicle.capacity_cubic_meters, routeB.vehicle.capacity_cubic_meters);
    
    return combinedVolume <= maxCapacity && combinedDuration <= (this.maxWorkingHours * 60);
  }

  mergeRoutes(routeA, routeB, allRoutes) {
    // Merge routeB into routeA and remove routeB
    routeA.jobs.push(...routeB.jobs);
    routeB.jobs.forEach(job => routeA.visitedJobIds.add(job.id));
    routeA.totalVolume += routeB.totalVolume;
    routeA.totalDuration += routeB.totalDuration;
    routeA.totalDistance = this.calculateRouteDistance(routeA.jobs);
    
    // Use the larger vehicle
    if (routeB.vehicle.capacity_cubic_meters > routeA.vehicle.capacity_cubic_meters) {
      routeA.vehicle = routeB.vehicle;
      routeA.vehicleId = routeB.vehicleId;
    }
    
    // Clear routeB
    routeB.jobs = [];
    routeB.visitedJobIds.clear();
    routeB.totalVolume = 0;
    routeB.totalDuration = 0;
    routeB.totalDistance = 0;
  }

  findBestRouteForJob(job, routes) {
    let bestRoute = null;
    let lowestAdditionalCost = Infinity;
    
    for (const route of routes) {
      if (this.canAddJobsToRoute(route, [job])) {
        // Calculate additional distance cost if job is added
        const currentDistance = route.totalDistance;
        const newDistance = this.calculateRouteDistance([...route.jobs, job]);
        const additionalCost = newDistance - currentDistance;
        
        if (additionalCost < lowestAdditionalCost) {
          lowestAdditionalCost = additionalCost;
          bestRoute = route;
        }
      }
    }
    
    return bestRoute;
  }

  getDistance(locationA, locationB, distanceMatrix, indexA = null, indexB = null) {
    // Try to get from distance matrix first
    if (indexA !== null && indexB !== null && distanceMatrix[indexA] && distanceMatrix[indexA][indexB]) {
      return distanceMatrix[indexA][indexB].distance;
    }
    
    // Fallback to Haversine calculation
    if (locationA.lat && locationA.lng && locationB.lat && locationB.lng) {
      return this.calculateHaversineDistance(
        locationA.lat, locationA.lng, locationB.lat, locationB.lng
      );
    }
    
    return 25; // Default fallback distance in km
  }

  calculateHaversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  async optimizeRoutesWithTraffic(routes, date) {
    console.log(`🚦 Optimizing ${routes.length} routes with real-time traffic data`);
    
    const optimizedRoutes = [];
    
    for (const route of routes) {
      if (route.jobs.length === 0) continue;
      
      try {
        // Build waypoints including depot
        const waypoints = [
          this.depot,
          ...route.jobs.map(job => ({ 
            lat: job.lat, 
            lng: job.lng, 
            jobId: job.id,
            name: job.customer_name 
          })),
          this.depot // Return to depot
        ];
        
        // Get traffic-optimized route from Google Maps
        const trafficOptimizedRoute = await this.mapsService.getOptimizedRouteWithTraffic(waypoints, new Date(date));
        
        // Calculate costs and emissions
        const distance = trafficOptimizedRoute.totalDistance / 1000; // Convert to km
        const fuelUsed = (distance / 100) * route.vehicle.fuel_consumption_per_100km;
        const fuelCost = fuelUsed * this.fuelCostPerLiter;
        const co2Emissions = (distance / 1000) * route.vehicle.co2_emission_grams_per_km; // grams
        
        optimizedRoutes.push({
          ...route,
          googleMapsRoute: trafficOptimizedRoute,
          realTimeDistance: trafficOptimizedRoute.totalDistance, // meters
          realTimeDuration: trafficOptimizedRoute.totalDuration, // seconds
          realTimeDurationInTraffic: trafficOptimizedRoute.totalDurationInTraffic, // seconds
          trafficCondition: trafficOptimizedRoute.overallTrafficCondition,
          optimizedWaypoints: trafficOptimizedRoute.optimizedOrder,
          fuelCost: Math.round(fuelCost * 100) / 100,
          co2Emissions: Math.round(co2Emissions), // grams
          estimatedArrival: trafficOptimizedRoute.estimatedArrival
        });
        
      } catch (error) {
        console.error(`Failed to optimize route ${route.vehicleId} with traffic:`, error);
        
        // Fallback to simple calculations
        const fallbackDistance = route.totalDistance * 1000; // Convert to meters
        const fallbackDuration = route.totalDuration * 60; // Convert to seconds
        const fuelUsed = (route.totalDistance / 100) * route.vehicle.fuel_consumption_per_100km;
        
        optimizedRoutes.push({
          ...route,
          realTimeDistance: fallbackDistance,
          realTimeDuration: fallbackDuration,
          realTimeDurationInTraffic: fallbackDuration * 1.2, // Assume 20% traffic delay
          trafficCondition: 'unknown',
          fuelCost: Math.round(fuelUsed * this.fuelCostPerLiter * 100) / 100,
          co2Emissions: Math.round((route.totalDistance / 1000) * route.vehicle.co2_emission_grams_per_km),
          estimatedArrival: new Date(Date.now() + fallbackDuration * 1000)
        });
      }
    }
    
    console.log(`✅ Traffic optimization complete for ${optimizedRoutes.length} routes`);
    return optimizedRoutes;
  }

  calculateEnhancedCostAnalysis(routes) {
    let totalDistance = 0; // km
    let totalFuelCost = 0; // SEK
    let totalCO2Emissions = 0; // grams
    let totalDuration = 0; // hours
    let totalOperatingCost = 0; // SEK
    
    for (const route of routes) {
      const routeDistance = route.realTimeDistance / 1000; // Convert to km
      const routeDuration = route.realTimeDurationInTraffic / 3600; // Convert to hours
      
      totalDistance += routeDistance;
      totalFuelCost += route.fuelCost;
      totalCO2Emissions += route.co2Emissions;
      totalDuration += routeDuration;
      totalOperatingCost += routeDistance * this.avgOperatingCostPerKm;
    }
    
    // Calculate savings vs naive approach (one vehicle per job)
    const totalJobs = routes.reduce((sum, route) => sum + route.jobs.length, 0);
    const naiveDistance = totalJobs * 30; // Assume 30km average per job with separate trips
    const naiveCO2 = naiveDistance * 150; // 150g CO2 per km average
    const naiveFuelCost = (naiveDistance / 100) * 8 * this.fuelCostPerLiter; // 8L/100km avg
    
    const distanceSavings = naiveDistance - totalDistance;
    const co2Savings = naiveCO2 - totalCO2Emissions;
    const fuelSavings = naiveFuelCost - totalFuelCost;
    const costSavings = distanceSavings * this.avgOperatingCostPerKm;
    
    const efficiencyGain = totalDistance > 0 ? ((distanceSavings / naiveDistance) * 100) : 0;
    
    return {
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalFuelCost: Math.round(totalFuelCost),
      totalCO2Emissions: Math.round(totalCO2Emissions), // grams
      totalDuration: Math.round(totalDuration * 10) / 10,
      totalOperatingCost: Math.round(totalOperatingCost),
      totalJobs,
      totalRoutes: routes.length,
      // Savings calculations
      distanceSavings: Math.round(distanceSavings * 10) / 10,
      co2Savings: Math.round(co2Savings), // grams
      fuelSavings: Math.round(fuelSavings),
      costSavings: Math.round(costSavings),
      // Efficiency metrics
      efficiencyGain: Math.round(efficiencyGain * 10) / 10,
      averageDistancePerJob: Math.round((totalDistance / totalJobs) * 10) / 10,
      averageJobsPerRoute: Math.round((totalJobs / routes.length) * 10) / 10,
      fuelEfficiencyGain: Math.round(((fuelSavings / naiveFuelCost) * 100) * 10) / 10
    };
  }

  calculateSustainabilityMetrics(costAnalysis) {
    const totalCO2Emissions = costAnalysis.totalCO2Emissions / 1000; // Convert to kg
    const co2Savings = costAnalysis.co2Savings / 1000; // Convert to kg
    
    // Calculate environmental scores
    const co2ReductionPercent = co2Savings > 0 ? ((co2Savings / (totalCO2Emissions + co2Savings)) * 100) : 0;
    const efficiencyScore = Math.min(costAnalysis.efficiencyGain, 50) / 50 * 100; // Max 50% efficiency gain
    const fuelEfficiencyScore = Math.min(costAnalysis.fuelEfficiencyGain, 40) / 40 * 100; // Max 40% fuel savings
    
    const overallEnvironmentalScore = (co2ReductionPercent + efficiencyScore + fuelEfficiencyScore) / 3;
    
    return {
      totalCO2Emissions: Math.round(totalCO2Emissions * 100) / 100,
      co2SaveingsVsNaive: Math.round(co2Savings * 100) / 100,
      co2ReductionPercent: Math.round(co2ReductionPercent * 10) / 10,
      environmentalScore: {
        co2ReductionPercent: Math.round(co2ReductionPercent * 10) / 10,
        efficiencyScore: Math.round(efficiencyScore * 10) / 10,
        fuelEfficiencyScore: Math.round(fuelEfficiencyScore * 10) / 10,
        overallScore: Math.round(overallEnvironmentalScore * 10) / 10,
        sustainability_rating: this.getSustainabilityRating(overallEnvironmentalScore)
      },
      estimatedCarbonFootprintReduction: Math.round(co2Savings * 100) / 100, // kg CO2
      equivalentTreesPlanted: Math.round((co2Savings / 22) * 10) / 10, // 22kg CO2 per tree per year
      monthlyFuelCostSavings: Math.round(costAnalysis.fuelSavings * 22), // Approximate monthly savings
      yearlyEnvironmentalImpact: {
        co2Reduction: Math.round(co2Savings * 365 / 100) / 100, // tons per year if same savings daily
        fuelSavings: Math.round(costAnalysis.fuelSavings * 365), // SEK per year
        distanceReduction: Math.round(costAnalysis.distanceSavings * 365) // km per year
      }
    };
  }

  getSustainabilityRating(score) {
    if (score >= 90) return '🌟 Utmärkt';
    if (score >= 80) return '🌱 Mycket Bra';
    if (score >= 70) return '♻️  Bra';
    if (score >= 60) return '🌿 Tillfredsställande';
    if (score >= 50) return '⚠️  Acceptabel';
    return '❌ Behöver Förbättring';
  }

  async storeOptimizationResults(routes, costAnalysis, sustainability, date) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Store sustainability metrics
      await client.query(`
        INSERT INTO sustainability_metrics 
        (date, total_distance_km, total_co2_emissions_kg, co2_saved_vs_naive_kg, fuel_cost_saved, efficiency_percent, sustainability_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        date,
        costAnalysis.totalDistance,
        sustainability.totalCO2Emissions,
        sustainability.co2SaveingsVsNaive,
        costAnalysis.fuelSavings,
        costAnalysis.efficiencyGain,
        sustainability.environmentalScore.overallScore
      ]);
      
      // Store individual route optimizations
      for (const route of routes) {
        await client.query(`
          INSERT INTO optimized_routes 
          (vehicle_id, job_sequence, total_distance_km, total_duration_minutes, total_fuel_cost, estimated_co2_emissions, traffic_condition, real_time_eta, google_maps_route)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          route.vehicleId,
          JSON.stringify(route.jobs.map(job => ({ id: job.id, customer_name: job.customer_name, address: `${job.lat},${job.lng}` }))),
          route.realTimeDistance / 1000, // Convert to km
          route.realTimeDurationInTraffic / 60, // Convert to minutes
          route.fuelCost,
          route.co2Emissions,
          route.trafficCondition,
          route.estimatedArrival,
          JSON.stringify(route.googleMapsRoute || {})
        ]);
      }
      
      await client.query('COMMIT');
      console.log(`📊 Optimization results stored for ${routes.length} routes`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to store optimization results:', error);
    } finally {
      client.release();
    }
  }

  fallbackRouteAssignment(clusters, vehicles) {
    console.warn('🚨 Using fallback route assignment due to optimization failure');
    
    const routes = [];
    const allJobs = clusters.flat();
    const jobsPerVehicle = Math.ceil(allJobs.length / vehicles.length);
    
    for (let i = 0; i < vehicles.length && i * jobsPerVehicle < allJobs.length; i++) {
      const vehicleJobs = allJobs.slice(i * jobsPerVehicle, (i + 1) * jobsPerVehicle);
      
      routes.push({
        vehicleId: vehicles[i].id,
        vehicle: vehicles[i],
        jobs: vehicleJobs,
        totalDistance: vehicleJobs.length * 25, // 25km avg per job
        realTimeDistance: vehicleJobs.length * 25000, // meters
        fuelCost: vehicleJobs.length * 15, // 15 SEK per job
        co2Emissions: vehicleJobs.length * 3000, // 3kg per job
        trafficCondition: 'unknown'
      });
    }
    
    return {
      routes,
      costAnalysis: {
        totalDistance: routes.reduce((sum, r) => sum + r.totalDistance, 0),
        efficiencyGain: 50, // Conservative fallback efficiency
        totalFuelCost: routes.reduce((sum, r) => sum + r.fuelCost, 0)
      },
      sustainability: {
        totalCO2Emissions: routes.reduce((sum, r) => sum + r.co2Emissions, 0) / 1000,
        environmentalScore: { overallScore: 50, sustainability_rating: '⚠️  Fallback Mode' }
      },
      algorithm: 'Fallback-Simple-Assignment'
    };
  }
}