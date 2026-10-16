import test from 'node:test';
import assert from 'node:assert';
import { scoreEvidence, DEFAULT_SCORING_CONFIG_V1, SkillEvidenceInput, ScoreRangeError, InvalidDateError, ValidationError } from '../src';

const EVAL_DATE = '2026-09-01T00:00:00.000Z';
const RECENT_DATE = '2026-08-15T00:00:00.000Z';

test('Evidence Scorer Unit Tests', async (t) => {
  await t.test('computes exact 0.6 / 0.4 practical depth and quality weights', () => {
    const item: SkillEvidenceInput = {
      evidenceId: 'e1',
      title: 'Project Alpha',
      type: 'PROJECT',
      category: 'PRACTICAL',
      activityDate: RECENT_DATE,
      artifactId: 'art-1',
      questionSetVersion: 'v1',
      practicalDepth: 100,
      quality: 50,
      recencyMultiplier: 1.0,
    };

    const scored = scoreEvidence(item, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);
    // 0.6 * 100 + 0.4 * 50 = 60 + 20 = 80
    assert.strictEqual(scored.evidenceScore, 80);
    assert.strictEqual(scored.practicalDepth, 100);
    assert.strictEqual(scored.quality, 50);
    assert.strictEqual(scored.recencyMultiplier, 1.0);
  });

  await t.test('correctly scores boundary values 0 and 100', () => {
    const zeroItem: SkillEvidenceInput = {
      evidenceId: 'e-zero',
      title: 'Zero Project',
      type: 'PROJECT',
      category: 'PRACTICAL',
      activityDate: RECENT_DATE,
      artifactId: 'art-zero',
      questionSetVersion: 'v1',
      practicalDepth: 0,
      quality: 0,
      recencyMultiplier: 1.0,
    };
    const scoredZero = scoreEvidence(zeroItem, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);
    assert.strictEqual(scoredZero.evidenceScore, 0);

    const maxItem: SkillEvidenceInput = {
      evidenceId: 'e-max',
      title: 'Max Project',
      type: 'PROJECT',
      category: 'PRACTICAL',
      activityDate: RECENT_DATE,
      artifactId: 'art-max',
      questionSetVersion: 'v1',
      practicalDepth: 100,
      quality: 100,
      recencyMultiplier: 1.0,
    };
    const scoredMax = scoreEvidence(maxItem, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);
    assert.strictEqual(scoredMax.evidenceScore, 100);
  });

  await t.test('applies recency multiplier to base score', () => {
    const item: SkillEvidenceInput = {
      evidenceId: 'e-decay',
      title: 'Decayed Project',
      type: 'PROJECT',
      category: 'PRACTICAL',
      activityDate: RECENT_DATE,
      artifactId: 'art-decay',
      questionSetVersion: 'v1',
      practicalDepth: 100,
      quality: 100,
      recencyMultiplier: 0.75,
    };
    const scored = scoreEvidence(item, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);
    // 100 * 0.75 = 75
    assert.strictEqual(scored.evidenceScore, 75);
  });

  await t.test('handles learning evidence with score, quality, or both', () => {
    // 1. Direct score
    const itemScore: SkillEvidenceInput = {
      evidenceId: 'cert-1',
      title: 'AWS Certified',
      type: 'CERTIFICATE',
      category: 'LEARNING',
      activityDate: RECENT_DATE,
      artifactId: 'art-cert-1',
      questionSetVersion: 'v1',
      score: 90,
      recencyMultiplier: 1.0,
    };
    const s1 = scoreEvidence(itemScore, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);
    assert.strictEqual(s1.evidenceScore, 90);

    // 2. Quality only
    const itemQuality: SkillEvidenceInput = {
      evidenceId: 'cert-2',
      title: 'Coursera ML',
      type: 'CERTIFICATE',
      category: 'LEARNING',
      activityDate: RECENT_DATE,
      artifactId: 'art-cert-2',
      questionSetVersion: 'v1',
      quality: 85,
      recencyMultiplier: 1.0,
    };
    const s2 = scoreEvidence(itemQuality, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);
    assert.strictEqual(s2.evidenceScore, 85);
  });

  await t.test('throws ScoreRangeError on out-of-range inputs', () => {
    assert.throws(
      () =>
        scoreEvidence(
          {
            evidenceId: 'bad',
            title: 'Bad',
            type: 'PROJECT',
            category: 'PRACTICAL',
            activityDate: RECENT_DATE,
            artifactId: 'a',
            questionSetVersion: 'v1',
            practicalDepth: -1,
            quality: 50,
          },
          DEFAULT_SCORING_CONFIG_V1,
          EVAL_DATE
        ),
      ScoreRangeError
    );

    assert.throws(
      () =>
        scoreEvidence(
          {
            evidenceId: 'bad',
            title: 'Bad',
            type: 'PROJECT',
            category: 'PRACTICAL',
            activityDate: RECENT_DATE,
            artifactId: 'a',
            questionSetVersion: 'v1',
            practicalDepth: 101,
            quality: 50,
          },
          DEFAULT_SCORING_CONFIG_V1,
          EVAL_DATE
        ),
      ScoreRangeError
    );
  });

  await t.test('throws ValidationError when practical evidence misses depth or quality', () => {
    assert.throws(
      () =>
        scoreEvidence(
          {
            evidenceId: 'bad',
            title: 'Bad',
            type: 'PROJECT',
            category: 'PRACTICAL',
            activityDate: RECENT_DATE,
            artifactId: 'a',
            questionSetVersion: 'v1',
            practicalDepth: null,
            quality: 50,
          },
          DEFAULT_SCORING_CONFIG_V1,
          EVAL_DATE
        ),
      ValidationError
    );
  });
});
