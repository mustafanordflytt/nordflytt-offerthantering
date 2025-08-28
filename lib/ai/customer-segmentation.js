// Advanced Customer Segmentation with K-means clustering and ML analytics
// Phase 4 implementation featuring sophisticated customer analysis

import * as tf from '@tensorflow/tfjs';
import pool from '../database/connection.js';

export class AdvancedCustomerAnalytics {
  constructor() {
    this.segments = [];
    this.segmentModel = null;
    this.scaler = null;
    this.clusterCenters = null;
    this.optimalK = 5;
  }

  // Perform comprehensive customer segmentation using K-means clustering
  async performCustomerSegmentation() {
    console.log('🎯 Starting advanced customer segmentation with K-means clustering...');
    
    try {
      const customerData = await this.extractCustomerFeatures();
      console.log(`📊 Analyzing ${customerData.length} customers`);
      
      if (customerData.length < 10) {
        console.warn('⚠️ Insufficient customer data, using mock segmentation');
        return this.generateMockSegmentation();
      }

      // Prepare and normalize features
      const features = await this.prepareFeatures(customerData);
      const normalizedFeatures = await this.normalizeFeatures(features);
      
      // Determine optimal number of clusters
      const optimalK = await this.findOptimalClusters(normalizedFeatures);
      console.log(`🎯 Optimal number of clusters: ${optimalK}`);
      
      // Perform K-means clustering
      const clusters = await this.performKMeans(normalizedFeatures, optimalK);
      
      // Analyze and interpret segments
      this.segments = await this.analyzeSegments(customerData, clusters.assignments);
      
      // Calculate customer lifetime value for each segment
      await this.calculateSegmentCLV();
      
      // Generate personalized marketing strategies
      await this.generateMarketingStrategies();
      
      // Store segmentation results
      await this.saveSegments();
      
      console.log(`✅ Customer segmentation completed: ${Object.keys(this.segments).length} segments identified`);
      return this.segments;

    } catch (error) {
      console.error('❌ Customer segmentation failed:', error);
      return this.generateMockSegmentation();
    }
  }

  // Extract comprehensive customer features
  async extractCustomerFeatures() {
    const customerQuery = `
      SELECT 
        j.customer_id,
        COUNT(*) as total_bookings,
        SUM(j.total_amount) as total_spent,
        AVG(j.total_amount) as avg_order_value,
        MAX(j.total_amount) as max_order_value,
        MIN(j.total_amount) as min_order_value,
        AVG(COALESCE(j.customer_rating, 3)) as avg_rating,
        STDDEV(j.total_amount) as spending_variance,
        EXTRACT(DAYS FROM (NOW() - MAX(j.created_at))) as days_since_last_booking,
        EXTRACT(DAYS FROM (MAX(j.created_at) - MIN(j.created_at))) as customer_lifespan,
        AVG(EXTRACT(DAYS FROM (j.completion_date - j.created_at))) as avg_booking_lead_time,
        COUNT(DISTINCT j.service_type) as service_variety,
        COUNT(DISTINCT DATE_TRUNC('month', j.created_at)) as active_months,
        AVG(j.distance_km) as avg_distance,
        COUNT(CASE WHEN j.service_type = 'residential' THEN 1 END) as residential_bookings,
        COUNT(CASE WHEN j.service_type = 'commercial' THEN 1 END) as commercial_bookings,
        COUNT(CASE WHEN j.status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN j.status = 'cancelled' THEN 1 END) as cancelled_bookings,
        AVG(CASE WHEN EXTRACT(DOW FROM j.created_at) IN (0,6) THEN 1 ELSE 0 END) as weekend_preference,
        COUNT(CASE WHEN j.created_at >= NOW() - INTERVAL '90 days' THEN 1 END) as recent_activity
      FROM jobs j
      GROUP BY j.customer_id
      HAVING COUNT(*) >= 1
      ORDER BY total_spent DESC
    `;

    const { rows } = await pool.query(customerQuery);
    
    // Enrich with additional calculated features
    return rows.map(customer => ({
      ...customer,
      // Behavioral features
      booking_frequency: customer.customer_lifespan > 0 ? customer.total_bookings / (customer.customer_lifespan / 30.44) : 0,
      completion_rate: customer.total_bookings > 0 ? customer.completed_bookings / customer.total_bookings : 0,
      cancellation_rate: customer.total_bookings > 0 ? customer.cancelled_bookings / customer.total_bookings : 0,
      loyalty_score: this.calculateLoyaltyScore(customer),
      value_consistency: customer.spending_variance ? 1 / (1 + customer.spending_variance / customer.avg_order_value) : 0,
      
      // Recency, Frequency, Monetary (RFM) scores
      recency_score: this.calculateRecencyScore(customer.days_since_last_booking),
      frequency_score: this.calculateFrequencyScore(customer.total_bookings, customer.customer_lifespan),
      monetary_score: this.calculateMonetaryScore(customer.total_spent),
      
      // Risk factors
      churn_risk: this.calculateChurnRisk(customer),
      value_risk: customer.avg_order_value < 1000 ? 0.8 : customer.avg_order_value > 10000 ? 0.2 : 0.5
    }));
  }

