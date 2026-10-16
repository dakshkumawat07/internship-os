/**
 * Role Readiness Calculation Module.
 *
 * Implements role-level weighted readiness:
 * WeightedAverage = Σ(SkillScore × Weight) / Σ(Weight)
 *
 * Enforces the CORE Gate:
 * If any CORE skill has SkillScore < 40:
 * - overall readiness tier cannot exceed NEEDS_WORK
 * - triggering CORE skills are explicitly named
 *
 * Computes Readiness Tier:
 * - 0–39: EARLY_STAGE
 * - 40–69: NEEDS_WORK
 * - 70–84: CLOSE
 * - 85–100: READY
 *
 * Reference: docs/SCORING_MODEL.md §2.2-§2.5; docs/ARCHITECTURE.md §5
 */

import { ScoringConfig } from '../types/config';
import { ReadinessTier } from '../types/evidence';
import { RoleSkillInput } from '../types/role';
import { OverallReadinessOutput, SkillAssessmentOutput } from '../types/scoring';
import { ValidationError } from '../types/errors';
import { validateRoleSkill } from '../validation/validator';

/**
 * Determines the readiness tier from a numeric overall score.
 */
export function determineReadinessTier(score: number, config: ScoringConfig): ReadinessTier {
  if (score >= config.tierReadyMin) {
    return 'READY';
  }
  if (score >= config.tierCloseMin) {
    return 'CLOSE';
  }
  if (score >= config.tierNeedsWorkMin) {
    return 'NEEDS_WORK';
  }
  return 'EARLY_STAGE';
}

/**
 * Applies the CORE gate override to a readiness tier.
 * If the CORE gate is triggered, the tier cannot exceed NEEDS_WORK.
 */
export function applyCoreOverride(rawTier: ReadinessTier, coreGateTriggered: boolean): ReadinessTier {
  if (!coreGateTriggered) {
    return rawTier;
  }
  if (rawTier === 'READY' || rawTier === 'CLOSE') {
    return 'NEEDS_WORK';
  }
  return rawTier;
}

/**
 * Computes overall role readiness from assessed skill outputs.
 *
 * @param skillAssessments - Assessed skills
 * @param roleSkills - Target role skills with weights and importance
 * @param config - Scoring configuration
 * @param evaluationDate - Explicit evaluation date
 * @param frameworkVersion - Role-skill framework version (e.g. 'mvp-1')
 */
export function computeRoleReadiness(
  skillAssessments: SkillAssessmentOutput[],
  roleSkills: RoleSkillInput[],
  config: ScoringConfig,
  evaluationDate: Date | string,
  frameworkVersion: string
): OverallReadinessOutput {
  if (!roleSkills || roleSkills.length === 0) {
    throw new ValidationError('RoleSkills list cannot be empty', 'roleSkills');
  }

  // Validate all role skills
  for (const rs of roleSkills) {
    validateRoleSkill(rs);
  }

  // Create lookup for skill assessments
  const assessmentMap = new Map<string, SkillAssessmentOutput>();
  for (const sa of skillAssessments) {
    assessmentMap.set(sa.skillId, sa);
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;
  const coreGateSkillIds: string[] = [];

  for (const rs of roleSkills) {
    const assessment = assessmentMap.get(rs.skillId);
    const score = assessment ? assessment.skillScore : 0;

    totalWeightedScore += score * rs.weight;
    totalWeight += rs.weight;

    // CORE gate check: ANY CORE skill < config.coreGateMin (40)
    if (rs.importance === 'CORE' && score < config.coreGateMin) {
      coreGateSkillIds.push(rs.skillId);
    }
  }

  if (totalWeight <= 0) {
    throw new ValidationError('Total role weight must be greater than zero', 'totalWeight', totalWeight);
  }

  const overallScore = totalWeightedScore / totalWeight;
  const rawTier = determineReadinessTier(overallScore, config);
  const coreGateTriggered = coreGateSkillIds.length > 0;
  const readinessTier = applyCoreOverride(rawTier, coreGateTriggered);

  const evalDateStr = evaluationDate instanceof Date ? evaluationDate.toISOString() : new Date(evaluationDate).toISOString();

  return {
    overallScore,
    readinessTier,
    rawTierBeforeCoreGate: rawTier,
    coreGateTriggered,
    coreGateSkillIds,
    totalSkillsAssessed: roleSkills.length,
    totalWeight,
    scoringConfigVersion: config.version,
    frameworkVersion,
    evaluationDate: evalDateStr,
  };
}
