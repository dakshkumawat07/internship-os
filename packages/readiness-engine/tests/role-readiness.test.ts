/**
 * Role Readiness Unit Tests.
 *
 * Tests computeRoleReadiness, determineReadinessTier, and applyCoreOverride
 * against the canonical formulas from docs/SCORING_MODEL.md §2.2-§2.5.
 *
 * Tier boundaries (from DEFAULT_SCORING_CONFIG_V1):
 *   EARLY_STAGE : 0 - 39
 *   NEEDS_WORK  : 40 - 69
 *   CLOSE       : 70 - 84
 *   READY       : 85 - 100
 */

import test from 'node:test';
import assert from 'node:assert';
import {
  computeRoleReadiness,
  determineReadinessTier,
  applyCoreOverride,
  DEFAULT_SCORING_CONFIG_V1,
  RoleSkillInput,
  SkillAssessmentOutput,
  IMPORTANCE_WEIGHT_MAP,
} from '../src';

const EVAL_DATE = '2026-09-01T00:00:00.000Z';

/**
 * Helper: Build a minimal SkillAssessmentOutput for a given skillId and score.
 */
function makeSkillAssessment(
  skillId: string,
  score: number,
  importance: 'CORE' | 'IMPORTANT' | 'USEFUL' | 'OPTIONAL',
  weight?: number
): SkillAssessmentOutput {
  const w = weight ?? IMPORTANCE_WEIGHT_MAP[importance];
  return {
    skillId,
    skillName: skillId,
    importance,
    weight: w,
    skillScore: score,
    confidence: score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : score > 0 ? 'LOW' : 'NONE',
    confidenceDetails: {
      level: score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : score > 0 ? 'LOW' : 'NONE',
      reasons: [],
      qualifyingPracticalCount: 0,
      corroborationCount: 0,
      hasConflictingEvidence: false,
      hasCertificateCorroboration: false,
    },
    breakdown: {
      practical: {
        peakPracticalScore: score,
        qualifyingArtifactCount: score > 0 ? 1 : 0,
        nonQualifyingArtifactCount: 0,
        totalPracticalArtifactCount: score > 0 ? 1 : 0,
        supportThreshold: score * 0.5,
        primaryContribution: score,
        secondaryContribution: 0,
        tertiaryContribution: 0,
        tailContribution: 0,
        totalPracticalScore: score,
        qualifyingScores: score > 0 ? [score] : [],
        nonQualifyingScores: [],
      },
      certificate: {
        mode: 'NONE',
        certificateCount: 0,
        rawCertificateScore: 0,
        appliedCap: 40,
        finalCertificateScore: 0,
        sortedCertificateScores: [],
      },
      rawTotalScore: score,
      roundedScore: Math.round(score),
      finalSkillScore: score,
      explanation: `SkillScore ${score}`,
    },
    practicalArtifactCount: score > 0 ? 1 : 0,
    certificateCount: 0,
    contributingEvidence: [],
  };
}

function makeRoleSkill(
  skillId: string,
  importance: 'CORE' | 'IMPORTANT' | 'USEFUL' | 'OPTIONAL',
  weight?: number
): RoleSkillInput {
  const w = weight ?? IMPORTANCE_WEIGHT_MAP[importance];
  return { skillId, skillName: skillId, importance, weight: w, frameworkVersion: 'mvp-1' };
}

