/**
 * Main Readiness Engine Entrypoint.
 *
 * Exposes the pure, deterministic `calculateReadiness` function.
 *
 * Invariants:
 * - Pure TypeScript
 * - Deterministic: same inputs + config + evaluationDate => identical output
 * - Zero side effects
 * - Never calls Date.now() or reads system clock
 * - No dependency on Prisma, Express, HTTP, PostgreSQL
 *
 * Reference: docs/SCORING_MODEL.md; docs/ARCHITECTURE.md §5
 */

import { DEFAULT_SCORING_CONFIG_V1 } from './config/default-scoring-config';
import { scoreEvidence } from './scoring/evidence-scorer';
import { computeRoleReadiness } from './scoring/role-readiness';
import { computeSkillGaps } from './scoring/skill-gaps';
import { aggregateSkillScore } from './scoring/skill-scorer';
import { ScoringConfig } from './types/config';
import { ScoredEvidenceItem, SkillEvidenceInput } from './types/evidence';
import {
  ExcludedEvidenceItem,
  ReadinessInput,
  ReadinessOutput,
  SkillAssessmentOutput,
} from './types/scoring';
import { isQuestionSetVersionCompatible, validateDate } from './validation/validator';

/**
 * Calculates deterministic internship readiness for a target role from student evidence.
 *
 * @param input - Readiness input containing target role, skills, evidence, and explicit evaluationDate
 * @param configOverride - Optional custom scoring configuration (defaults to canonical v1 baseline)
 * @returns Fully auditable ReadinessOutput with overall score, per-skill assessments, gaps, and explanations
 */
export function calculateReadiness(
  input: ReadinessInput,
  configOverride?: ScoringConfig
): ReadinessOutput {
  const config = configOverride ?? input.scoringConfig ?? DEFAULT_SCORING_CONFIG_V1;

  // Validate evaluationDate is an explicit, valid date
  const evalDate = validateDate(input.evaluationDate, 'evaluationDate');
  const evalDateIso = evalDate.toISOString();

  const excludedEvidence: ExcludedEvidenceItem[] = [];

  // Group evidence by skillId
  const evidenceBySkill = new Map<string, SkillEvidenceInput[]>();

  // Initialize entry for all target role skills
  for (const rs of input.roleSkills) {
    evidenceBySkill.set(rs.skillId, []);
  }

  // Process all submitted evidence
  for (const ev of input.evidence) {
    for (const sk of ev.skills) {
      // Version compatibility check (ADR-025)
      if (!isQuestionSetVersionCompatible(sk.questionSetVersion, config)) {
        excludedEvidence.push({
          evidenceId: ev.id,
          title: ev.title,
          skillId: sk.skillId,
          reason: 'REQUIRES_REANSWERING',
          questionSetVersion: sk.questionSetVersion,
          details: `Question-set version "${sk.questionSetVersion}" is not compatible with active version "${config.activeQuestionSetVersion ?? 'v1'}". Evidence must be re-answered to be included in new scoring run.`,
        });
        continue;
      }

      const skillItem: SkillEvidenceInput = {
        evidenceId: ev.id,
        title: ev.title,
        type: ev.type as any,
        category: ev.category,
        activityDate: ev.activityDate,
        artifactId: ev.artifactId,
        corroboratesArtifactId: ev.corroboratesArtifactId ?? null,
        questionSetVersion: sk.questionSetVersion,
        practicalDepth: sk.practicalDepth,
        quality: sk.quality,
        score: sk.score,
        recencyMultiplier: ev.recencyMultiplier,
      };

      const list = evidenceBySkill.get(sk.skillId);
      if (list) {
        list.push(skillItem);
      } else {
        // Evidence for a skill not currently in the role framework
        evidenceBySkill.set(sk.skillId, [skillItem]);
      }
    }
  }

  // Assess each role skill
  const skillAssessments: SkillAssessmentOutput[] = [];

  for (const roleSkill of input.roleSkills) {
    const rawItems = evidenceBySkill.get(roleSkill.skillId) ?? [];

    // Score individual evidence items
    const scoredItems: ScoredEvidenceItem[] = [];
    for (const rawItem of rawItems) {
      const scored = scoreEvidence(rawItem, config, evalDate);
      scoredItems.push(scored);
    }

    // Aggregate skill score
    const skillAssessment = aggregateSkillScore(roleSkill.skillId, roleSkill, scoredItems, config);
    skillAssessments.push(skillAssessment);
  }

  // Compute overall role readiness & CORE gate
  const overall = computeRoleReadiness(
    skillAssessments,
    input.roleSkills,
    config,
    evalDate,
    input.frameworkVersion
  );

  // Compute skill gaps and priorities
  const skillGaps = computeSkillGaps(skillAssessments, input.roleSkills, config);

  return {
    overall,
    skills: skillAssessments,
    skillGaps,
    excludedEvidence,
    evaluationDate: evalDateIso,
  };
}
