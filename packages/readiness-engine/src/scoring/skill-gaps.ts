/**
 * Skill Gaps and Action-Plan Prioritization Module.
 *
 * Computes skill gaps against target internship requirements and calculates
 * deterministic priority scores for action planning.
 *
 * Reference: docs/API_SPEC.md §6; docs/ARCHITECTURE.md §5
 */

import { ScoringConfig } from '../types/config';
import { RoleSkillInput } from '../types/role';
import { SkillAssessmentOutput, SkillGapOutput } from '../types/scoring';

/**
 * Target score by importance level for an intern role:
 * - CORE: 85 (Ready tier threshold)
 * - IMPORTANT: 70 (Close tier threshold)
 * - USEFUL: 60
 * - OPTIONAL: 50
 */
const TARGET_SCORES_BY_IMPORTANCE: Readonly<Record<string, number>> = {
  CORE: 85,
  IMPORTANT: 70,
  USEFUL: 60,
  OPTIONAL: 50,
};

/**
 * Computes skill gaps and priority scores for all role skills.
 *
 * Priority Score calculation:
 * PriorityScore = (Gap * Weight) + (isCoreGateTrigger ? 200 : 0)
 *
 * This ensures that failing CORE gate skills receive top priority for student action plans.
 */
export function computeSkillGaps(
  skillAssessments: SkillAssessmentOutput[],
  roleSkills: RoleSkillInput[],
  config: ScoringConfig
): SkillGapOutput[] {
  const assessmentMap = new Map<string, SkillAssessmentOutput>();
  for (const sa of skillAssessments) {
    assessmentMap.set(sa.skillId, sa);
  }

  const gaps: SkillGapOutput[] = [];

  for (const rs of roleSkills) {
    const assessment = assessmentMap.get(rs.skillId);
    const currentScore = assessment ? assessment.skillScore : 0;
    const targetScore = TARGET_SCORES_BY_IMPORTANCE[rs.importance] ?? config.tierReadyMin;
    const gap = Math.max(0, targetScore - currentScore);

    const isCoreGateTrigger = rs.importance === 'CORE' && currentScore < config.coreGateMin;

    // Weight * gap, boosted by 200 if triggering CORE gate
    const priorityScore = gap * rs.weight + (isCoreGateTrigger ? 200 : 0);

    const recommendation = generateRecommendation({
      skillName: rs.skillName ?? rs.skillId,
      importance: rs.importance,
      currentScore,
      isCoreGateTrigger,
      practicalCount: assessment?.practicalArtifactCount ?? 0,
      certCount: assessment?.certificateCount ?? 0,
    });

    gaps.push({
      skillId: rs.skillId,
      skillName: rs.skillName,
      importance: rs.importance,
      weight: rs.weight,
      currentScore,
      targetScore,
      gap,
      priorityScore,
      isCoreGateTrigger,
      recommendation,
    });
  }

  // Sort gaps by priorityScore descending, then skillId ascending
  gaps.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return a.skillId.localeCompare(b.skillId);
  });

  return gaps;
}

function generateRecommendation(params: {
  skillName: string;
  importance: string;
  currentScore: number;
  isCoreGateTrigger: boolean;
  practicalCount: number;
  certCount: number;
}): string {
  if (params.isCoreGateTrigger) {
    return `CRITICAL: ${params.skillName} is a CORE requirement below 40. Build and deploy a substantial practical project demonstrating this skill to clear the readiness gate.`;
  }
  if (params.currentScore === 0) {
    return `No evidence for ${params.skillName}. Create an initial practical project or coursework demonstration.`;
  }
  if (params.practicalCount === 0 && params.certCount > 0) {
    return `You have certificate exposure in ${params.skillName}, but practical depth is required to advance beyond 40. Build a hands-on project.`;
  }
  if (params.currentScore < 70) {
    return `Strengthen ${params.skillName} by adding a second qualifying practical project to demonstrate repeatability.`;
  }
  if (params.currentScore < 85) {
    return `Solid demonstration in ${params.skillName}. Consider adding test coverage or corroborating artifacts to achieve Ready status.`;
  }
  return `Strong capability demonstrated in ${params.skillName}. Maintain recency before internship applications.`;
}