test('Role Readiness Module Unit Tests', async (t) => {
  // ----------------------------------------------------------------
  // determineReadinessTier boundary tests
  // ----------------------------------------------------------------

  await t.test('determineReadinessTier: score 0 -> EARLY_STAGE', () => {
    assert.strictEqual(determineReadinessTier(0, DEFAULT_SCORING_CONFIG_V1), 'EARLY_STAGE');
  });

  await t.test('determineReadinessTier: score 39 -> EARLY_STAGE', () => {
    assert.strictEqual(determineReadinessTier(39, DEFAULT_SCORING_CONFIG_V1), 'EARLY_STAGE');
  });

  await t.test('determineReadinessTier: score 40 -> NEEDS_WORK', () => {
    assert.strictEqual(determineReadinessTier(40, DEFAULT_SCORING_CONFIG_V1), 'NEEDS_WORK');
  });

  await t.test('determineReadinessTier: score 69 -> NEEDS_WORK', () => {
    assert.strictEqual(determineReadinessTier(69, DEFAULT_SCORING_CONFIG_V1), 'NEEDS_WORK');
  });

  await t.test('determineReadinessTier: score 70 -> CLOSE', () => {
    assert.strictEqual(determineReadinessTier(70, DEFAULT_SCORING_CONFIG_V1), 'CLOSE');
  });

  await t.test('determineReadinessTier: score 84 -> CLOSE', () => {
    assert.strictEqual(determineReadinessTier(84, DEFAULT_SCORING_CONFIG_V1), 'CLOSE');
  });

  await t.test('determineReadinessTier: score 85 -> READY', () => {
    assert.strictEqual(determineReadinessTier(85, DEFAULT_SCORING_CONFIG_V1), 'READY');
  });

  await t.test('determineReadinessTier: score 100 -> READY', () => {
    assert.strictEqual(determineReadinessTier(100, DEFAULT_SCORING_CONFIG_V1), 'READY');
  });

  // ----------------------------------------------------------------
  // applyCoreOverride tests
  // ----------------------------------------------------------------

  await t.test('applyCoreOverride: READY + gate triggered -> NEEDS_WORK', () => {
    assert.strictEqual(applyCoreOverride('READY', true), 'NEEDS_WORK');
  });

  await t.test('applyCoreOverride: CLOSE + gate triggered -> NEEDS_WORK', () => {
    assert.strictEqual(applyCoreOverride('CLOSE', true), 'NEEDS_WORK');
  });

  await t.test('applyCoreOverride: NEEDS_WORK + gate triggered -> unchanged', () => {
    assert.strictEqual(applyCoreOverride('NEEDS_WORK', true), 'NEEDS_WORK');
  });

  await t.test('applyCoreOverride: EARLY_STAGE + gate triggered -> unchanged', () => {
    assert.strictEqual(applyCoreOverride('EARLY_STAGE', true), 'EARLY_STAGE');
  });

  await t.test('applyCoreOverride: READY + gate NOT triggered -> READY', () => {
    assert.strictEqual(applyCoreOverride('READY', false), 'READY');
  });

  await t.test('applyCoreOverride: CLOSE + gate NOT triggered -> CLOSE', () => {
    assert.strictEqual(applyCoreOverride('CLOSE', false), 'CLOSE');
  });

  // ----------------------------------------------------------------
  // computeRoleReadiness: weighted average
  // ----------------------------------------------------------------

  await t.test('computeRoleReadiness: single CORE skill score 90 -> overallScore 90', () => {
    const roleSkills = [makeRoleSkill('s1', 'CORE')];
    const assessments = [makeSkillAssessment('s1', 90, 'CORE')];
    const result = computeRoleReadiness(assessments, roleSkills, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE, 'mvp-1');
    assert.strictEqual(result.overallScore, 90);
    assert.strictEqual(result.readinessTier, 'READY');
    assert.strictEqual(result.coreGateTriggered, false);
  });

  await t.test('computeRoleReadiness: two equal-weight CORE skills 60 & 80 -> 70 (CLOSE)', () => {
    const roleSkills = [makeRoleSkill('s1', 'CORE'), makeRoleSkill('s2', 'CORE')];
    const assessments = [
      makeSkillAssessment('s1', 60, 'CORE'),
      makeSkillAssessment('s2', 80, 'CORE'),
    ];
    const result = computeRoleReadiness(assessments, roleSkills, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE, 'mvp-1');
    assert.strictEqual(result.overallScore, 70);
    assert.strictEqual(result.readinessTier, 'CLOSE');
    assert.strictEqual(result.totalWeight, 8);
  });

  await t.test('computeRoleReadiness: weighted calculation 4-3-2-1', () => {
    // CORE=80 w4, IMP=60 w3, USEFUL=70 w2, OPT=50 w1
    // sum = 80*4+60*3+70*2+50*1 = 320+180+140+50 = 690, totalW=10 => 69.0
    const roleSkills = [
      makeRoleSkill('core', 'CORE', 4),
      makeRoleSkill('imp', 'IMPORTANT', 3),
      makeRoleSkill('use', 'USEFUL', 2),
      makeRoleSkill('opt', 'OPTIONAL', 1),
    ];
    const assessments = [
      makeSkillAssessment('core', 80, 'CORE', 4),
      makeSkillAssessment('imp', 60, 'IMPORTANT', 3),
      makeSkillAssessment('use', 70, 'USEFUL', 2),
      makeSkillAssessment('opt', 50, 'OPTIONAL', 1),
    ];
    const result = computeRoleReadiness(assessments, roleSkills, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE, 'mvp-1');
    assert.strictEqual(result.overallScore, 69.0);
    assert.strictEqual(result.readinessTier, 'NEEDS_WORK');
    assert.strictEqual(result.totalWeight, 10);
  });

  // ----------------------------------------------------------------
  // CORE gate scenarios
  // ----------------------------------------------------------------

  await t.test('CORE gate: CORE skill at 35 (< 40) forces NEEDS_WORK even if overall is CLOSE', () => {
    // CORE at 35 (w4) + IMPORTANT at 95 (w3) + IMPORTANT at 95 (w3)
    // sum = 35*4 + 95*3 + 95*3 = 140 + 285 + 285 = 710, totalW = 10 -> avg = 71.0 (CLOSE)
    const roleSkills = [
      makeRoleSkill('core', 'CORE'),
      makeRoleSkill('imp1', 'IMPORTANT'),
      makeRoleSkill('imp2', 'IMPORTANT'),
    ];
    const assessments = [
      makeSkillAssessment('core', 35, 'CORE'),
      makeSkillAssessment('imp1', 95, 'IMPORTANT'),
      makeSkillAssessment('imp2', 95, 'IMPORTANT'),
    ];
    const result = computeRoleReadiness(assessments, roleSkills, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE, 'mvp-1');
    assert.strictEqual(result.overallScore, 71.0);
    assert.strictEqual(result.rawTierBeforeCoreGate, 'CLOSE');
    assert.strictEqual(result.coreGateTriggered, true);
    assert.deepStrictEqual(result.coreGateSkillIds, ['core']);
    assert.strictEqual(result.readinessTier, 'NEEDS_WORK');
  });

  await t.test('CORE gate: CORE skill at 40 (== coreGateMin) does NOT trigger gate', () => {
    const roleSkills = [makeRoleSkill('core', 'CORE')];
    const assessments = [makeSkillAssessment('core', 40, 'CORE')];
    const result = computeRoleReadiness(assessments, roleSkills, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE, 'mvp-1');
    assert.strictEqual(result.coreGateTriggered, false);
    assert.strictEqual(result.readinessTier, 'NEEDS_WORK');
  });

  await t.test('CORE gate: IMPORTANT skill < 40 does NOT trigger CORE gate', () => {
    const roleSkills = [
      makeRoleSkill('core', 'CORE'),
      makeRoleSkill('imp', 'IMPORTANT'),
    ];
    const assessments = [
      makeSkillAssessment('core', 85, 'CORE'),
      makeSkillAssessment('imp', 20, 'IMPORTANT'),
    ];
    const result = computeRoleReadiness(assessments, roleSkills, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE, 'mvp-1');
    assert.strictEqual(result.coreGateTriggered, false);
    assert.deepStrictEqual(result.coreGateSkillIds, []);
  });

  await t.test('CORE gate: Multiple CORE skills both < 40 -> both listed in coreGateSkillIds', () => {
    const roleSkills = [
      makeRoleSkill('c1', 'CORE'),
      makeRoleSkill('c2', 'CORE'),
    ];
    const assessments = [
      makeSkillAssessment('c1', 30, 'CORE'),
      makeSkillAssessment('c2', 25, 'CORE'),
    ];
    const result = computeRoleReadiness(assessments, roleSkills, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE, 'mvp-1');
    assert.strictEqual(result.coreGateTriggered, true);
    assert.strictEqual(result.coreGateSkillIds.length, 2);
    assert.ok(result.coreGateSkillIds.includes('c1'));
    assert.ok(result.coreGateSkillIds.includes('c2'));
  });

  // ----------------------------------------------------------------
  // Missing skill in assessments (skill with no evidence -> score 0)
  // ----------------------------------------------------------------

  await t.test('Missing skill assessment defaults to score 0', () => {
    const roleSkills = [
      makeRoleSkill('s1', 'CORE'),
      makeRoleSkill('s2', 'CORE'),
    ];
    const assessments = [makeSkillAssessment('s1', 80, 'CORE')]; // s2 is missing
    const result = computeRoleReadiness(assessments, roleSkills, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE, 'mvp-1');
    // avg = (80*4 + 0*4) / 8 = 40.0
    assert.strictEqual(result.overallScore, 40.0);
    assert.strictEqual(result.totalSkillsAssessed, 2);
  });

  // ----------------------------------------------------------------
  // frameworkVersion and scoringConfigVersion propagation
  // ----------------------------------------------------------------

  await t.test('frameworkVersion is preserved in output', () => {
    const roleSkills = [makeRoleSkill('s1', 'CORE')];
    const assessments = [makeSkillAssessment('s1', 80, 'CORE')];
    const result = computeRoleReadiness(assessments, roleSkills, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE, 'test-framework-v99');
    assert.strictEqual(result.frameworkVersion, 'test-framework-v99');
    assert.strictEqual(result.scoringConfigVersion, DEFAULT_SCORING_CONFIG_V1.version);
  });

  // ----------------------------------------------------------------
  // Empty roleSkills list throws
  // ----------------------------------------------------------------

  await t.test('Empty roleSkills list throws ValidationError', () => {
    assert.throws(() => {
      computeRoleReadiness([], [], DEFAULT_SCORING_CONFIG_V1, EVAL_DATE, 'mvp-1');
    });
  });
});
