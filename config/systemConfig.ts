// =============================================================================
// NORDFLYTT AI SYSTEM - UNIFIED CONFIGURATION
// Master configuration for all 5 phases integrated system
// =============================================================================

export interface SystemConfig {
  database: DatabaseConfig;
  features: FeatureFlags;
  phases: PhaseConfigs;
  monitoring: MonitoringConfig;
  security: SecurityConfig;
  optimization: OptimizationConfig;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  poolSize: number;
  connectionTimeout: number;
}

export interface FeatureFlags {
  PHASE_1_CLUSTERING: boolean;
  PHASE_2_ROUTING: boolean;
  PHASE_3_TEAMS: boolean;
  PHASE_4_ANALYTICS: boolean;
  PHASE_5_AUTONOMOUS: boolean;
  REAL_TIME_OPTIMIZATION: boolean;
  DYNAMIC_PRICING: boolean;
  WEATHER_INTEGRATION: boolean;
  TRAFFIC_OPTIMIZATION: boolean;
  MACHINE_LEARNING: boolean;
  ADVANCED_ANALYTICS: boolean;
  AUTONOMOUS_EXECUTION: boolean;
  HUMAN_REVIEW_QUEUE: boolean;
  PERFORMANCE_MONITORING: boolean;
  AUDIT_LOGGING: boolean;
}

export interface PhaseConfigs {
  phase1: Phase1Config;
  phase2: Phase2Config;
  phase3: Phase3Config;
  phase4: Phase4Config;
  phase5: Phase5Config;
}

export interface Phase1Config {
  enabled: boolean;
  maxClustersPerDay: number;
  weatherIntegration: boolean;
  trafficFactorWeight: number;
  efficiencyThreshold: number;
  optimizationInterval: number; // minutes
}

export interface Phase2Config {
  enabled: boolean;
  maxVehiclesPerRoute: number;
  fuelEfficiencyWeight: number;
  co2ReductionTarget: number; // percentage
  trafficUpdateInterval: number; // minutes
  routeRecalculationThreshold: number;
}

export interface Phase3Config {
  enabled: boolean;
  maxTeamSize: number;
  minTeamSize: number;
  skillBalanceWeight: number;
  experienceWeight: number;
  workloadBalanceThreshold: number;
}

export interface Phase4Config {
  enabled: boolean;
  forecastHorizonDays: number;
  modelRetrainingInterval: number; // hours
  confidenceThreshold: number;
  predictionAccuracyTarget: number;
  dynamicPricingEnabled: boolean;
}

export interface Phase5Config {
  enabled: boolean;
  autonomyLevel: number; // 0-1
  confidenceThreshold: number;
  humanReviewThreshold: number;
  maxAutonomousDecisionsPerHour: number;
  executionDelaySeconds: number;
  rollbackEnabled: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsInterval: number; // seconds
  alertThresholds: AlertThresholds;
  dashboardUpdateInterval: number; // seconds
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  retentionDays: number;
}

export interface AlertThresholds {
  systemEfficiencyMin: number;
  errorRateMax: number;
  responseTimeMax: number; // milliseconds
  autonomyRateMin: number;
  confidenceScoreMin: number;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpirationHours: number;
  encryptionKey: string;
  rateLimit: RateLimitConfig;
  auditLogging: boolean;
  dataEncryption: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
}

