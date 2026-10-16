/**
 * Recency Module Unit Tests.
 *
 * Verifies calculateRecencyMultiplier and getElapsedMonths against
 * the canonical recency formula from docs/SCORING_MODEL.md §4.
 *
 * Zones:
 *   Fresh  : age <= recencyDecayMonths (12) -> multiplier = 1.0
 *   Decay  : recencyDecayMonths < age <= recencyFloorMonths (24) -> linear decay 1.0 -> 0.5
 *   Floor  : age > recencyFloorMonths (24) -> multiplier = 0.5
 */

import test from 'node:test';
import assert from 'node:assert';
import { calculateRecencyMultiplier, getElapsedMonths, DEFAULT_SCORING_CONFIG_V1 } from '../src';

const EVAL_DATE = '2026-09-01T00:00:00.000Z';

test('Recency Module Unit Tests', async (t) => {
  // ----------------------------------------------------------------
  // getElapsedMonths
  // ----------------------------------------------------------------

  await t.test('getElapsedMonths: 0 months (same day)', () => {
    const months = getElapsedMonths(new Date(EVAL_DATE), new Date(EVAL_DATE));
    assert.strictEqual(months, 0);
  });

  await t.test('getElapsedMonths: exactly 1 month', () => {
    const actDate = '2026-08-01T00:00:00.000Z';
    const months = getElapsedMonths(new Date(actDate), new Date(EVAL_DATE));
    assert.strictEqual(months, 1);
  });

  await t.test('getElapsedMonths: exactly 12 months', () => {
    const actDate = '2025-09-01T00:00:00.000Z';
    const months = getElapsedMonths(new Date(actDate), new Date(EVAL_DATE));
    assert.strictEqual(months, 12);
  });

  await t.test('getElapsedMonths: exactly 24 months', () => {
    const actDate = '2024-09-01T00:00:00.000Z';
    const months = getElapsedMonths(new Date(actDate), new Date(EVAL_DATE));
    assert.strictEqual(months, 24);
  });

  await t.test('getElapsedMonths: 30 months (beyond floor)', () => {
    const actDate = '2024-03-01T00:00:00.000Z';
    const months = getElapsedMonths(new Date(actDate), new Date(EVAL_DATE));
    assert.strictEqual(months, 30);
  });

  // ----------------------------------------------------------------
  // calculateRecencyMultiplier — Fresh Zone (age <= 12)
  // ----------------------------------------------------------------

  await t.test('Fresh zone: age 0 months -> multiplier 1.0', () => {
    const mult = calculateRecencyMultiplier(new Date(EVAL_DATE), EVAL_DATE, DEFAULT_SCORING_CONFIG_V1);
    assert.strictEqual(mult, 1.0);
  });

  await t.test('Fresh zone: age 1 month -> multiplier 1.0', () => {
    const actDate = '2026-08-01T00:00:00.000Z';
    const mult = calculateRecencyMultiplier(new Date(actDate), EVAL_DATE, DEFAULT_SCORING_CONFIG_V1);
    assert.strictEqual(mult, 1.0);
  });

  await t.test('Fresh zone: age 6 months -> multiplier 1.0', () => {
    const actDate = '2026-03-01T00:00:00.000Z';
    const mult = calculateRecencyMultiplier(new Date(actDate), EVAL_DATE, DEFAULT_SCORING_CONFIG_V1);
    assert.strictEqual(mult, 1.0);
  });

  await t.test('Fresh zone boundary: age exactly 12 months -> multiplier 1.0', () => {
    const actDate = '2025-09-01T00:00:00.000Z'; // exactly 12 months before EVAL_DATE
    const mult = calculateRecencyMultiplier(new Date(actDate), EVAL_DATE, DEFAULT_SCORING_CONFIG_V1);
    assert.strictEqual(mult, 1.0);
  });

  // ----------------------------------------------------------------
  // calculateRecencyMultiplier — Decay Zone (12 < age <= 24)
  // ----------------------------------------------------------------

  await t.test('Decay zone: age 18 months -> multiplier 0.75', () => {
    // Linear decay: 1.0 - (18 - 12) / (24 - 12) * (1.0 - 0.5) = 1.0 - 6/12 * 0.5 = 1.0 - 0.25 = 0.75
    const actDate = '2025-03-01T00:00:00.000Z';
    const mult = calculateRecencyMultiplier(new Date(actDate), EVAL_DATE, DEFAULT_SCORING_CONFIG_V1);
    assert.strictEqual(mult, 0.75);
  });

  await t.test('Decay zone: age 15 months -> multiplier 0.875', () => {
    // 1.0 - (15 - 12) / 12 * 0.5 = 1.0 - 3/12 * 0.5 = 1.0 - 0.125 = 0.875
    const actDate = '2025-06-01T00:00:00.000Z';
    const mult = calculateRecencyMultiplier(new Date(actDate), EVAL_DATE, DEFAULT_SCORING_CONFIG_V1);
    assert.strictEqual(mult, 0.875);
  });

  await t.test('Decay zone: age 21 months -> multiplier 0.625', () => {
    // 1.0 - (21 - 12) / 12 * 0.5 = 1.0 - 9/12 * 0.5 = 1.0 - 0.375 = 0.625
    const actDate = '2024-12-01T00:00:00.000Z';
    const mult = calculateRecencyMultiplier(new Date(actDate), EVAL_DATE, DEFAULT_SCORING_CONFIG_V1);
    assert.strictEqual(mult, 0.625);
  });

  // ----------------------------------------------------------------
  // calculateRecencyMultiplier — Floor Zone (age >= 24)
  // ----------------------------------------------------------------

  await t.test('Floor zone boundary: age exactly 24 months -> multiplier 0.5', () => {
    const actDate = '2024-09-01T00:00:00.000Z'; // exactly 24 months before EVAL_DATE
    const mult = calculateRecencyMultiplier(new Date(actDate), EVAL_DATE, DEFAULT_SCORING_CONFIG_V1);
    assert.strictEqual(mult, 0.5);
  });

  await t.test('Floor zone: age 30 months -> multiplier 0.5 (clamped)', () => {
    const actDate = '2024-03-01T00:00:00.000Z';
    const mult = calculateRecencyMultiplier(new Date(actDate), EVAL_DATE, DEFAULT_SCORING_CONFIG_V1);
    assert.strictEqual(mult, 0.5);
  });

  await t.test('Floor zone: age 48 months -> multiplier 0.5 (clamped)', () => {
    const actDate = '2022-09-01T00:00:00.000Z';
    const mult = calculateRecencyMultiplier(new Date(actDate), EVAL_DATE, DEFAULT_SCORING_CONFIG_V1);
    assert.strictEqual(mult, 0.5);
  });

  // ----------------------------------------------------------------
  // String-based evaluationDate accepted
  // ----------------------------------------------------------------

  await t.test('Accepts string evaluationDate', () => {
    const actDate = new Date('2025-09-01T00:00:00.000Z');
    const mult = calculateRecencyMultiplier(actDate, EVAL_DATE, DEFAULT_SCORING_CONFIG_V1);
    assert.strictEqual(mult, 1.0);
  });

  // ----------------------------------------------------------------
  // Future activity date throws
  // ----------------------------------------------------------------

  await t.test('Future activity date throws InvalidDateError', () => {
    const futureDate = new Date('2027-01-01T00:00:00.000Z');
    assert.throws(() => {
      calculateRecencyMultiplier(futureDate, EVAL_DATE, DEFAULT_SCORING_CONFIG_V1);
    });
  });
});