  // Prepare features for clustering
  async prepareFeatures(customerData) {
    console.log('🔧 Preparing features for clustering...');
    
    return customerData.map(customer => [
      // Core business metrics (log-transformed for normalization)
      Math.log(customer.total_bookings + 1),
      Math.log(customer.total_spent + 1),
      Math.log(customer.avg_order_value + 1),
      
      // Behavioral metrics
      customer.booking_frequency || 0,
      customer.completion_rate || 0,
      customer.avg_rating || 3,
      customer.loyalty_score || 0,
      
      // Temporal metrics (normalized)
      Math.min(customer.days_since_last_booking / 365, 2), // Cap at 2 years
      customer.active_months / 24, // Normalize to 2 years max
      
      // Service preferences
      customer.service_variety / 5, // Max 5 service types
      customer.weekend_preference || 0,
      customer.residential_bookings / customer.total_bookings,
      
      // Value metrics
      customer.value_consistency || 0,
      customer.monetary_score || 0,
      customer.recency_score || 0,
      
      // Risk factors
      customer.churn_risk || 0,
      customer.cancellation_rate || 0
    ]);
  }

  // Normalize features using Z-score standardization
  async normalizeFeatures(features) {
    console.log('📏 Normalizing features...');
    
    const featureTensor = tf.tensor2d(features);
    const { mean, variance } = tf.moments(featureTensor, 0);
    const std = variance.sqrt();
    
    // Store scaler for future use
    this.scaler = { mean: await mean.data(), std: await std.data() };
    
    const normalizedTensor = featureTensor.sub(mean).div(std.add(1e-8)); // Add small epsilon to avoid division by zero
    const normalizedFeatures = await normalizedTensor.array();
    
    featureTensor.dispose();
    mean.dispose();
    variance.dispose();
    std.dispose();
    normalizedTensor.dispose();
    
    return normalizedFeatures;
  }

  // Find optimal number of clusters using elbow method and silhouette analysis
  async findOptimalClusters(features, maxK = 8, minK = 2) {
    console.log('🔍 Finding optimal number of clusters...');
    
    const costs = [];
    const silhouetteScores = [];
    
    for (let k = minK; k <= maxK; k++) {
      try {
        const result = await this.performKMeans(features, k, 50); // Fewer iterations for optimization
        costs.push(result.cost);
        
        const silhouetteScore = await this.calculateSilhouetteScore(features, result.assignments, result.centroids);
        silhouetteScores.push(silhouetteScore);
        
        console.log(`K=${k}: Cost=${result.cost.toFixed(2)}, Silhouette=${silhouetteScore.toFixed(3)}`);
      } catch (error) {
        console.warn(`Failed to evaluate K=${k}:`, error);
        costs.push(Infinity);
        silhouetteScores.push(0);
      }
    }
    
    // Find elbow point
    const elbowK = this.findElbowPoint(costs) + minK;
    
    // Find best silhouette score
    const bestSilhouetteK = silhouetteScores.indexOf(Math.max(...silhouetteScores)) + minK;
    
    // Choose based on combined criteria
    const optimalK = Math.abs(elbowK - bestSilhouetteK) <= 1 ? bestSilhouetteK : Math.min(elbowK, bestSilhouetteK);
    
    console.log(`📊 Elbow method suggests K=${elbowK}, Silhouette suggests K=${bestSilhouetteK}, chosen K=${optimalK}`);
    return Math.min(Math.max(optimalK, minK), maxK);
  }

