import test from 'node:test';
import assert from 'node:assert';
import {
  calculateReadiness,
  scoreEvidence,
  aggregateSkillScore,
  DEFAULT_SCORING_CONFIG_V1,
  RoleSkillInput,
  SkillEvidenceInput,
  ReadinessInput,
} from '../src';

const EVAL_DATE = '2026-09-01T00:00:00.000Z';
const RECENT_DATE = '2026-08-01T00:00:00.000Z'; // 1 month old -> recencyMultiplier 1.0

const sampleCoreSkill: RoleSkillInput = {
  skillId: 'core-skill',
  skillName: 'Core Technical Skill',
  importance: 'CORE',
  weight: 4,
  frameworkVersion: 'mvp-1',
};

function makePracticalEvidence(params: {
  id: string;
  artifactId: string;
  depth: number;
  quality: number;
  date?: string;
  recencyMultiplier?: number;
}): SkillEvidenceInput {
  return {
    evidenceId: params.id,
    title: `Evidence ${params.id}`,
    type: 'PROJECT',
    category: 'PRACTICAL',
    activityDate: params.date ?? RECENT_DATE,
    artifactId: params.artifactId,
    questionSetVersion: 'v1',
    practicalDepth: params.depth,
    quality: params.quality,
    recencyMultiplier: params.recencyMultiplier,
  };
}

function makeCertEvidence(params: {
  id: string;
  artifactId: string;
  score: number;
  corroboratesArtifactId?: string | null;
  date?: string;
}): SkillEvidenceInput {
  return {
    evidenceId: params.id,
    title: `Cert ${params.id}`,
    type: 'CERTIFICATE',
    category: 'LEARNING',
    activityDate: params.date ?? RECENT_DATE,
    artifactId: params.artifactId,
    corroboratesArtifactId: params.corroboratesArtifactId,
    questionSetVersion: 'v1',
    score: params.score,
  };
}

