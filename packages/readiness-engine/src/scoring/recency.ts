/**
 * Recency Multiplier Calculation.
 *
 * Computes RecencyMultiplier (0.5 - 1.0) from Evidence.activityDate against explicit evaluationDate.
 *
 * Reference: docs/SCORING_MODEL.md §2.1; docs/DECISIONS.md ADR-002, ADR-023
 */

import { ScoringConfig } from '../types/config';
import { validateDate, validateDateOrder } from '../validation/validator';

/** Average number of days in a calendar month (365.25 / 12) */
const DAYS_PER_MONTH = 30.4375;

/**
 * Calculates elapsed months between activityDate and evaluationDate using calendar months.
 * When both dates fall on the same day of the month, the elapsed months is an exact integer.
 */
export function getElapsedMonths(activityDate: Date, evaluationDate: Date): number {
  const yearsDiff = evaluationDate.getUTCFullYear() - activityDate.getUTCFullYear();
  const monthsDiff = evaluationDate.getUTCMonth() - activityDate.getUTCMonth();
  const daysDiff = (evaluationDate.getUTCDate() - activityDate.getUTCDate()) / DAYS_PER_MONTH;
  const elapsed = yearsDiff * 12 + monthsDiff + daysDiff;
  return Math.max(0, elapsed);
}

/**
 * Calculates the recency multiplier (0.5 - 1.0) according to the configured recency policy.
 *
 * - activityDate <= evaluationDate is strictly enforced (future dates rejected)
 * - Fresh evidence (age <= recencyDecayMonths, default 12 months) receives full multiplier (1.0)
 * - Penalty begins to apply after recencyDecayMonths, decaying linearly over recencyDecayMonths down to recencyMin (0.5)
 * - Evidence older than 2 * recencyDecayMonths is clamped to recencyMin (0.5)
 */
export function calculateRecencyMultiplier(
  activityDate: Date | string,
  evaluationDate: Date | string,
  config: Pick<ScoringConfig, 'recencyMin' | 'recencyMax' | 'recencyDecayMonths'>
): number {
  const actDate = validateDate(activityDate, 'activityDate');
  const evalDate = validateDate(evaluationDate, 'evaluationDate');
  validateDateOrder(actDate, evalDate);

  const elapsedMonths = getElapsedMonths(actDate, evalDate);

  // Evidence at or ahead of evaluation date
  if (elapsedMonths <= 0) {
    return config.recencyMax;
  }

  // If decay is disabled or decay months is 0, clamp immediately to min
  if (config.recencyDecayMonths <= 0) {
    return config.recencyMin;
  }

  // Grace period before recency penalty begins to apply (canonical: 12 months)
  if (elapsedMonths <= config.recencyDecayMonths) {
    return config.recencyMax;
  }

  // Linear decay over recencyDecayMonths down to recencyMin
  const excessMonths = elapsedMonths - config.recencyDecayMonths;
  const decaySpan = config.recencyDecayMonths;
  const decayFraction = Math.min(1.0, excessMonths / decaySpan);
  const multiplier = config.recencyMax - decayFraction * (config.recencyMax - config.recencyMin);

  return Math.max(config.recencyMin, Math.min(config.recencyMax, multiplier));
}
