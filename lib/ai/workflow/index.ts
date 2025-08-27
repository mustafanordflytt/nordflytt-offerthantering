/**
 * Workflow Automation Export
 * Central export point for all workflow automation components
 */

export { smartJobScheduler } from './smart-job-scheduler';
export { dynamicPricingEngine } from './dynamic-pricing-engine';
export { automatedAssignment } from './automated-assignment';

// Export types
export type {
  SchedulingRequest,
  SchedulingResult,
  Team,
  TeamMember,
  Location,
  Route,
  SchedulingOption
} from './smart-job-scheduler';

export type {
  PricingRequest,
  PricingResult,
  PriceBreakdown,
  PriceAdjustment,
  Discount,
  PricingAlternative
} from './dynamic-pricing-engine';

export type {
  AssignmentRequest,
  AssignmentResult,
  TeamCandidate,
  Factor,
  Notification
} from './automated-assignment';