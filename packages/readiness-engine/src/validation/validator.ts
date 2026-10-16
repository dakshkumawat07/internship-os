/**
 * Input validation for the InternshipOS Readiness Engine.
 *
 * Enforces strict input validation:
 * - Reject NaN, Infinity, negative values, and values > 100
 * - Reject invalid or future dates
 * - Validate role-skill importance/weight correspondence
 * - Validate question-set version compatibility
 *
 * Reference: docs/SCORING_MODEL.md §11; prompt validation rules
 */

import { ScoringConfig } from '../types/config';
import { InvalidDateError, ScoreRangeError, ValidationError } from '../types/errors';
import { IMPORTANCE_WEIGHT_MAP, RoleSkillInput } from '../types/role';

/**
 * Validates that a numeric score is a finite number between 0 and 100.
 */
export function validateScoreRange(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    throw new ScoreRangeError(fieldName, typeof value === 'number' ? value : NaN);
  }
  if (value < 0 || value > 100) {
    throw new ScoreRangeError(fieldName, value);
  }
  return value;
}

/**
 * Validates and converts an input date to a valid Date object.
 */
export function validateDate(value: unknown, fieldName: string): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new InvalidDateError(fieldName, 'Date instance contains invalid time (NaN)');
    }
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new InvalidDateError(fieldName, `Cannot parse "${value}" into a valid Date`);
    }
    return d;
  }
  throw new InvalidDateError(fieldName, `Expected Date, string, or number, received ${typeof value}`);
}

/**
 * Validates that activityDate is not in the future relative to evaluationDate.
 */
export function validateDateOrder(activityDate: Date, evaluationDate: Date): void {
  if (activityDate.getTime() > evaluationDate.getTime()) {
    throw new InvalidDateError(
      'activityDate',
      `activityDate (${activityDate.toISOString()}) cannot be in the future relative to evaluationDate (${evaluationDate.toISOString()})`
    );
  }
}

/**
 * Validates that a recency multiplier is within the configured [recencyMin, recencyMax] range.
 */
export function validateRecencyMultiplier(
  multiplier: unknown,
  config: Pick<ScoringConfig, 'recencyMin' | 'recencyMax'>
): number {
  if (typeof multiplier !== 'number' || Number.isNaN(multiplier) || !Number.isFinite(multiplier)) {
    throw new ValidationError(`RecencyMultiplier must be a finite number, received ${multiplier}`, 'recencyMultiplier', multiplier);
  }
  if (multiplier < config.recencyMin || multiplier > config.recencyMax) {
    throw new ValidationError(
      `RecencyMultiplier must be between ${config.recencyMin} and ${config.recencyMax}, received ${multiplier}`,
      'recencyMultiplier',
      multiplier
    );
  }
  return multiplier;
}

/**
 * Validates role skill importance and weight correspondence.
 */
export function validateRoleSkill(roleSkill: RoleSkillInput): void {
  if (!roleSkill.skillId || typeof roleSkill.skillId !== 'string' || roleSkill.skillId.trim() === '') {
    throw new ValidationError('RoleSkill must have a non-empty skillId', 'skillId', roleSkill.skillId);
  }
  const expectedWeight = IMPORTANCE_WEIGHT_MAP[roleSkill.importance];
  if (expectedWeight === undefined) {
    throw new ValidationError(`Invalid importance: ${roleSkill.importance}`, 'importance', roleSkill.importance);
  }
  if (roleSkill.weight !== expectedWeight) {
    throw new ValidationError(
      `Weight mismatch for ${roleSkill.skillId}: importance ${roleSkill.importance} requires weight ${expectedWeight}, received ${roleSkill.weight}`,
      'weight',
      roleSkill.weight
    );
  }
}

/**
 * Checks whether an evidence item's questionSetVersion is compatible with the active configuration.
 */
export function isQuestionSetVersionCompatible(
  evidenceVersion: string,
  config: Pick<ScoringConfig, 'activeQuestionSetVersion' | 'compatibleQuestionSetVersions'>
): boolean {
  if (!evidenceVersion || typeof evidenceVersion !== 'string' || evidenceVersion.trim() === '') {
    return false;
  }
  const active = config.activeQuestionSetVersion ?? 'v1';
  if (evidenceVersion === active) {
    return true;
  }
  const compatible = config.compatibleQuestionSetVersions ?? [active];
  return compatible.includes(evidenceVersion);
}
