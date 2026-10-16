import { ScoringConfig } from '../types/config';

/**
 * Canonical default scoring configuration for Evidence Aggregation v1.
 *
 * Source: docs/SCORING_MODEL.md §2, §6-§9, §15; prisma/schema.prisma
 */
export const DEFAULT_SCORING_CONFIG_V1: Readonly<ScoringConfig> = Object.freeze({
  version: 'v1',
  description: 'Evidence Aggregation v1 canonical baseline',

  // EvidenceScore weights
  practicalDepthWeight: 0.6,
  qualityWeight: 0.4,

  // Recency policy: 0.5 - 1.0, begins decay after 12 months
  recencyMin: 0.5,
  recencyMax: 1.0,
  recencyDecayMonths: 12,

  // Practical aggregation weights
  practicalW1: 1.00,
  practicalW2: 0.10,
  practicalW3: 0.05,
  practicalWTail: 0.02,
  practicalSupportThreshold: 0.50,

  // Certificate aggregation
  certCapWithPractical: 5.0,
  certCapAlone: 40.0,
  certW1Standalone: 1.0,
  certW2Standalone: 0.15,
  certWTailStandalone: 0.05,
  certW1WithPractical: 0.05,
  certWTailWithPractical: 0.02,

  // Readiness tier thresholds
  tierNeedsWorkMin: 40,
  tierCloseMin: 70,
  tierReadyMin: 85,
  coreGateMin: 40,

  // Version compatibility
  activeQuestionSetVersion: 'v1',
  compatibleQuestionSetVersions: ['v1'],
});