  // Enhanced K-means clustering with multiple initializations
  async performKMeans(data, k, maxIterations = 100, numInitializations = 5) {
    console.log(`🎯 Performing K-means clustering with K=${k}...`);
    
    let bestResult = null;
    let bestCost = Infinity;
    
    // Try multiple random initializations
    for (let init = 0; init < numInitializations; init++) {
      try {
        const result = await this.singleKMeansRun(data, k, maxIterations);
        if (result.cost < bestCost) {
          bestCost = result.cost;
          bestResult = result;
        }
      } catch (error) {
        console.warn(`K-means initialization ${init + 1} failed:`, error);
      }
    }
    
    if (!bestResult) {
      throw new Error('All K-means initializations failed');
    }
    
    console.log(`✅ K-means converged with cost: ${bestResult.cost.toFixed(2)}`);
    return bestResult;
  }

  // Single K-means run
  async singleKMeansRun(data, k, maxIterations) {
    const [numPoints, dimensions] = [data.length, data[0].length];
    
    // Initialize centroids using K-means++
    let centroids = await this.initializeCentroidsKMeansPlusPlus(data, k);
    let assignments = new Array(numPoints).fill(0);
    let prevCost = Infinity;
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Assign points to nearest centroid
      const newAssignments = [];
      for (let i = 0; i < numPoints; i++) {
        let minDistance = Infinity;
        let assignedCluster = 0;
        
        for (let j = 0; j < k; j++) {
          const distance = this.euclideanDistance(data[i], centroids[j]);
          if (distance < minDistance) {
            minDistance = distance;
            assignedCluster = j;
          }
        }
        newAssignments.push(assignedCluster);
      }
      
      // Update centroids
      const newCentroids = [];
      for (let cluster = 0; cluster < k; cluster++) {
        const clusterPoints = data.filter((_, index) => newAssignments[index] === cluster);
        
        if (clusterPoints.length > 0) {
          const centroid = new Array(dimensions).fill(0);
          for (const point of clusterPoints) {
            for (let dim = 0; dim < dimensions; dim++) {
              centroid[dim] += point[dim];
            }
          }
          for (let dim = 0; dim < dimensions; dim++) {
            centroid[dim] /= clusterPoints.length;
          }
          newCentroids.push(centroid);
        } else {
          // Reinitialize empty cluster
          newCentroids.push(data[Math.floor(Math.random() * numPoints)].slice());
        }
      }
      
      // Calculate cost (sum of squared distances)
      let cost = 0;
      for (let i = 0; i < numPoints; i++) {
        const cluster = newAssignments[i];
        cost += Math.pow(this.euclideanDistance(data[i], newCentroids[cluster]), 2);
      }
      
      // Check convergence
      const costChange = Math.abs(prevCost - cost);
      if (costChange < 1e-6) {
        console.log(`K-means converged after ${iteration + 1} iterations`);
        break;
      }
      
      assignments = newAssignments;
      centroids = newCentroids;
      prevCost = cost;
    }
    
