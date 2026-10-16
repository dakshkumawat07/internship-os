/**
 * Certificate Aggregation Module (Evidence Aggregation v1).
 *
 * Implements bounded certificate contribution:
 * - Standalone (no practical evidence): S_cert <= 40
 *   S_cert = min(40, C1 + 0.15*C2 + 0.05*Σ(C3...Cq))
 * - With practical evidence: S_cert <= 5
 *   S_cert = min(5, 0.05*C1 + 0.02*Σ(C2...Cq))
 *
 * Reference: docs/SCORING_MODEL.md §8; docs/DECISIONS.md ADR-009
 */

import { ScoringConfig } from '../types/config';
import { ConsolidatedArtifact } from '../types/evidence';
import { CertificateAggregationBreakdown } from '../types/scoring';

export interface CertificateAggregationResult {
  totalCertificateScore: number;
  breakdown: CertificateAggregationBreakdown;
  sortedCertificates: ConsolidatedArtifact[];
}

/**
 * Aggregates learning/certificate artifacts for a skill.
 *
 * @param certificateArtifacts - Consolidated learning artifacts, sorted descending by score
 * @param hasPracticalEvidence - Whether at least one practical artifact exists for this skill
 * @param config - Scoring configuration
 */
export function aggregateCertificates(
  certificateArtifacts: ConsolidatedArtifact[],
  hasPracticalEvidence: boolean,
  config: ScoringConfig
): CertificateAggregationResult {
  if (certificateArtifacts.length === 0) {
    return {
      totalCertificateScore: 0,
      breakdown: {
        mode: hasPracticalEvidence ? 'WITH_PRACTICAL' : 'NONE',
        certificateCount: 0,
        rawCertificateScore: 0,
        appliedCap: hasPracticalEvidence ? config.certCapWithPractical : config.certCapAlone,
        finalCertificateScore: 0,
        sortedCertificateScores: [],
      },
      sortedCertificates: [],
    };
  }

  const scores = certificateArtifacts.map((c) => c.artifactScore);

  if (!hasPracticalEvidence) {
    // 8.1 Standalone certificate mode
    // S_cert = min(40, C1 + 0.15*C2 + 0.05*Σ(C3...Cq))
    const C1 = scores[0];
    const C2 = scores.length >= 2 ? scores[1] : 0;

    let tailSum = 0;
    if (scores.length >= 3) {
      for (let i = 2; i < scores.length; i++) {
        tailSum += scores[i];
      }
    }

    const rawScore = C1 * config.certW1Standalone + C2 * config.certW2Standalone + tailSum * config.certWTailStandalone;
    const finalScore = Math.min(config.certCapAlone, rawScore);

    return {
      totalCertificateScore: finalScore,
      breakdown: {
        mode: 'STANDALONE',
        certificateCount: certificateArtifacts.length,
        rawCertificateScore: rawScore,
        appliedCap: config.certCapAlone,
        finalCertificateScore: finalScore,
        sortedCertificateScores: scores,
      },
      sortedCertificates: certificateArtifacts,
    };
  } else {
    // 8.2 Certificate with practical evidence mode
    // S_cert = min(5, 0.05*C1 + 0.02*Σ(C2...Cq))
    const C1 = scores[0];

    let tailSum = 0;
    if (scores.length >= 2) {
      for (let i = 1; i < scores.length; i++) {
        tailSum += scores[i];
      }
    }

    const rawScore = C1 * config.certW1WithPractical + tailSum * config.certWTailWithPractical;
    const finalScore = Math.min(config.certCapWithPractical, rawScore);

    return {
      totalCertificateScore: finalScore,
      breakdown: {
        mode: 'WITH_PRACTICAL',
        certificateCount: certificateArtifacts.length,
        rawCertificateScore: rawScore,
        appliedCap: config.certCapWithPractical,
        finalCertificateScore: finalScore,
        sortedCertificateScores: scores,
      },
      sortedCertificates: certificateArtifacts,
    };
  }
}