test('Mandatory Regression Suite (18 Scenarios)', async (t) => {
  // Scenario 1: One project: 90 -> 90
  await t.test('1. One project: 90 -> 90', () => {
    // 0.6 * 90 + 0.4 * 90 = 90
    const ev = makePracticalEvidence({ id: 'e1', artifactId: 'art-1', depth: 90, quality: 90 });
    const scored = scoreEvidence(ev, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);
    assert.strictEqual(scored.evidenceScore, 90);

    const result = aggregateSkillScore('core-skill', sampleCoreSkill, [scored], DEFAULT_SCORING_CONFIG_V1);
    assert.strictEqual(result.skillScore, 90);
    assert.strictEqual(result.breakdown.practical.peakPracticalScore, 90);
    assert.strictEqual(result.breakdown.practical.qualifyingArtifactCount, 1);
  });

  // Scenario 2: Two strong projects: 90 + 90 -> 99
  await t.test('2. Two strong projects: 90 + 90 -> 99', () => {
    const e1 = makePracticalEvidence({ id: 'e1', artifactId: 'art-1', depth: 90, quality: 90 });
    const e2 = makePracticalEvidence({ id: 'e2', artifactId: 'art-2', depth: 90, quality: 90 });
    const s1 = scoreEvidence(e1, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);
    const s2 = scoreEvidence(e2, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);

    const result = aggregateSkillScore('core-skill', sampleCoreSkill, [s1, s2], DEFAULT_SCORING_CONFIG_V1);
    // P1 = 90, Q1 = 90 (qualifies because 90 >= 45) -> 90 + 0.10 * 90 = 99
    assert.strictEqual(result.skillScore, 99);
    assert.strictEqual(result.breakdown.practical.qualifyingArtifactCount, 2);
  });

  // Scenario 3: Strong + weak: 90 + 20 -> 90
  await t.test('3. Strong + weak: 90 + 20 -> 90', () => {
    const e1 = makePracticalEvidence({ id: 'e1', artifactId: 'art-1', depth: 90, quality: 90 });
    const e2 = makePracticalEvidence({ id: 'e2', artifactId: 'art-2', depth: 20, quality: 20 });
    const s1 = scoreEvidence(e1, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);
    const s2 = scoreEvidence(e2, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);

    const result = aggregateSkillScore('core-skill', sampleCoreSkill, [s1, s2], DEFAULT_SCORING_CONFIG_V1);
    // P1 = 90, threshold = 45. 20 < 45 -> does NOT qualify, contributes 0
    assert.strictEqual(result.skillScore, 90);
    assert.strictEqual(result.breakdown.practical.qualifyingArtifactCount, 1);
    assert.strictEqual(result.breakdown.practical.nonQualifyingArtifactCount, 1);
  });

  // Scenario 4: Strong + meaningful: 90 + 60 -> 96
  await t.test('4. Strong + meaningful: 90 + 60 -> 96', () => {
    const e1 = makePracticalEvidence({ id: 'e1', artifactId: 'art-1', depth: 90, quality: 90 });
    const e2 = makePracticalEvidence({ id: 'e2', artifactId: 'art-2', depth: 60, quality: 60 });
    const s1 = scoreEvidence(e1, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);
    const s2 = scoreEvidence(e2, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);

    const result = aggregateSkillScore('core-skill', sampleCoreSkill, [s1, s2], DEFAULT_SCORING_CONFIG_V1);
    // P1 = 90, Q1 = 60 (qualifies: 60 >= 45) -> 90 + 0.10 * 60 = 96
    assert.strictEqual(result.skillScore, 96);
    assert.strictEqual(result.breakdown.practical.secondaryContribution, 6);
  });

  // Scenario 5: Strong + several weak: 90 + 40 + 30 + 20 -> 90
  await t.test('5. Strong + several weak: 90 + 40 + 30 + 20 -> 90', () => {
    const e1 = makePracticalEvidence({ id: 'e1', artifactId: 'art-1', depth: 90, quality: 90 });
    const e2 = makePracticalEvidence({ id: 'e2', artifactId: 'art-2', depth: 40, quality: 40 });
    const e3 = makePracticalEvidence({ id: 'e3', artifactId: 'art-3', depth: 30, quality: 30 });
    const e4 = makePracticalEvidence({ id: 'e4', artifactId: 'art-4', depth: 20, quality: 20 });

    const scored = [e1, e2, e3, e4].map((e) => scoreEvidence(e, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE));
    const result = aggregateSkillScore('core-skill', sampleCoreSkill, scored, DEFAULT_SCORING_CONFIG_V1);

    // P1 = 90, threshold = 45. 40, 30, 20 are all < 45 -> 0 qualifying supporting artifacts
    assert.strictEqual(result.skillScore, 90);
    assert.strictEqual(result.breakdown.practical.qualifyingArtifactCount, 1);
    assert.strictEqual(result.breakdown.practical.nonQualifyingArtifactCount, 3);
  });

  // Scenario 6: Three equal medium: 60 + 60 + 60 -> 69
  await t.test('6. Three equal medium: 60 + 60 + 60 -> 69', () => {
    const e1 = makePracticalEvidence({ id: 'e1', artifactId: 'art-1', depth: 60, quality: 60 });
    const e2 = makePracticalEvidence({ id: 'e2', artifactId: 'art-2', depth: 60, quality: 60 });
    const e3 = makePracticalEvidence({ id: 'e3', artifactId: 'art-3', depth: 60, quality: 60 });

    const scored = [e1, e2, e3].map((e) => scoreEvidence(e, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE));
    const result = aggregateSkillScore('core-skill', sampleCoreSkill, scored, DEFAULT_SCORING_CONFIG_V1);

    // P1 = 60. threshold = 30. Q1 = 60, Q2 = 60.
    // S_practical = 60 + 0.10 * 60 + 0.05 * 60 = 60 + 6 + 3 = 69
    assert.strictEqual(result.skillScore, 69);
  });

  // Scenario 7: Strong project + perfect certificate: 80 + certificate 100 -> maximum 85
  await t.test('7. Strong project + perfect certificate: 80 + certificate 100 -> maximum 85', () => {
    const e1 = makePracticalEvidence({ id: 'e1', artifactId: 'art-1', depth: 80, quality: 80 });
    const e2 = makeCertEvidence({ id: 'e2', artifactId: 'art-cert', score: 100 });

    const scored = [
      scoreEvidence(e1, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE),
      scoreEvidence(e2, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE),
    ];
    const result = aggregateSkillScore('core-skill', sampleCoreSkill, scored, DEFAULT_SCORING_CONFIG_V1);

    // Practical exists -> S_cert = min(5, 0.05 * 100) = 5
    // S_practical = 80 -> total = 85
    assert.strictEqual(result.skillScore, 85);
    assert.strictEqual(result.breakdown.certificate.finalCertificateScore, 5);
  });

  // Scenario 8: Duplicate representations: Project 82 + GitHub 75 + Hackathon 78 same artifact -> 82
  await t.test('8. Duplicate representations: same artifact -> 82', () => {
    const e1: SkillEvidenceInput = {
      evidenceId: 'ev-project',
      title: 'Main Project',
      type: 'PROJECT',
      category: 'PRACTICAL',
      activityDate: RECENT_DATE,
      artifactId: 'shared-art-1',
      questionSetVersion: 'v1',
      practicalDepth: 82,
      quality: 82,
    };
    const e2: SkillEvidenceInput = {
      evidenceId: 'ev-github',
      title: 'GitHub Repo',
      type: 'GITHUB_REPOSITORY',
      category: 'PRACTICAL',
      activityDate: RECENT_DATE,
      artifactId: 'shared-art-1',
      questionSetVersion: 'v1',
      practicalDepth: 75,
      quality: 75,
    };
    const e3: SkillEvidenceInput = {
      evidenceId: 'ev-hackathon',
      title: 'Hackathon Submission',
      type: 'HACKATHON',
      category: 'PRACTICAL',
      activityDate: RECENT_DATE,
      artifactId: 'shared-art-1',
      questionSetVersion: 'v1',
      practicalDepth: 78,
      quality: 78,
    };

    const scored = [e1, e2, e3].map((e) => scoreEvidence(e, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE));
    const result = aggregateSkillScore('core-skill', sampleCoreSkill, scored, DEFAULT_SCORING_CONFIG_V1);

    // Consolidated: max(82, 75, 78) = 82
    assert.strictEqual(result.skillScore, 82);
    assert.strictEqual(result.breakdown.practical.totalPracticalArtifactCount, 1);
  });

  // Scenario 9: Project v1/v2 same artifact: 75 and 90 -> 90
  await t.test('9. Project v1/v2 same artifact: 75 and 90 -> 90', () => {
    const e1 = makePracticalEvidence({ id: 'v1', artifactId: 'project-lineage', depth: 75, quality: 75 });
    const e2 = makePracticalEvidence({ id: 'v2', artifactId: 'project-lineage', depth: 90, quality: 90 });

    const scored = [e1, e2].map((e) => scoreEvidence(e, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE));
    const result = aggregateSkillScore('core-skill', sampleCoreSkill, scored, DEFAULT_SCORING_CONFIG_V1);

    assert.strictEqual(result.skillScore, 90);
    assert.strictEqual(result.breakdown.practical.totalPracticalArtifactCount, 1);
  });

  // Scenario 10: Certificate-only: cannot exceed 40
  await t.test('10. Certificate-only: cannot exceed 40', () => {
    const c1 = makeCertEvidence({ id: 'c1', artifactId: 'cert-1', score: 100 });
    const c2 = makeCertEvidence({ id: 'c2', artifactId: 'cert-2', score: 100 });
    const c3 = makeCertEvidence({ id: 'c3', artifactId: 'cert-3', score: 100 });

    const scored = [c1, c2, c3].map((e) => scoreEvidence(e, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE));
    const result = aggregateSkillScore('core-skill', sampleCoreSkill, scored, DEFAULT_SCORING_CONFIG_V1);

    // Standalone certificate cap = 40
    assert.strictEqual(result.skillScore, 40);
    assert.strictEqual(result.breakdown.certificate.appliedCap, 40);
    assert.strictEqual(result.breakdown.practical.totalPracticalScore, 0);
  });

  // Scenario 11: No evidence: score 0 / confidence NONE
  await t.test('11. No evidence: score 0 / confidence NONE', () => {
    const result = aggregateSkillScore('core-skill', sampleCoreSkill, [], DEFAULT_SCORING_CONFIG_V1);
    assert.strictEqual(result.skillScore, 0);
    assert.strictEqual(result.confidence, 'NONE');
  });

  // Scenario 12: Old evidence: recency applied according to canonical config
  await t.test('12. Old evidence: recency applied according to canonical config', () => {
    // 24 months old -> recencyMultiplier drops to 0.5 (recencyMin)
    const oldDate = '2024-09-01T00:00:00.000Z'; // exactly 24 months before EVAL_DATE
    const e = makePracticalEvidence({ id: 'old-1', artifactId: 'art-old', depth: 100, quality: 100, date: oldDate });

    const scored = scoreEvidence(e, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);
    assert.strictEqual(scored.recencyMultiplier, 0.5);
    // (0.6 * 100 + 0.4 * 100) * 0.5 = 50
    assert.strictEqual(scored.evidenceScore, 50);

    const result = aggregateSkillScore('core-skill', sampleCoreSkill, [scored], DEFAULT_SCORING_CONFIG_V1);
    assert.strictEqual(result.skillScore, 50);
  });

  // Scenario 13: Recent weak evidence: does not overwhelm strong evidence
  await t.test('13. Recent weak evidence: does not overwhelm strong evidence', () => {
    // Strong older evidence: e.g. 18 months old -> recency 0.75, base 90 -> score 67.5
    // Recent weak evidence: 1 month old -> recency 1.0, base 20 -> score 20
    const olderStrong = makePracticalEvidence({
      id: 'strong',
      artifactId: 'art-strong',
      depth: 90,
      quality: 90,
      recencyMultiplier: 0.8, // 90 * 0.8 = 72
    });
    const recentWeak = makePracticalEvidence({
      id: 'weak',
      artifactId: 'art-weak',
      depth: 20,
      quality: 20,
      recencyMultiplier: 1.0, // 20 * 1.0 = 20
    });

    const scored = [
      scoreEvidence(olderStrong, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE),
      scoreEvidence(recentWeak, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE),
    ];
    const result = aggregateSkillScore('core-skill', sampleCoreSkill, scored, DEFAULT_SCORING_CONFIG_V1);

    // Peak is 72. Threshold is 36. 20 < 36 -> does NOT qualify.
    assert.strictEqual(result.skillScore, 72);
    assert.strictEqual(result.breakdown.practical.qualifyingArtifactCount, 1);
  });

  // Scenario 14: CORE gate: CORE skill <40 prevents READY/CLOSE beyond NEEDS_WORK
  await t.test('14. CORE gate: CORE skill <40 forces tier to NEEDS_WORK', () => {
    const roleSkills: RoleSkillInput[] = [
      { skillId: 's1', skillName: 'Core 1', importance: 'CORE', weight: 4, frameworkVersion: 'mvp-1' },
      { skillId: 's2', skillName: 'Core 2', importance: 'CORE', weight: 4, frameworkVersion: 'mvp-1' },
      { skillId: 's3', skillName: 'Important 1', importance: 'IMPORTANT', weight: 3, frameworkVersion: 'mvp-1' },
    ];

    // s1 has high score (90), s2 has low score (35) triggering CORE gate, s3 has high score (95)
    // Weighted avg: (90*4 + 35*4 + 95*3) / (4+4+3) = (360 + 140 + 285) / 11 = 785 / 11 = 71.36 (normally CLOSE)
    const input: ReadinessInput = {
      targetRoleId: 'test-role',
      frameworkVersion: 'mvp-1',
      roleSkills,
      evaluationDate: EVAL_DATE,
      evidence: [
        {
          id: 'ev-1',
          title: 'Project 1',
          type: 'PROJECT',
          category: 'PRACTICAL',
          activityDate: RECENT_DATE,
          artifactId: 'art-1',
          skills: [{ skillId: 's1', questionSetVersion: 'v1', practicalDepth: 90, quality: 90 }],
        },
        {
          id: 'ev-2',
          title: 'Project 2',
          type: 'PROJECT',
          category: 'PRACTICAL',
          activityDate: RECENT_DATE,
          artifactId: 'art-2',
          skills: [{ skillId: 's2', questionSetVersion: 'v1', practicalDepth: 35, quality: 35 }],
        },
        {
          id: 'ev-3',
          title: 'Project 3',
          type: 'PROJECT',
          category: 'PRACTICAL',
          activityDate: RECENT_DATE,
          artifactId: 'art-3',
          skills: [{ skillId: 's3', questionSetVersion: 'v1', practicalDepth: 95, quality: 95 }],
        },
      ],
    };

    const output = calculateReadiness(input);
    assert.strictEqual(output.overall.rawTierBeforeCoreGate, 'CLOSE');
    assert.strictEqual(output.overall.coreGateTriggered, true);
    assert.deepStrictEqual(output.overall.coreGateSkillIds, ['s2']);
    assert.strictEqual(output.overall.readinessTier, 'NEEDS_WORK');
  });

  // Scenario 15: Weighted role average: verify exact calculation
  await t.test('15. Weighted role average: exact calculation', () => {
    const roleSkills: RoleSkillInput[] = [
      { skillId: 'core', skillName: 'Core', importance: 'CORE', weight: 4, frameworkVersion: 'mvp-1' },
      { skillId: 'imp', skillName: 'Important', importance: 'IMPORTANT', weight: 3, frameworkVersion: 'mvp-1' },
      { skillId: 'use', skillName: 'Useful', importance: 'USEFUL', weight: 2, frameworkVersion: 'mvp-1' },
      { skillId: 'opt', skillName: 'Optional', importance: 'OPTIONAL', weight: 1, frameworkVersion: 'mvp-1' },
    ];

    // Scores: core=80, imp=60, use=70, opt=50
    // Weighted sum = 80*4 + 60*3 + 70*2 + 50*1 = 320 + 180 + 140 + 50 = 690
    // Total weight = 4 + 3 + 2 + 1 = 10
    // Expected avg = 69.0
    const input: ReadinessInput = {
      targetRoleId: 'test-role',
      frameworkVersion: 'mvp-1',
      roleSkills,
      evaluationDate: EVAL_DATE,
      evidence: [
        {
          id: 'e1',
          title: 'E1',
          type: 'PROJECT',
          category: 'PRACTICAL',
          activityDate: RECENT_DATE,
          artifactId: 'a1',
          skills: [
            { skillId: 'core', questionSetVersion: 'v1', practicalDepth: 80, quality: 80 },
            { skillId: 'imp', questionSetVersion: 'v1', practicalDepth: 60, quality: 60 },
            { skillId: 'use', questionSetVersion: 'v1', practicalDepth: 70, quality: 70 },
            { skillId: 'opt', questionSetVersion: 'v1', practicalDepth: 50, quality: 50 },
          ],
        },
      ],
    };

    const output = calculateReadiness(input);
    assert.strictEqual(output.overall.overallScore, 69.0);
    assert.strictEqual(output.overall.readinessTier, 'NEEDS_WORK'); // 69 is Needs Work (< 70)
  });

  // Scenario 16: Confidence does not change score
  await t.test('16. Confidence does not change score', () => {
    // Portfolio A: 1 project representation (score 90) -> LOW confidence
    const evA = makePracticalEvidence({ id: 'a1', artifactId: 'art-1', depth: 90, quality: 90 });
    const resA = aggregateSkillScore('core', sampleCoreSkill, [scoreEvidence(evA, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE)], DEFAULT_SCORING_CONFIG_V1);

    // Portfolio B: Same project + 2 corroborating representations (GitHub + Demo) -> HIGH/MEDIUM confidence
    const evB1 = makePracticalEvidence({ id: 'b1', artifactId: 'art-1', depth: 90, quality: 90 });
    const evB2 = makePracticalEvidence({ id: 'b2', artifactId: 'art-1', depth: 88, quality: 88 });
    const evB3 = makePracticalEvidence({ id: 'b3', artifactId: 'art-1', depth: 85, quality: 85 });
    const scoredB = [evB1, evB2, evB3].map((e) => scoreEvidence(e, DEFAULT_SCORING_CONFIG_V1, EVAL_DATE));
    const resB = aggregateSkillScore('core', sampleCoreSkill, scoredB, DEFAULT_SCORING_CONFIG_V1);

    // Scores MUST be identical: 90
    assert.strictEqual(resA.skillScore, 90);
    assert.strictEqual(resB.skillScore, 90);
    // But confidence is different
    assert.strictEqual(resA.confidence, 'LOW');
    assert.notStrictEqual(resB.confidence, 'LOW');
  });

  // Scenario 17: Determinism: same input + config + evaluationDate -> identical output
  await t.test('17. Determinism: identical outputs across runs', () => {
    const input: ReadinessInput = {
      targetRoleId: 'swe-intern',
      frameworkVersion: 'mvp-1',
      roleSkills: [sampleCoreSkill],
      evaluationDate: EVAL_DATE,
      evidence: [
        {
          id: 'ev-1',
          title: 'Project 1',
          type: 'PROJECT',
          category: 'PRACTICAL',
          activityDate: RECENT_DATE,
          artifactId: 'art-1',
          skills: [{ skillId: 'core-skill', questionSetVersion: 'v1', practicalDepth: 88, quality: 92 }],
        },
      ],
    };

    const out1 = calculateReadiness(input);
    const out2 = calculateReadiness(input);
    assert.deepStrictEqual(out1, out2);
  });

  // Scenario 18: Invalid input handling
  await t.test('18. Invalid input handling rejects malformed data', () => {
    // NaN
    assert.throws(() => {
      scoreEvidence(makePracticalEvidence({ id: 'bad', artifactId: 'a', depth: NaN, quality: 90 }), DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);
    });

    // Infinity
    assert.throws(() => {
      scoreEvidence(makePracticalEvidence({ id: 'bad', artifactId: 'a', depth: Infinity, quality: 90 }), DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);
    });

    // Negative score
    assert.throws(() => {
      scoreEvidence(makePracticalEvidence({ id: 'bad', artifactId: 'a', depth: -5, quality: 90 }), DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);
    });

    // Score > 100
    assert.throws(() => {
      scoreEvidence(makePracticalEvidence({ id: 'bad', artifactId: 'a', depth: 105, quality: 90 }), DEFAULT_SCORING_CONFIG_V1, EVAL_DATE);
    });

    // Future activityDate
    assert.throws(() => {
      scoreEvidence(
        makePracticalEvidence({ id: 'bad', artifactId: 'a', depth: 90, quality: 90, date: '2027-01-01T00:00:00.000Z' }),
        DEFAULT_SCORING_CONFIG_V1,
        EVAL_DATE
      );
    });

    // Invalid recency multiplier (< 0.5)
    assert.throws(() => {
      scoreEvidence(
        makePracticalEvidence({ id: 'bad', artifactId: 'a', depth: 90, quality: 90, recencyMultiplier: 0.3 }),
        DEFAULT_SCORING_CONFIG_V1,
        EVAL_DATE
      );
    });
  });
});