    return { centroids, assignments, cost: prevCost };
  }

  // K-means++ initialization for better initial centroids
  async initializeCentroidsKMeansPlusPlus(data, k) {
    const centroids = [];
    const numPoints = data.length;
    
    // Choose first centroid randomly
    centroids.push(data[Math.floor(Math.random() * numPoints)].slice());
    
    // Choose remaining centroids with probability proportional to squared distance
    for (let i = 1; i < k; i++) {
      const distances = data.map(point => {
        let minDist = Infinity;
        for (const centroid of centroids) {
          const dist = this.euclideanDistance(point, centroid);
          minDist = Math.min(minDist, dist);
        }
        return minDist * minDist;
      });
      
      const totalDistance = distances.reduce((sum, dist) => sum + dist, 0);
      const random = Math.random() * totalDistance;
      
      let cumulative = 0;
      for (let j = 0; j < numPoints; j++) {
        cumulative += distances[j];
        if (cumulative >= random) {
          centroids.push(data[j].slice());
          break;
        }
      }
    }
    
    return centroids;
  }

  // Calculate silhouette score for cluster quality assessment
  async calculateSilhouetteScore(data, assignments, centroids) {
    const numPoints = data.length;
    let totalSilhouette = 0;
    
    for (let i = 0; i < numPoints; i++) {
      const cluster = assignments[i];
      
      // Calculate average distance to points in same cluster (a)
      const sameClusterPoints = data.filter((_, index) => assignments[index] === cluster && index !== i);
      const a = sameClusterPoints.length > 0 
        ? sameClusterPoints.reduce((sum, point) => sum + this.euclideanDistance(data[i], point), 0) / sameClusterPoints.length
        : 0;
      
      // Calculate minimum average distance to points in other clusters (b)
      let b = Infinity;
      for (let otherCluster = 0; otherCluster < centroids.length; otherCluster++) {
        if (otherCluster !== cluster) {
          const otherClusterPoints = data.filter((_, index) => assignments[index] === otherCluster);
          if (otherClusterPoints.length > 0) {
            const avgDist = otherClusterPoints.reduce((sum, point) => sum + this.euclideanDistance(data[i], point), 0) / otherClusterPoints.length;
            b = Math.min(b, avgDist);
          }
        }
      }
      
      // Calculate silhouette coefficient
      const silhouette = b === Infinity ? 0 : (b - a) / Math.max(a, b);
      totalSilhouette += silhouette;
    }
    
    return totalSilhouette / numPoints;
  }

  // Analyze and interpret customer segments
  async analyzeSegments(customers, assignments) {
    console.log('🔍 Analyzing customer segments...');
    
    const segments = {};
    
    // Group customers by segment
    customers.forEach((customer, index) => {
      const segment = assignments[index];
      if (!segments[segment]) {
        segments[segment] = {
          id: segment,
          name: this.getSegmentName(segment),
          customers: [],
          metrics: {},
          characteristics: {},
          recommendations: []
        };
      }
      segments[segment].customers.push(customer);
    });

    // Calculate comprehensive segment metrics
    Object.keys(segments).forEach(segmentId => {
      const segment = segments[segmentId];
      const customers = segment.customers;
      const count = customers.length;
      
      segment.metrics = {
        count,
        percentage: (count / customers.length * 100).toFixed(1),
        
        // Financial metrics
        avg_bookings: this.average(customers.map(c => c.total_bookings)),
        avg_spent: this.average(customers.map(c => c.total_spent)),
        avg_order_value: this.average(customers.map(c => c.avg_order_value)),
        total_revenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
        
        // Behavioral metrics
        avg_rating: this.average(customers.map(c => c.avg_rating || 3)),
        avg_recency: this.average(customers.map(c => c.days_since_last_booking)),
        completion_rate: this.average(customers.map(c => c.completion_rate)),
        loyalty_score: this.average(customers.map(c => c.loyalty_score)),
        
        // Risk metrics
        churn_risk: this.average(customers.map(c => c.churn_risk)),
        cancellation_rate: this.average(customers.map(c => c.cancellation_rate))
      };
      
      // Identify segment characteristics
      segment.characteristics = this.identifySegmentCharacteristics(customers);
      
      // Generate specific recommendations
      segment.recommendations = this.generateSegmentRecommendations(segment);
      
      // Update segment name based on characteristics
      segment.name = this.getSegmentName(segmentId, segment.characteristics);
    });

    return segments;
  }

  // Calculate customer lifetime value for each segment
  async calculateSegmentCLV() {
    console.log('💰 Calculating Customer Lifetime Value for segments...');
    
    Object.keys(this.segments).forEach(segmentId => {
      const segment = this.segments[segmentId];
      const customers = segment.customers;
      
      const clvMetrics = customers.map(customer => {
        // Average order value
        const aov = customer.avg_order_value || 0;
        
        // Purchase frequency (bookings per month)
        const frequency = customer.booking_frequency || 0;
        
        // Customer lifespan prediction (based on current data and churn risk)
        const baseLifespan = customer.customer_lifespan / 30.44; // Convert to months
        const churnAdjustment = 1 - (customer.churn_risk || 0);
        const predictedLifespan = Math.max(1, baseLifespan * churnAdjustment * 2); // Project future lifespan
        
        // CLV = AOV × Frequency × Lifespan
        const clv = aov * frequency * predictedLifespan;
        
        return {
          customer_id: customer.customer_id,
          clv,
          aov,
          frequency,
          predicted_lifespan: predictedLifespan
        };
      });
      
      segment.clv_analysis = {
        avg_clv: this.average(clvMetrics.map(c => c.clv)),
        median_clv: this.median(clvMetrics.map(c => c.clv)),
        total_clv: clvMetrics.reduce((sum, c) => sum + c.clv, 0),
        clv_distribution: this.calculateCLVDistribution(clvMetrics)
      };
      
      // Update metrics with CLV
      segment.metrics.avg_clv = segment.clv_analysis.avg_clv;
    });
  }

  // Generate marketing strategies for each segment
  async generateMarketingStrategies() {
    console.log('📢 Generating personalized marketing strategies...');
    
    Object.keys(this.segments).forEach(segmentId => {
      const segment = this.segments[segmentId];
      const metrics = segment.metrics;
      const characteristics = segment.characteristics;
      
      const strategies = [];
      
      // High-value segments
      if (metrics.avg_clv > 15000) {
        strategies.push({
          type: 'VIP_Program',
          title: 'VIP Customer Program',
          description: 'Exclusive benefits, priority scheduling, and personalized service',
          expected_impact: 'Increase retention by 25%, boost AOV by 15%',
          investment: 'Medium',
          timeline: 'Immediate'
        });
      }
      
      // High churn risk
      if (metrics.churn_risk > 0.6) {
        strategies.push({
          type: 'Retention_Campaign',
          title: 'Win-Back Campaign',
          description: 'Personalized offers, satisfaction surveys, and quality guarantees',
          expected_impact: 'Reduce churn by 30%',
          investment: 'High',
          timeline: '2-4 weeks'
        });
      }
      
      // Low engagement
      if (metrics.avg_recency > 180) {
        strategies.push({
          type: 'Re_engagement',
          title: 'Re-engagement Series',
          description: 'Email campaigns with special offers and service reminders',
          expected_impact: 'Reactivate 15% of dormant customers',
          investment: 'Low',
          timeline: '1-2 weeks'
        });
      }
      
      // High potential value
      if (characteristics.growth_potential === 'high') {
        strategies.push({
          type: 'Upsell_Campaign',
          title: 'Service Expansion Program',
          description: 'Promote additional services and premium packages',
          expected_impact: 'Increase AOV by 20%',
          investment: 'Medium',
          timeline: '4-6 weeks'
        });
      }
      
      segment.marketing_strategies = strategies;
    });
  }

  // Save segmentation results to database
  async saveSegments() {
    try {
      // In production, save to actual database
      console.log('💾 Saving segmentation results...');
      
      for (const segmentId of Object.keys(this.segments)) {
        const segment = this.segments[segmentId];
        
        // Save segment metadata
        await pool.query(`
          INSERT INTO customer_segments (segment_id, name, characteristics, metrics, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (segment_id) DO UPDATE SET
            name = $2,
            characteristics = $3,
            metrics = $4,
            updated_at = NOW()
        `, [segmentId, segment.name, JSON.stringify(segment.characteristics), JSON.stringify(segment.metrics)]);
        
        // Save customer-segment assignments
        for (const customer of segment.customers) {
          await pool.query(`
            INSERT INTO customer_segment_assignments (customer_id, segment_id, assigned_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (customer_id) DO UPDATE SET
              segment_id = $2,
              assigned_at = NOW()
          `, [customer.customer_id, segmentId]);
        }
      }
      
      console.log('✅ Segmentation results saved successfully');
    } catch (error) {
      console.error('❌ Failed to save segments:', error);
    }
  }

  // Helper methods
  calculateLoyaltyScore(customer) {
    const factors = {
      frequency: Math.min(customer.total_bookings / 10, 1), // Normalize to 10 bookings max
      recency: Math.max(0, 1 - customer.days_since_last_booking / 365), // Last year activity
      monetary: Math.min(customer.total_spent / 50000, 1), // Normalize to 50k max
      rating: (customer.avg_rating || 3) / 5,
      completion: customer.completion_rate || 0
    };
    
    return (factors.frequency * 0.3 + factors.recency * 0.25 + factors.monetary * 0.25 + 
            factors.rating * 0.1 + factors.completion * 0.1);
  }

  calculateRecencyScore(daysAgo) {
    if (daysAgo <= 30) return 5;
    if (daysAgo <= 90) return 4;
    if (daysAgo <= 180) return 3;
    if (daysAgo <= 365) return 2;
    return 1;
  }

  calculateFrequencyScore(bookings, lifespanDays) {
    const monthlyFreq = lifespanDays > 0 ? (bookings / (lifespanDays / 30.44)) : 0;
    if (monthlyFreq >= 2) return 5;
    if (monthlyFreq >= 1) return 4;
    if (monthlyFreq >= 0.5) return 3;
    if (monthlyFreq >= 0.25) return 2;
    return 1;
  }

  calculateMonetaryScore(totalSpent) {
    if (totalSpent >= 50000) return 5;
    if (totalSpent >= 20000) return 4;
    if (totalSpent >= 10000) return 3;
    if (totalSpent >= 5000) return 2;
    return 1;
  }

  calculateChurnRisk(customer) {
    let risk = 0;
    
    // Recency risk
    if (customer.days_since_last_booking > 365) risk += 0.4;
    else if (customer.days_since_last_booking > 180) risk += 0.2;
    
    // Frequency decline risk
    if (customer.recent_activity === 0) risk += 0.3;
    else if (customer.recent_activity < customer.total_bookings * 0.3) risk += 0.1;
    
    // Satisfaction risk
    if ((customer.avg_rating || 3) < 3) risk += 0.2;
    
    // Cancellation risk
    if (customer.cancellation_rate > 0.2) risk += 0.1;
    
    return Math.min(1, risk);
  }

  identifySegmentCharacteristics(customers) {
    const avgSpent = this.average(customers.map(c => c.total_spent));
    const avgFrequency = this.average(customers.map(c => c.booking_frequency));
    const avgRecency = this.average(customers.map(c => c.days_since_last_booking));
    const avgRating = this.average(customers.map(c => c.avg_rating || 3));
    
    return {
      value_tier: avgSpent > 25000 ? 'high' : avgSpent > 10000 ? 'medium' : 'low',
      engagement_level: avgFrequency > 1 ? 'high' : avgFrequency > 0.5 ? 'medium' : 'low',
      activity_status: avgRecency < 90 ? 'active' : avgRecency < 180 ? 'moderate' : 'inactive',
      satisfaction_level: avgRating > 4 ? 'high' : avgRating > 3.5 ? 'medium' : 'low',
      growth_potential: this.assessGrowthPotential(customers)
    };
  }

  assessGrowthPotential(customers) {
    const recentGrowth = customers.filter(c => c.recent_activity > c.total_bookings * 0.4).length;
    const growthRate = recentGrowth / customers.length;
    
    if (growthRate > 0.6) return 'high';
    if (growthRate > 0.3) return 'medium';
    return 'low';
  }

  getSegmentName(segmentId, characteristics = null) {
    if (characteristics) {
      const { value_tier, engagement_level, activity_status } = characteristics;
      
      if (value_tier === 'high' && engagement_level === 'high' && activity_status === 'active') {
        return 'Champions';
      } else if (value_tier === 'high' && activity_status === 'active') {
        return 'VIP Customers';
      } else if (engagement_level === 'high' && activity_status === 'active') {
        return 'Loyal Customers';
      } else if (value_tier === 'medium' && activity_status === 'active') {
        return 'Potential Loyalists';
      } else if (value_tier === 'high' && activity_status === 'inactive') {
        return 'At Risk VIPs';
      } else if (activity_status === 'inactive') {
        return 'Lost Customers';
      } else if (engagement_level === 'low') {
        return 'Occasional Users';
      } else {
        return 'Regular Customers';
      }
    }
    
    const defaultNames = {
      0: 'Champions',
      1: 'Loyal Customers', 
      2: 'Potential Loyalists',
      3: 'At Risk',
      4: 'Lost Customers'
    };
    return defaultNames[segmentId] || `Segment ${segmentId}`;
  }

  generateSegmentRecommendations(segment) {
    const name = segment.name;
    const metrics = segment.metrics;
    const characteristics = segment.characteristics;
    
    const recommendations = [];
    
    switch (name) {
      case 'Champions':
        recommendations.push(
          'Implement VIP program with exclusive benefits',
          'Request testimonials and referrals',
          'Offer early access to new services',
          'Provide dedicated account management'
        );
        break;
        
      case 'VIP Customers':
        recommendations.push(
          'Maintain high service quality',
          'Offer loyalty rewards and discounts',
          'Cross-sell premium services',
          'Regular satisfaction check-ins'
        );
        break;
        
      case 'At Risk VIPs':
        recommendations.push(
          'Immediate outreach with personalized offers',
          'Conduct satisfaction surveys',
          'Offer service quality guarantees',
          'Assign dedicated success manager'
        );
        break;
        
      case 'Lost Customers':
        recommendations.push(
          'Targeted win-back campaigns',
          'Significant discount offers',
          'Survey for service improvement feedback',
          'Simplified re-booking process'
        );
        break;
        
      default:
        recommendations.push(
          'Regular service reminders',
          'Educational content about services',
          'Seasonal promotions',
          'Feedback collection for improvements'
        );
    }
    
    return recommendations;
  }

  // Utility methods
  euclideanDistance(point1, point2) {
    return Math.sqrt(point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0));
  }

  findElbowPoint(costs) {
    if (costs.length < 3) return 0;
    
    let maxCurvature = 0;
    let elbowIndex = 0;
    
    for (let i = 1; i < costs.length - 1; i++) {
      const curvature = costs[i-1] - 2*costs[i] + costs[i+1];
      if (curvature > maxCurvature) {
        maxCurvature = curvature;
        elbowIndex = i;
      }
    }
    
    return elbowIndex;
  }

  average(arr) {
    return arr.length > 0 ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0;
  }

  median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  calculateCLVDistribution(clvMetrics) {
    const values = clvMetrics.map(c => c.clv).sort((a, b) => a - b);
    return {
      p25: this.percentile(values, 25),
      p50: this.percentile(values, 50),
      p75: this.percentile(values, 75),
      p90: this.percentile(values, 90)
    };
  }

  percentile(arr, p) {
    const index = (p / 100) * (arr.length - 1);
    if (Math.floor(index) === index) {
      return arr[index];
    } else {
      const lower = arr[Math.floor(index)];
      const upper = arr[Math.ceil(index)];
      return lower + (upper - lower) * (index - Math.floor(index));
    }
  }

  // Generate mock segmentation for demo purposes
  generateMockSegmentation() {
    console.log('🎭 Generating mock customer segmentation...');
    
    return {
      0: {
        id: 0,
        name: 'Champions',
        customers: Array.from({length: 25}, (_, i) => ({customer_id: i + 1})),
        metrics: {
          count: 25,
          percentage: '20.0',
          avg_bookings: 12.5,
          avg_spent: 45000,
          avg_order_value: 3600,
          avg_rating: 4.7,
          avg_recency: 25,
          completion_rate: 0.96,
          churn_risk: 0.15,
          avg_clv: 78000
        },
        characteristics: {
          value_tier: 'high',
          engagement_level: 'high',
          activity_status: 'active',
          satisfaction_level: 'high',
          growth_potential: 'medium'
        },
        recommendations: [
          'Implement VIP program with exclusive benefits',
          'Request testimonials and referrals',
          'Offer early access to new services'
        ]
      },
      1: {
        id: 1,
        name: 'Loyal Customers',
        customers: Array.from({length: 35}, (_, i) => ({customer_id: i + 26})),
        metrics: {
          count: 35,
          percentage: '28.0',
          avg_bookings: 8.2,
          avg_spent: 28000,
          avg_order_value: 3400,
          avg_rating: 4.3,
          avg_recency: 45,
          completion_rate: 0.92,
          churn_risk: 0.25,
          avg_clv: 52000
        }
      },
      2: {
        id: 2,
        name: 'At Risk',
        customers: Array.from({length: 20}, (_, i) => ({customer_id: i + 61})),
        metrics: {
          count: 20,
          percentage: '16.0',
          avg_bookings: 3.8,
          avg_spent: 15000,
          avg_order_value: 3900,
          avg_rating: 3.8,
          avg_recency: 185,
          completion_rate: 0.85,
          churn_risk: 0.75,
          avg_clv: 28000
        }
      }
    };
  }
}