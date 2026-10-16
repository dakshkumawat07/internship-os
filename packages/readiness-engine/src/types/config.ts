/**
 * Configuration types for the InternshipOS Readiness Engine.
 *
 * Governs formula coefficients, recency policy, aggregation weights,
 * certificate caps, support threshold, and readiness tiers.
 *
 * Reference: docs/SCORING_MODEL.md §2, §6-§9, §15; docs/DOMAIN_MODEL.md §6
 */

export interface ScoringConfig {
  /** Canonical version string (e.g. "v1") */
  version: string;
  description?: string | null;

  // --- EvidenceScore formula coefficients ---
  /** PracticalDepth weight in EvidenceScore (canonical: 0.6) */
  practicalDepthWeight: number;
  /** Quality weight in EvidenceScore (canonical: 0.4) */
  qualityWeight: number;

  // --- Recency policy ---
  /** Minimum RecencyMultiplier (canonical: 0.5) */
  recencyMin: number;
  /** Maximum RecencyMultiplier (canonical: 1.0) */
  recencyMax: number;
  /** Number of months at which recency penalty begins to apply (canonical: 12) */
  recencyDecayMonths: number;

  // --- Practical aggregation weights ---
  /** Multiplier for primary practical artifact P1 (canonical: 1.00) */
  practicalW1: number;
  /** Multiplier for second qualifying practical artifact P2 (canonical: 0.10) */
  practicalW2: number;
  /** Multiplier for third qualifying practical artifact P3 (canonical: 0.05) */
  practicalW3: number;
  /** Multiplier for P4 and every subsequent qualifying artifact (canonical: 0.02) */
  practicalWTail: number;
  /** Support threshold: Pi qualifies only when Pi >= threshold * P1 (canonical: 0.50) */
  practicalSupportThreshold: number;

  // --- Certificate aggregation ---
  /** Maximum SkillScore contribution from certificates when practical evidence exists (canonical: 5) */
  certCapWithPractical: number;
  /** Maximum SkillScore contribution from certificates when no practical evidence exists (canonical: 40) */
  certCapAlone: number;
  /** Multiplier for C1 in standalone certificate mode (canonical: 1.0) */
  certW1Standalone: number;
  /** Multiplier for C2 in standalone certificate mode (canonical: 0.15) */
  certW2Standalone: number;
  /** Multiplier for C3+ tail in standalone certificate mode (canonical: 0.05) */
  certWTailStandalone: number;
  /** Multiplier for C1 when practical evidence exists (canonical: 0.05) */
  certW1WithPractical: number;
  /** Multiplier for C2+ tail when practical evidence exists (canonical: 0.02) */
  certWTailWithPractical: number;

  // --- Readiness tier thresholds ---
  /** Lower bound for NEEDS_WORK tier (canonical: 40) */
  tierNeedsWorkMin: number;
  /** Lower bound for CLOSE tier (canonical: 70) */
  tierCloseMin: number;
  /** Lower bound for READY tier (canonical: 85) */
  tierReadyMin: number;
  /** CORE gate: a CORE skill below this prevents overall tier exceeding NEEDS_WORK (canonical: 40) */
  coreGateMin: number;

  // --- Question set compatibility ---
  /** Currently active questionSetVersion (canonical: "v1") */
  activeQuestionSetVersion?: string;
  /** Set of questionSetVersions compatible without transformation */
  compatibleQuestionSetVersions?: string[];
}