export interface OptimizationConfig {
  masterOptimizationEnabled: boolean;
  crossPhaseOptimization: boolean;
  realTimeUpdates: boolean;
  batchProcessingEnabled: boolean;
  parallelProcessing: boolean;
  maxConcurrentOptimizations: number;
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

export const DEFAULT_CONFIG: SystemConfig = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'nordflytt_ai',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '20'),
    connectionTimeout: parseInt(process.env.DB_TIMEOUT || '30000')
  },

  features: {
    PHASE_1_CLUSTERING: process.env.ENABLE_PHASE_1 === 'true',
    PHASE_2_ROUTING: process.env.ENABLE_PHASE_2 === 'true',
    PHASE_3_TEAMS: process.env.ENABLE_PHASE_3 === 'true',
    PHASE_4_ANALYTICS: process.env.ENABLE_PHASE_4 === 'true',
    PHASE_5_AUTONOMOUS: process.env.ENABLE_PHASE_5 === 'true',
    REAL_TIME_OPTIMIZATION: process.env.ENABLE_REAL_TIME === 'true',
    DYNAMIC_PRICING: process.env.ENABLE_DYNAMIC_PRICING === 'true',
    WEATHER_INTEGRATION: process.env.ENABLE_WEATHER === 'true',
    TRAFFIC_OPTIMIZATION: process.env.ENABLE_TRAFFIC === 'true',
    MACHINE_LEARNING: process.env.ENABLE_ML === 'true',
    ADVANCED_ANALYTICS: process.env.ENABLE_ADVANCED_ANALYTICS === 'true',
    AUTONOMOUS_EXECUTION: process.env.ENABLE_AUTONOMOUS_EXECUTION === 'true',
    HUMAN_REVIEW_QUEUE: process.env.ENABLE_HUMAN_REVIEW === 'true',
    PERFORMANCE_MONITORING: process.env.ENABLE_MONITORING !== 'false',
    AUDIT_LOGGING: process.env.ENABLE_AUDIT_LOGGING !== 'false'
  },

  phases: {
    phase1: {
      enabled: process.env.ENABLE_PHASE_1 === 'true',
      maxClustersPerDay: parseInt(process.env.PHASE1_MAX_CLUSTERS || '20'),
      weatherIntegration: process.env.PHASE1_WEATHER === 'true',
      trafficFactorWeight: parseFloat(process.env.PHASE1_TRAFFIC_WEIGHT || '0.3'),
      efficiencyThreshold: parseFloat(process.env.PHASE1_EFFICIENCY_THRESHOLD || '0.85'),
      optimizationInterval: parseInt(process.env.PHASE1_OPTIMIZATION_INTERVAL || '30')
    },

    phase2: {
      enabled: process.env.ENABLE_PHASE_2 === 'true',
      maxVehiclesPerRoute: parseInt(process.env.PHASE2_MAX_VEHICLES || '8'),
      fuelEfficiencyWeight: parseFloat(process.env.PHASE2_FUEL_WEIGHT || '0.4'),
      co2ReductionTarget: parseFloat(process.env.PHASE2_CO2_TARGET || '25'),
      trafficUpdateInterval: parseInt(process.env.PHASE2_TRAFFIC_INTERVAL || '15'),
      routeRecalculationThreshold: parseFloat(process.env.PHASE2_RECALC_THRESHOLD || '0.15')
    },

    phase3: {
      enabled: process.env.ENABLE_PHASE_3 === 'true',
      maxTeamSize: parseInt(process.env.PHASE3_MAX_TEAM_SIZE || '4'),
      minTeamSize: parseInt(process.env.PHASE3_MIN_TEAM_SIZE || '2'),
      skillBalanceWeight: parseFloat(process.env.PHASE3_SKILL_WEIGHT || '0.4'),
      experienceWeight: parseFloat(process.env.PHASE3_EXPERIENCE_WEIGHT || '0.3'),
      workloadBalanceThreshold: parseFloat(process.env.PHASE3_WORKLOAD_THRESHOLD || '0.15')
    },

    phase4: {
      enabled: process.env.ENABLE_PHASE_4 === 'true',
      forecastHorizonDays: parseInt(process.env.PHASE4_FORECAST_DAYS || '30'),
      modelRetrainingInterval: parseInt(process.env.PHASE4_RETRAIN_HOURS || '168'), // weekly
      confidenceThreshold: parseFloat(process.env.PHASE4_CONFIDENCE_THRESHOLD || '0.85'),
      predictionAccuracyTarget: parseFloat(process.env.PHASE4_ACCURACY_TARGET || '0.90'),
      dynamicPricingEnabled: process.env.PHASE4_DYNAMIC_PRICING === 'true'
    },

    phase5: {
      enabled: process.env.ENABLE_PHASE_5 === 'true',
      autonomyLevel: parseFloat(process.env.PHASE5_AUTONOMY_LEVEL || '0.99'),
      confidenceThreshold: parseFloat(process.env.PHASE5_CONFIDENCE_THRESHOLD || '0.90'),
      humanReviewThreshold: parseFloat(process.env.PHASE5_HUMAN_REVIEW_THRESHOLD || '0.75'),
      maxAutonomousDecisionsPerHour: parseInt(process.env.PHASE5_MAX_DECISIONS_HOUR || '100'),
      executionDelaySeconds: parseInt(process.env.PHASE5_EXECUTION_DELAY || '5'),
      rollbackEnabled: process.env.PHASE5_ROLLBACK_ENABLED !== 'false'
    }
  },

  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    metricsInterval: parseInt(process.env.METRICS_INTERVAL || '60'),
    alertThresholds: {
      systemEfficiencyMin: parseFloat(process.env.ALERT_EFFICIENCY_MIN || '0.80'),
      errorRateMax: parseFloat(process.env.ALERT_ERROR_RATE_MAX || '0.05'),
      responseTimeMax: parseInt(process.env.ALERT_RESPONSE_TIME_MAX || '5000'),
      autonomyRateMin: parseFloat(process.env.ALERT_AUTONOMY_MIN || '0.85'),
      confidenceScoreMin: parseFloat(process.env.ALERT_CONFIDENCE_MIN || '0.70')
    },
    dashboardUpdateInterval: parseInt(process.env.DASHBOARD_UPDATE_INTERVAL || '30'),
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '30')
  },

  security: {
    jwtSecret: process.env.JWT_SECRET || 'nordflytt-ai-system-secret-key',
    jwtExpirationHours: parseInt(process.env.JWT_EXPIRATION_HOURS || '24'),
    encryptionKey: process.env.ENCRYPTION_KEY || 'nordflytt-encryption-key',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true'
    },
    auditLogging: process.env.AUDIT_LOGGING !== 'false',
    dataEncryption: process.env.DATA_ENCRYPTION === 'true'
  },

  optimization: {
    masterOptimizationEnabled: process.env.MASTER_OPTIMIZATION === 'true',
    crossPhaseOptimization: process.env.CROSS_PHASE_OPTIMIZATION === 'true',
    realTimeUpdates: process.env.REAL_TIME_UPDATES === 'true',
    batchProcessingEnabled: process.env.BATCH_PROCESSING === 'true',
    parallelProcessing: process.env.PARALLEL_PROCESSING === 'true',
    maxConcurrentOptimizations: parseInt(process.env.MAX_CONCURRENT_OPTIMIZATIONS || '5')
  }
};

