/**
 * Evidence Scoring Module.
 *
 * Implements the locked EvidenceScore formula:
 * EvidenceScore = (0.6 × PracticalDepth + 0.4 × Quality) × RecencyMultiplier
 *
 * Constraints:
 * - PracticalDepth: 0–100
 * - Quality: 0–100
 * - RecencyMultiplier: 0.5–1.0
 * - EvidenceScore: 0–100
 *
 * Reference: docs/SCORING_MODEL.md §2.1; prompt locked evidence score rules
 */

import { ScoringConfig } from '../types/config';
import { ScoredEvidenceItem, SkillEvidenceInput } from '../types/evidence';
import { ValidationError } from '../types/errors';
import { validateDate, validateRecencyMultiplier, validateScoreRange } from '../validation/validator';
import { calculateRecencyMultiplier } from './recency';

/**
 * Computes the individual EvidenceScore for an evidence item.
 *
 * @param item - Skill-scoped evidence item
 * @param config - Scoring configuration
 * @param evaluationDate - Explicit evaluation date
 */
export function scoreEvidence(
  item: SkillEvidenceInput,
  config: ScoringConfig,
  evaluationDate: Date | string
): ScoredEvidenceItem {
  const actDate = validateDate(item.activityDate, 'activityDate');

  // Compute or validate recency multiplier
  let recencyMultiplier: number;
  if (item.recencyMultiplier !== undefined && item.recencyMultiplier !== null) {
    recencyMultiplier = validateRecencyMultiplier(item.recencyMultiplier, config);
  } else {
    recencyMultiplier = calculateRecencyMultiplier(actDate, evaluationDate, config);
  }

  let practicalDepth: number | null = null;
  let quality: number | null = null;
  let evidenceScore: number;

  if (item.category === 'PRACTICAL') {
    if (item.practicalDepth === undefined || item.practicalDepth === null) {
      throw new ValidationError(`Practical evidence ${item.evidenceId} must provide practicalDepth`, 'practicalDepth');
    }
    if (item.quality === undefined || item.quality === null) {
      throw new ValidationError(`Practical evidence ${item.evidenceId} must provide quality`, 'quality');
    }

    practicalDepth = validateScoreRange(item.practicalDepth, 'practicalDepth');
    quality = validateScoreRange(item.quality, 'quality');

    const baseScore = config.practicalDepthWeight * practicalDepth + config.qualityWeight * quality;
    evidenceScore = baseScore * recencyMultiplier;
  } else {
    // LEARNING evidence (certificates, coursework)
    // May provide explicit score, quality, or practicalDepth+quality
    let rawScore: number;
    if (item.score !== undefined && item.score !== null) {
      rawScore = validateScoreRange(item.score, 'score');
    } else if (item.quality !== undefined && item.quality !== null) {
      rawScore = validateScoreRange(item.quality, 'quality');
      quality = rawScore;
    } else if (
      item.practicalDepth !== undefined &&
      item.practicalDepth !== null &&
      item.quality !== undefined &&
      item.quality !== null
    ) {
      practicalDepth = validateScoreRange(item.practicalDepth, 'practicalDepth');
      quality = validateScoreRange(item.quality, 'quality');
      rawScore = config.practicalDepthWeight * practicalDepth + config.qualityWeight * quality;
    } else {
      throw new ValidationError(`Learning evidence ${item.evidenceId} must provide a score or quality value`, 'score');
    }

    evidenceScore = rawScore * recencyMultiplier;
  }

  // Final verification that evidenceScore is strictly 0 <= evidenceScore <= 100
  validateScoreRange(evidenceScore, 'evidenceScore');

  return {
    evidenceId: item.evidenceId,
    title: item.title,
    type: item.type,
    category: item.category,
    activityDate: actDate,
    artifactId: item.artifactId,
    corroboratesArtifactId: item.corroboratesArtifactId ?? null,
    questionSetVersion: item.questionSetVersion,
    practicalDepth,
    quality,
    recencyMultiplier,
    evidenceScore,
  };
}
