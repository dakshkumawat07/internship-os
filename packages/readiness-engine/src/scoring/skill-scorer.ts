/**
 * Skill Score Aggregation Module.
 *
 * Implements final SkillScore calculation:
 * SkillScore = min(100, max(0, round(S_practical + S_cert)))
 *
 * Evaluates confidence independently from SkillScore.
 * Generates an auditable, transparent score breakdown and human explanation.
 *
 * Reference: docs/SCORING_MODEL.md §3, §7-§10, §13; docs/DECISIONS.md ADR-011, ADR-013
 */

import { ScoringConfig } from '../types/config';
import { ConfidenceLevel, ScoredEvidenceItem } from '../types/evidence';
import { RoleSkillInput } from '../types/role';
import {
  ConfidenceAssessment,
  SkillAssessmentOutput,
  SkillScoreBreakdown,
} from '../types/scoring';
import { consolidateArtifacts } from './artifact-consolidator';
import { aggregateCertificates } from './certificate-aggregator';
import { aggregatePracticalArtifacts } from './practical-aggregator';

/**
 * Assesses a single skill from its scored evidence items.
 *
 * @param skillId - ID of the skill
 * @param roleSkill - RoleSkill configuration (importance & weight)
 * @param scoredItems - Valid scored evidence items for this skill
 * @param config - Scoring configuration
 */