// =============================================================================
// CONFIGURATION UTILITIES
// =============================================================================

export class ConfigManager {
  private config: SystemConfig;
  private featuresCache: Map<string, boolean> = new Map();
  private lastFeatureUpdate: number = 0;
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor(config: SystemConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Get the current system configuration
   */
  getConfig(): SystemConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SystemConfig>): void {
    this.config = { ...this.config, ...updates };
    this.clearFeatureCache();
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(featureName: keyof FeatureFlags): boolean {
    const now = Date.now();
    if (now - this.lastFeatureUpdate > this.CACHE_TTL) {
      this.clearFeatureCache();
    }

    if (this.featuresCache.has(featureName)) {
      return this.featuresCache.get(featureName)!;
    }

    const enabled = this.config.features[featureName];
    this.featuresCache.set(featureName, enabled);
    return enabled;
  }

  /**
   * Check if a phase is enabled
   */
  isPhaseEnabled(phase: 1 | 2 | 3 | 4 | 5): boolean {
    switch (phase) {
      case 1: return this.isFeatureEnabled('PHASE_1_CLUSTERING');
      case 2: return this.isFeatureEnabled('PHASE_2_ROUTING');
      case 3: return this.isFeatureEnabled('PHASE_3_TEAMS');
      case 4: return this.isFeatureEnabled('PHASE_4_ANALYTICS');
      case 5: return this.isFeatureEnabled('PHASE_5_AUTONOMOUS');
      default: return false;
    }
  }

  /**
   * Get phase configuration
   */
  getPhaseConfig<T extends keyof PhaseConfigs>(phase: T): PhaseConfigs[T] {
    return this.config.phases[phase];
  }

  /**
   * Get monitoring configuration
   */
  getMonitoringConfig(): MonitoringConfig {
    return this.config.monitoring;
  }

  /**
   * Get security configuration
   */
  getSecurityConfig(): SecurityConfig {
    return this.config.security;
  }

  /**
   * Get optimization configuration
   */
  getOptimizationConfig(): OptimizationConfig {
    return this.config.optimization;
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate phase dependencies
    if (this.isFeatureEnabled('PHASE_2_ROUTING') && !this.isFeatureEnabled('PHASE_1_CLUSTERING')) {
      errors.push('Phase 2 requires Phase 1 to be enabled');
    }
    if (this.isFeatureEnabled('PHASE_3_TEAMS') && !this.isFeatureEnabled('PHASE_2_ROUTING')) {
      errors.push('Phase 3 requires Phase 2 to be enabled');
    }
    if (this.isFeatureEnabled('PHASE_4_ANALYTICS') && !this.isFeatureEnabled('PHASE_3_TEAMS')) {
      errors.push('Phase 4 requires Phase 3 to be enabled');
    }
    if (this.isFeatureEnabled('PHASE_5_AUTONOMOUS') && !this.isFeatureEnabled('PHASE_4_ANALYTICS')) {
      errors.push('Phase 5 requires Phase 4 to be enabled');
    }

    // Validate thresholds
    if (this.config.phases.phase5.autonomyLevel > 1 || this.config.phases.phase5.autonomyLevel < 0) {
      errors.push('Phase 5 autonomy level must be between 0 and 1');
    }

    if (this.config.phases.phase5.confidenceThreshold < this.config.phases.phase5.humanReviewThreshold) {
      errors.push('Phase 5 confidence threshold must be higher than human review threshold');
    }

    // Validate database configuration
    if (!this.config.database.host || !this.config.database.database) {
      errors.push('Database host and database name are required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get system status summary
   */
  getSystemStatus(): SystemStatus {
    const enabledPhases = [];
    for (let i = 1; i <= 5; i++) {
      if (this.isPhaseEnabled(i as 1 | 2 | 3 | 4 | 5)) {
        enabledPhases.push(i);
      }
    }

    return {
      version: '1.0.0',
      status: 'operational',
      enabledPhases,
      totalFeatures: Object.keys(this.config.features).length,
      enabledFeatures: Object.values(this.config.features).filter(Boolean).length,
      lastUpdated: new Date().toISOString(),
      validation: this.validateConfig()
    };
  }

  private clearFeatureCache(): void {
    this.featuresCache.clear();
    this.lastFeatureUpdate = Date.now();
  }
}

export interface SystemStatus {
  version: string;
  status: 'operational' | 'degraded' | 'maintenance' | 'error';
  enabledPhases: number[];
  totalFeatures: number;
  enabledFeatures: number;
  lastUpdated: string;
  validation: { valid: boolean; errors: string[] };
}

// =============================================================================
// GLOBAL CONFIGURATION INSTANCE
// =============================================================================

export const systemConfig = new ConfigManager(DEFAULT_CONFIG);

// =============================================================================
// ENVIRONMENT-SPECIFIC CONFIGURATIONS
// =============================================================================

export const DEVELOPMENT_CONFIG: Partial<SystemConfig> = {
  features: {
    ...DEFAULT_CONFIG.features,
    PHASE_1_CLUSTERING: true,
    PHASE_2_ROUTING: true,
    PHASE_3_TEAMS: false,
    PHASE_4_ANALYTICS: false,
    PHASE_5_AUTONOMOUS: false,
    REAL_TIME_OPTIMIZATION: true,
    WEATHER_INTEGRATION: true,
    TRAFFIC_OPTIMIZATION: true,
    PERFORMANCE_MONITORING: true,
    AUDIT_LOGGING: true
  },
  monitoring: {
    ...DEFAULT_CONFIG.monitoring,
    logLevel: 'debug',
    metricsInterval: 30
  }
};

export const PRODUCTION_CONFIG: Partial<SystemConfig> = {
  features: {
    ...DEFAULT_CONFIG.features,
    PHASE_1_CLUSTERING: true,
    PHASE_2_ROUTING: true,
    PHASE_3_TEAMS: true,
    PHASE_4_ANALYTICS: true,
    PHASE_5_AUTONOMOUS: true,
    REAL_TIME_OPTIMIZATION: true,
    DYNAMIC_PRICING: true,
    WEATHER_INTEGRATION: true,
    TRAFFIC_OPTIMIZATION: true,
    MACHINE_LEARNING: true,
    ADVANCED_ANALYTICS: true,
    AUTONOMOUS_EXECUTION: true,
    HUMAN_REVIEW_QUEUE: true,
    PERFORMANCE_MONITORING: true,
    AUDIT_LOGGING: true
  },
  monitoring: {
    ...DEFAULT_CONFIG.monitoring,
    logLevel: 'info',
    metricsInterval: 60
  },
  phases: {
    ...DEFAULT_CONFIG.phases,
    phase5: {
      ...DEFAULT_CONFIG.phases.phase5,
      autonomyLevel: 0.99,
      confidenceThreshold: 0.95,
      humanReviewThreshold: 0.80
    }
  }
};

export const TESTING_CONFIG: Partial<SystemConfig> = {
  features: {
    ...DEFAULT_CONFIG.features,
    PHASE_1_CLUSTERING: true,
    PHASE_2_ROUTING: true,
    PHASE_3_TEAMS: true,
    PHASE_4_ANALYTICS: true,
    PHASE_5_AUTONOMOUS: true,
    AUTONOMOUS_EXECUTION: false, // Don't execute in tests
    PERFORMANCE_MONITORING: false,
    AUDIT_LOGGING: false
  },
  phases: {
    ...DEFAULT_CONFIG.phases,
    phase5: {
      ...DEFAULT_CONFIG.phases.phase5,
      autonomyLevel: 0.50, // Lower autonomy for testing
      executionDelaySeconds: 0
    }
  }
};

export function getEnvironmentConfig(): Partial<SystemConfig> {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return PRODUCTION_CONFIG;
    case 'test':
      return TESTING_CONFIG;
    case 'development':
    default:
      return DEVELOPMENT_CONFIG;
  }
}