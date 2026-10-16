/**
 * Practical Aggregation Module (Evidence Aggregation v1).
 *
 * Aggregates consolidated practical artifacts using a strongest-first model
 * with diminishing returns and a 50% support threshold:
 *
 * P1 is the peak demonstrated practical score.
 * A supporting artifact Pi qualifies only when: Pi >= 0.50 * P1.
 *
 * Formula:
 * S_practical = P1 + 0.10*Q1 + 0.05*Q2 + 0.02*Σ(Q3...Qm)
 *
 * Reference: docs/SCORING_MODEL.md §7; docs/DECISIONS.md ADR-005, ADR-006, ADR-007
 */

import { ScoringConfig } from '../types/config';
import { ConsolidatedArtifact } from '../types/evidence';
import { PracticalAggregationBreakdown } from '../types/scoring';

export interface PracticalAggregationResult {
  totalPracticalScore: number;
  breakdown: PracticalAggregationBreakdown;
  qualifyingArtifacts: ConsolidatedArtifact[];
  nonQualifyingArtifacts: ConsolidatedArtifact[];
  peakArtifact: ConsolidatedArtifact | null;
}

/**
 * Aggregates practical artifacts for a skill according to the canonical v1 model.
 *
 * @param practicalArtifacts - Distinct practical artifacts, sorted descending by score
 * @param config - Scoring configuration
 */
export function aggregatePracticalArtifacts(
  practicalArtifacts: ConsolidatedArtifact[],
  config: ScoringConfig
): PracticalAggregationResult {
  if (practicalArtifacts.length === 0) {
    return {
      totalPracticalScore: 0,
      breakdown: {
        peakPracticalScore: 0,
        qualifyingArtifactCount: 0,
        nonQualifyingArtifactCount: 0,
        totalPracticalArtifactCount: 0,
        supportThreshold: 0,
        primaryContribution: 0,
        secondaryContribution: 0,
        tertiaryContribution: 0,
        tailContribution: 0,
        totalPracticalScore: 0,
        qualifyingScores: [],
        nonQualifyingScores: [],
      },
      qualifyingArtifacts: [],
      nonQualifyingArtifacts: [],
      peakArtifact: null,
    };
  }

  // Peak artifact P1
  const peakArtifact = practicalArtifacts[0];
  const P1 = peakArtifact.artifactScore;
  const supportThreshold = P1 * config.practicalSupportThreshold;

  // Separate supporting artifacts into qualifying (Q) and non-qualifying
  const qualifyingSupporting: ConsolidatedArtifact[] = [];
  const nonQualifying: ConsolidatedArtifact[] = [];

  for (let i = 1; i < practicalArtifacts.length; i++) {
    const art = practicalArtifacts[i];
    if (art.artifactScore >= supportThreshold) {
      qualifyingSupporting.push(art);
    } else {
      nonQualifying.push(art);
    }
  }

  // All qualifying artifacts = P1 + Q
  const qualifyingArtifacts = [peakArtifact, ...qualifyingSupporting];

  // Calculate contributions:
  // Primary: P1 * practicalW1 (1.00)
  const primaryContribution = P1 * config.practicalW1;

  // Secondary: Q1 * practicalW2 (0.10)
  const Q1 = qualifyingSupporting[0]?.artifactScore ?? 0;
  const secondaryContribution = qualifyingSupporting.length >= 1 ? Q1 * config.practicalW2 : 0;

  // Tertiary: Q2 * practicalW3 (0.05)
  const Q2 = qualifyingSupporting[1]?.artifactScore ?? 0;
  const tertiaryContribution = qualifyingSupporting.length >= 2 ? Q2 * config.practicalW3 : 0;

  // Tail: Q3+ * practicalWTail (0.02)
  let tailSum = 0;
  if (qualifyingSupporting.length >= 3) {
    for (let i = 2; i < qualifyingSupporting.length; i++) {
      tailSum += qualifyingSupporting[i].artifactScore;
    }
  }
  const tailContribution = tailSum * config.practicalWTail;

  const totalPracticalScore = primaryContribution + secondaryContribution + tertiaryContribution + tailContribution;

  return {
    totalPracticalScore,
    breakdown: {
      peakPracticalScore: P1,
      qualifyingArtifactCount: qualifyingArtifacts.length,
      nonQualifyingArtifactCount: nonQualifying.length,
      totalPracticalArtifactCount: practicalArtifacts.length,
      supportThreshold,
      primaryContribution,
      secondaryContribution,
      tertiaryContribution,
      tailContribution,
      totalPracticalScore,
      qualifyingScores: qualifyingArtifacts.map((a) => a.artifactScore),
      nonQualifyingScores: nonQualifying.map((a) => a.artifactScore),
    },
    qualifyingArtifacts,
    nonQualifyingArtifacts: nonQualifying,
    peakArtifact,
  };
}