export function aggregateSkillScore(
  skillId: string,
  roleSkill: RoleSkillInput,
  scoredItems: ScoredEvidenceItem[],
  config: ScoringConfig
): SkillAssessmentOutput {
  // If no evidence items at all:
  if (scoredItems.length === 0) {
    const emptyBreakdown: SkillScoreBreakdown = {
      practical: {
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
      certificate: {
        mode: 'NONE',
        certificateCount: 0,
        rawCertificateScore: 0,
        appliedCap: config.certCapAlone,
        finalCertificateScore: 0,
        sortedCertificateScores: [],
      },
      rawTotalScore: 0,
      roundedScore: 0,
      finalSkillScore: 0,
      explanation: 'No evidence submitted for this skill.',
    };

    const emptyConfidence: ConfidenceAssessment = {
      level: 'NONE',
      reasons: ['No evidence submitted for this skill'],
      qualifyingPracticalCount: 0,
      corroborationCount: 0,
      hasConflictingEvidence: false,
      hasCertificateCorroboration: false,
    };

    return {
      skillId,
      skillName: roleSkill.skillName,
      importance: roleSkill.importance,
      weight: roleSkill.weight,
      skillScore: 0,
      confidence: 'NONE',
      confidenceDetails: emptyConfidence,
      breakdown: emptyBreakdown,
      practicalArtifactCount: 0,
      certificateCount: 0,
      contributingEvidence: [],
    };
  }

  // 1. Consolidate representations by artifactId
  const consolidated = consolidateArtifacts(scoredItems);

  // 2. Separate into practical vs learning artifacts
  const practicalArtifacts = consolidated.filter((a) => a.category === 'PRACTICAL');
  const certificateArtifacts = consolidated.filter((a) => a.category === 'LEARNING');

  const hasPractical = practicalArtifacts.length > 0;

  // 3. Aggregate practical artifacts
  const practicalResult = aggregatePracticalArtifacts(practicalArtifacts, config);

  // 4. Aggregate certificate artifacts
  const certificateResult = aggregateCertificates(certificateArtifacts, hasPractical, config);

  // 5. Final SkillScore: round once at output, clamped 0-100
  const rawTotalScore = practicalResult.totalPracticalScore + certificateResult.totalCertificateScore;
  const roundedScore = Math.round(rawTotalScore);
  const finalSkillScore = Math.min(100, Math.max(0, roundedScore));

  // 6. Check corroboration via Evidence.corroboratesArtifactId
  // (e.g. certificate points to practical project artifact)
  let hasCertificateCorroboration = false;
  const practicalArtifactIds = new Set(practicalArtifacts.map((p) => p.artifactId));
  for (const item of scoredItems) {
    if (item.corroboratesArtifactId && practicalArtifactIds.has(item.corroboratesArtifactId)) {
      hasCertificateCorroboration = true;
      break;
    }
  }

  // 7. Check representation corroboration count & conflicts
  let totalCorroborationCount = 0;
  let hasConflictingEvidence = false;
  for (const art of consolidated) {
    totalCorroborationCount += art.corroborationCount;
    if (art.hasConflictingEvidence) {
      hasConflictingEvidence = true;
    }
  }
  if (hasCertificateCorroboration) {
    totalCorroborationCount += 1;
  }

  // 8. Confidence Assessment (separate axis from SkillScore)
  const confidenceAssessment = evaluateConfidence({
    hasPractical,
    qualifyingPracticalCount: practicalResult.breakdown.qualifyingArtifactCount,
    totalPracticalCount: practicalArtifacts.length,
    certificateCount: certificateArtifacts.length,
    corroborationCount: totalCorroborationCount,
    hasConflictingEvidence,
    hasCertificateCorroboration,
  });

  // 9. Generate Human Explanation (SCORING_MODEL.md §13)
  const explanation = generateExplanation({
    finalSkillScore,
    practicalResult,
    certificateResult,
    hasPractical,
    hasConflictingEvidence,
    totalCorroborationCount,
  });

  const breakdown: SkillScoreBreakdown = {
    practical: practicalResult.breakdown,
    certificate: certificateResult.breakdown,
    rawTotalScore,
    roundedScore,
    finalSkillScore,
    explanation,
  };

  return {
    skillId,
    skillName: roleSkill.skillName,
    importance: roleSkill.importance,
    weight: roleSkill.weight,
    skillScore: finalSkillScore,
    confidence: confidenceAssessment.level,
    confidenceDetails: confidenceAssessment,
    breakdown,
    practicalArtifactCount: practicalArtifacts.length,
    certificateCount: certificateArtifacts.length,
    contributingEvidence: scoredItems,
  };
}

/**
 * Evaluates verification confidence level based on corroboration and artifact count.
 */
function evaluateConfidence(params: {
  hasPractical: boolean;
  qualifyingPracticalCount: number;
  totalPracticalCount: number;
  certificateCount: number;
  corroborationCount: number;
  hasConflictingEvidence: boolean;
  hasCertificateCorroboration: boolean;
}): ConfidenceAssessment {
  const reasons: string[] = [];

  if (!params.hasPractical) {
    // Certificate-only
    if (params.certificateCount === 0) {
      reasons.push('No evidence submitted');
      return {
        level: 'NONE',
        reasons,
        qualifyingPracticalCount: 0,
        corroborationCount: 0,
        hasConflictingEvidence: false,
        hasCertificateCorroboration: false,
      };
    }
    if (params.certificateCount === 1) {
      reasons.push('Single certificate/coursework representation; no practical corroboration');
      return {
        level: 'LOW',
        reasons,
        qualifyingPracticalCount: 0,
        corroborationCount: params.corroborationCount,
        hasConflictingEvidence: params.hasConflictingEvidence,
        hasCertificateCorroboration: false,
      };
    }
    reasons.push('Multiple certificates demonstrate learning exposure; no practical demonstration');
    return {
      level: 'MEDIUM',
      reasons,
      qualifyingPracticalCount: 0,
      corroborationCount: params.corroborationCount,
      hasConflictingEvidence: params.hasConflictingEvidence,
      hasCertificateCorroboration: false,
    };
  }

  // Practical evidence exists
  if (params.hasConflictingEvidence) {
    reasons.push('Conflicting representations detected for the same artifact; confidence restricted');
  }
  if (params.hasCertificateCorroboration) {
    reasons.push('Certificate/coursework corroborates practical implementation');
  }
  if (params.corroborationCount > 0) {
    reasons.push(`${params.corroborationCount} corroborating representation(s) verified`);
  }

  let level: ConfidenceLevel = 'LOW';

  if (params.qualifyingPracticalCount >= 3 && !params.hasConflictingEvidence) {
    level = 'HIGH';
    reasons.push('Three or more independent qualifying practical artifacts demonstrate consistent depth');
  } else if (
    params.qualifyingPracticalCount >= 2 &&
    params.corroborationCount >= 1 &&
    !params.hasConflictingEvidence
  ) {
    level = 'HIGH';
    reasons.push('Multiple independent qualifying practical artifacts with verified corroboration');
  } else if (params.qualifyingPracticalCount >= 2) {
    level = 'MEDIUM';
    reasons.push('Two independent qualifying practical artifacts demonstrate repeatability');
  } else if (params.corroborationCount >= 1 && !params.hasConflictingEvidence) {
    level = 'MEDIUM';
    reasons.push('Single practical artifact supported by corroborating representations');
  } else {
    level = 'LOW';
    reasons.push('Single practical artifact with no independent corroboration');
  }

  return {
    level,
    reasons,
    qualifyingPracticalCount: params.qualifyingPracticalCount,
    corroborationCount: params.corroborationCount,
    hasConflictingEvidence: params.hasConflictingEvidence,
    hasCertificateCorroboration: params.hasCertificateCorroboration,
  };
}

/**
 * Builds a clear, transparent human-readable explanation of the score.
 */
function generateExplanation(params: {
  finalSkillScore: number;
  practicalResult: ReturnType<typeof aggregatePracticalArtifacts>;
  certificateResult: ReturnType<typeof aggregateCertificates>;
  hasPractical: boolean;
  hasConflictingEvidence: boolean;
  totalCorroborationCount: number;
}): string {
  const parts: string[] = [];

  if (params.hasPractical) {
    const pb = params.practicalResult.breakdown;
    parts.push(`${pb.primaryContribution} primary practical evidence`);

    const supporting = pb.secondaryContribution + pb.tertiaryContribution + pb.tailContribution;
    if (supporting > 0) {
      parts.push(`+${supporting.toFixed(1).replace(/\.0$/, '')} meaningful supporting evidence`);
    }

    if (params.certificateResult.totalCertificateScore > 0) {
      parts.push(`+${params.certificateResult.totalCertificateScore.toFixed(1).replace(/\.0$/, '')} certificate contribution`);
    }

    if (pb.nonQualifyingArtifactCount > 0) {
      parts.push(`(${pb.nonQualifyingArtifactCount} weak artifact(s) fell below 50% support threshold and contributed 0)`);
    }
  } else {
    // Certificate-only
    const cb = params.certificateResult.breakdown;
    parts.push(`${cb.finalCertificateScore} from learning/certificate evidence (capped at ${cb.appliedCap})`);
  }

  let result = `SkillScore ${params.finalSkillScore} = ${parts.join(' ')}.`;

  if (params.totalCorroborationCount > 0 && !params.hasConflictingEvidence) {
    result += ' Corroborating representation(s) added verification confidence without duplicating technical score.';
  } else if (params.hasConflictingEvidence) {
    result += ' Conflicting representations detected; score reflects peak valid demonstration while confidence notes discrepancy.';
  }

  return result;
}
